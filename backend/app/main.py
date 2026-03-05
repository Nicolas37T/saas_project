from fastapi import FastAPI, Request, HTTPException
from sqlmodel import SQLModel, Session, select
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
import uuid

from app.db.session import engine
from app.db.models import Plan, Tenant, UserGlobal, Subscription, UserRole
from app.core.middleware import tenant_middleware
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.auth import LoginRequest, Token
from app.schemas.tenant import TenantCreate
from app.utils.provisioning import create_tenant_db, create_tenant_schema

# ─── Aplicación ───────────────────────────────────────────────────────────────
app = FastAPI(title="SaaS Multi-tenancy Manager")

import os

# ─── Middlewares ──────────────────────────────────────────────────────────────
# IMPORTANTE: El último en añadirse es el primero en ejecutarse.
app.add_middleware(BaseHTTPMiddleware, dispatch=tenant_middleware)

# Configuración de CORS
origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    """Crea las tablas y hace seed de los datos iniciales al arrancar."""
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # 1. Seed de Roles
        for role_name, desc in [
            ("superadmin", "Administrador de la plataforma SaaS"),
            ("owner",      "Dueño de un negocio (tenant)"),
        ]:
            if not session.exec(select(UserRole).where(UserRole.name == role_name)).first():
                session.add(UserRole(name=role_name, description=desc))
        session.commit()

        # 2. Seed de Planes
        for plan_name, price, max_u, strategy in [
            ("Plan Básico", 10.0, 5,  "schema"),
            ("Plan Pro",    30.0, 20, "schema"),
            ("Plan Enterprise", 50.0, 100, "database"),
        ]:
            if not session.exec(select(Plan).where(Plan.name == plan_name)).first():
                session.add(Plan(name=plan_name, price=price, billing_cycle="monthly", max_users=max_u, strategy=strategy))
        session.commit()

        # 3. Seed del Superadmin (sólo si no existe)
        if not session.exec(select(UserGlobal).where(UserGlobal.email == "admin@saas.com")).first():
            superadmin_role = session.exec(select(UserRole).where(UserRole.name == "superadmin")).first()
            session.add(UserGlobal(
                email="admin@saas.com",
                full_name="Super Administrador",
                password_hash=get_password_hash("admin1234"),
                is_verified=True,
                role_id=superadmin_role.id,
            ))
            session.commit()
            print("✅ Superadmin creado: admin@saas.com / admin1234")


# ─── Rutas básicas ────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"message": "SaaS Management API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/plans")
def get_public_plans():
    """Retorna los planes disponibles para mostrar en el formulario de registro."""
    with Session(engine) as session:
        plans = session.exec(select(Plan)).all()
        return [
            {
                "id": str(p.id),
                "name": p.name,
                "price": p.price,
                "billing_cycle": p.billing_cycle,
                "max_users": p.max_users,
            }
            for p in plans
        ]


# ─── Registro de Tenant ───────────────────────────────────────────────────────
@app.post("/register")
async def register_tenant(data: TenantCreate):
    """Registra un nuevo negocio y crea su base de datos aislada vacía."""
    print(f"Solicitud de registro: {data.business_name} ({data.subdomain})")
    db_name = f"db_{data.subdomain}"

    with Session(engine) as session:
        if session.exec(select(Tenant).where(Tenant.subdomain == data.subdomain)).first():
            raise HTTPException(status_code=400, detail="El subdominio ya está en uso")
        if session.exec(select(UserGlobal).where(UserGlobal.email == data.email)).first():
            raise HTTPException(status_code=400, detail="El correo ya está registrado")

    # Obtener el plan para determinar la estrategia
    with Session(engine) as session:
        try:
            plan_uuid = uuid.UUID(data.plan_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de plan inválido")
            
        plan = session.exec(select(Plan).where(Plan.id == plan_uuid)).first()
        if not plan:
            raise HTTPException(status_code=404, detail="El plan seleccionado no existe")
        
        strategy = plan.strategy or "schema"

    # Aprovisionamiento según la estrategia del plan
    print(f"Aprovisionando tenant con estrategia: {strategy}...")
    if strategy == "database":
        if not create_tenant_db(db_name=db_name):
            raise HTTPException(status_code=500, detail="Error al provisionar la base de datos del negocio")
    else:
        # Para esquema, usamos el subdominio como nombre de esquema
        if not create_tenant_schema(schema_name=data.subdomain):
             raise HTTPException(status_code=500, detail="Error al provisionar el esquema del negocio")

    with Session(engine) as session:
        # (Ya tenemos el plan cargado arriba, pero lo re-obtenemos en esta sesión para evitar errores de detachement)
        plan = session.get(Plan, plan_uuid)
        owner_role = session.exec(select(UserRole).where(UserRole.name == "owner")).first()

        try:
            # Crear usuario global con rol 'owner'
            new_user = UserGlobal(
                email=data.email,
                full_name=data.business_name,
                password_hash=get_password_hash(data.password),
                role_id=owner_role.id,
            )
            session.add(new_user)
            session.flush()

            # Crear tenant
            new_tenant = Tenant(
                business_name=data.business_name,
                business_type=data.business_type,
                subdomain=data.subdomain,
                domain=data.domain,
                db_name=db_name,
                plan_id=plan.id,
                strategy=strategy,
                created_by=new_user.id,
            )
            session.add(new_tenant)
            session.flush()

            # Vincular el tenant al usuario
            new_user.tenant_id = new_tenant.id
            session.add(new_user)
            
            # --- CREAR SUSCRIPCIÓN ---
            from datetime import datetime
            from dateutil.relativedelta import relativedelta
            
            # Por defecto da 1 mes de servicio desde hoy
            start_date = datetime.utcnow()
            end_date = start_date + relativedelta(months=1)
            
            new_sub = Subscription(
                tenant_id=new_tenant.id,
                plan_id=plan.id,
                status="active",
                start_date=start_date,
                end_date=end_date,
                external_id=None
            )
            session.add(new_sub)
            # -------------------------

            session.commit()

            print(f"✅ Registro completado: {data.subdomain} (Plan: {plan.name})")
            return {"message": "Registro exitoso", "subdomain": data.subdomain}

        except Exception as e:
            session.rollback()
            print(f"❌ Error al guardar en BD Maestra: {e}")
            raise HTTPException(status_code=500, detail=f"Error al guardar los registros: {str(e)}")


# ─── Login Global ─────────────────────────────────────────────────────────────
@app.post("/auth/login", response_model=Token)
async def login(data: LoginRequest):
    """
    Login para la plataforma global.
    - superadmin  → va al panel de administración
    - owner       → va al dashboard de su negocio
    """
    with Session(engine) as session:
        user = session.exec(select(UserGlobal).where(UserGlobal.email == data.email)).first()

        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        # Cargar el rol del usuario
        role = session.get(UserRole, user.role_id)
        role_name = role.name if role else "owner"

        # Obtener subdominio y validar estado si es owner
        subdomain = None
        if role_name == "owner" and user.tenant_id:
            tenant = session.get(Tenant, user.tenant_id)
            if tenant:
                if tenant.status == "suspended":
                    raise HTTPException(status_code=403, detail="Su cuenta de negocio se encuentra suspendida o inactiva.")
                subdomain = tenant.subdomain

        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": role_name,
        }
        access_token = create_access_token(data=token_data)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": role_name,
            "subdomain": subdomain,
        }


# ─── Routers ──────────────────────────────────────────────────────────────────
from app.routers import admin as admin_router
app.include_router(admin_router.router)
