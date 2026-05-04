from fastapi import FastAPI, Request, HTTPException
from sqlmodel import SQLModel, Session, select
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid

from app.db.session import engine
from app.db.models import Plan, Tenant, UserGlobal, Subscription, UserRole
from app.core.middleware import tenant_middleware
from app.core.security import get_password_hash, verify_password, create_access_token, create_reset_token, verify_reset_token
from app.schemas.auth import LoginRequest, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.tenant import TenantCreate
from app.utils.provisioning import create_tenant_db, create_tenant_schema, seed_tenant_defaults
from app.utils.email import send_reset_email
from app.core.config import settings as app_settings

# ─── Aplicación ───────────────────────────────────────────────────────────────
app = FastAPI(title="SaaS Multi-tenancy Manager")

# ─── Middlewares ──────────────────────────────────────────────────────────────

# 1. Tenant Middleware
@app.middleware("http")
async def tenant_middleware_wrapper(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    
    try:
        return await tenant_middleware(request, call_next)
    except HTTPException as e:
        # Preservar errores 404, 401, etc. del middleware de tenant
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
    except Exception as e:
        import traceback
        print(f"ERROR CRÍTICO EN API: {str(e)}")
        traceback.print_exc()
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500, 
            content={"detail": f"Error interno: {str(e)}"}
        )

# 2. CORS (Se añade al FINAL para que sea el middleware más EXTERNO)
# Esto garantiza que las cabeceras CORS se añadan incluso si hay un error en el middleware de tenant.
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")]
if "*" not in origins:
    # Añadir variantes comunes de localhost si no están
    for loc in ["http://localhost:3000", "http://127.0.0.1:3000"]:
        if loc not in origins:
            origins.append(loc)

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
    # Solo crear modelos globales en el schema public, no mezclar con tenant_models
    global_models = [UserRole, Plan, Tenant, UserGlobal, Subscription]
    global_tables = [m.__table__ for m in global_models]
    SQLModel.metadata.create_all(engine, tables=global_tables)

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
            ("Plan Enterprise", 50.0, 100, "schema"), # Cambiado a schema para Railway
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
    import re
    if not re.match(r"^[a-z0-9_]+$", data.subdomain):
        raise HTTPException(status_code=400, detail="El subdominio solo puede contener letras minúsculas, números y guiones bajos")

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
            from datetime import timedelta
            from app.core.timezone import now_bolivia
            from dateutil.relativedelta import relativedelta
            
            # Definir duración según la configuración del plan (trial_days)
            start_date = now_bolivia()
            duration_days = getattr(plan, "trial_days", 30)
            end_date = start_date + timedelta(days=duration_days)
            print(f"Plan {plan.name}: Duración de {duration_days} días (vence: {end_date})")
            
            # Determinar estado inicial: Planes gratuitos o de prueba corta (<= 5 días) comienzan activos.
            # Planes de pago o mayor duración comienzan suspendidos hasta confirmar pago.
            initial_status = "active" if (plan.price == 0 or plan.trial_days <= 5) else "suspended"
            print(f"Estado inicial para {plan.name}: {initial_status}")

            new_sub = Subscription(
                tenant_id=new_tenant.id,
                plan_id=plan.id,
                status=initial_status,
                start_date=start_date,
                end_date=end_date,
                external_id=None
            )
            session.add(new_sub)
            
            new_tenant.status = initial_status
            session.add(new_tenant)

            session.commit()

            print(f"✅ Registro completado: {data.subdomain} (Plan: {plan.name})")

            # ─── Seed de roles y admin en el schema del tenant ──────────────
            # Guardar datos antes de cerrar la sesión
            owner_email = new_user.email
            owner_password_hash = new_user.password_hash
            owner_full_name = new_user.full_name or data.business_name

        except Exception as e:
            session.rollback()
            print(f"❌ Error al guardar en BD Maestra: {e}")
            raise HTTPException(status_code=500, detail=f"Error al guardar los registros: {str(e)}")

    # Correr el seed FUERA del bloque de sesión principal para evitar conflictos
    seed_result = seed_tenant_defaults(
        schema_name=data.subdomain,
        owner_email=owner_email,
        owner_password_hash=owner_password_hash,
        owner_full_name=owner_full_name,
        strategy=strategy,
        db_name=db_name,
    )
    if not seed_result:
        print(f"⚠️ El seed de defaults falló para {data.subdomain}, pero el tenant fue creado.")

    return {"message": "Registro exitoso", "subdomain": data.subdomain}


@app.get("/auth/tenants")
def get_public_tenants():
    """Devuelve la lista de clínicas activas para el selector de login."""
    with Session(engine) as session:
        tenants = session.exec(
            select(Tenant)
            .where((Tenant.status == "active") | (Tenant.status == "created"))
        ).all()
        return [{"subdomain": t.subdomain, "name": t.business_name or t.subdomain} for t in tenants]

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
        tenant_status = None
        if role_name == "owner" and user.tenant_id:
            tenant = session.get(Tenant, user.tenant_id)
            if tenant:
                # Verificación de vencimiento de suscripción
                from datetime import datetime
                active_sub = session.exec(
                    select(Subscription)
                    .where(Subscription.tenant_id == tenant.id)
                    .order_by(Subscription.end_date.desc())
                ).first()
                from app.core.timezone import now_bolivia
                if active_sub and active_sub.end_date and active_sub.end_date < now_bolivia():
                    # Si ha vencido, actualizamos estados
                    if tenant.status != "suspended":
                        tenant.status = "suspended"
                        session.add(tenant)
                        session.commit()
                        session.refresh(tenant)

                subdomain = tenant.subdomain
                tenant_status = tenant.status

        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "full_name": user.full_name or "",
            "role": role_name,
        }
        access_token = create_access_token(data=token_data)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": role_name,
            "subdomain": subdomain,
            "tenant_status": tenant_status,
        }


# ─── Recuperación de Contraseña ───────────────────────────────────────────────

def _get_tenant_session(tenant):
    """Helper para obtener una sesión del tenant según su estrategia."""
    from app.db.session import get_tenant_engine
    from sqlmodel import text
    
    if tenant.strategy == "database":
        tenant_eng = get_tenant_engine(tenant.db_name)
        return Session(tenant_eng)
    else:
        conn = engine.connect()
        conn.execute(text(f'SET search_path TO "{tenant.subdomain}", public'))
        conn.commit()
        return Session(conn)


@app.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """
    Solicita un enlace de recuperación de contraseña.
    Si no hay proveedor de email configurado, retorna el enlace directamente.
    """
    frontend_url = app_settings.FRONTEND_URL
    reset_link = None
    email_sent = False

    # Verificar si es un usuario global primero (Dueños y Superadmins)
    is_global_user = False
    with Session(engine) as session:
        global_user = session.exec(
            select(UserGlobal).where(UserGlobal.email == data.email)
        ).first()
        if global_user:
            is_global_user = True
            try:
                if not global_user.reset_approved:
                    global_user.reset_requested = True
                    session.add(global_user)
                    session.commit()
                    return {"message": "Solicitud de recuperación enviada. Por favor espera a que el Equipo de TRZ CORP apruebe tu solicitud y se comunique con su persona."}
                else:
                    token = create_reset_token(email=global_user.email, user_type="global")
                    reset_link = f"{frontend_url}/reset-password?token={token}"
                    email_sent = False
            except Exception as e:
                print(f"⚠️ Error en forgot-password (global): {e}")

    # Si no es un usuario global, entonces es un empleado regular de un tenant
    if not is_global_user and data.tenant_subdomain:
        try:
            tenant = None
            with Session(engine) as session:
                tenant = session.exec(
                    select(Tenant).where(Tenant.subdomain == data.tenant_subdomain)
                ).first()

            if tenant:
                from app.db.tenant_models import User as TenantUser
                with _get_tenant_session(tenant) as t_session:
                    user = t_session.exec(
                        select(TenantUser).where(
                            (TenantUser.email == data.email) | (TenantUser.username == data.email)
                        )
                    ).first()
                    if user and user.status:
                        if not user.reset_approved:
                            user.reset_requested = True
                            t_session.add(user)
                            t_session.commit()
                            return {"message": "Solicitud de recuperación enviada. Por favor espera a que el Administrador de la clínica la apruebe."}
                        else:
                            token = create_reset_token(
                                email=user.email,
                                user_type="employee",
                                tenant_subdomain=data.tenant_subdomain
                            )
                            reset_link = f"{frontend_url}/reset-password?token={token}"
                            email_sent = False
        except Exception as e:
            print(f"⚠️ Error en forgot-password (employee): {e}")

    # Si el email no se envió correctamente, devolver el enlace directamente
    response = {"message": "Si el correo existe en nuestro sistema, recibirás un enlace de recuperación."}
    if not email_sent and reset_link:
        response["reset_link"] = reset_link
    
    return response


@app.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """
    Restablece la contraseña usando un token de recuperación válido.
    """
    # Validar longitud mínima
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    # Verificar token
    payload = verify_reset_token(data.token)
    if not payload:
        raise HTTPException(status_code=400, detail="El enlace de recuperación es inválido o ha expirado.")

    email = payload.get("sub")
    user_type = payload.get("user_type", "global")
    tenant_subdomain = payload.get("tenant")

    new_hash = get_password_hash(data.new_password)

    # Caso: Empleado de un tenant
    if user_type == "employee" and tenant_subdomain:
        with Session(engine) as session:
            tenant = session.exec(
                select(Tenant).where(Tenant.subdomain == tenant_subdomain)
            ).first()
            if not tenant:
                raise HTTPException(status_code=400, detail="El negocio asociado no fue encontrado.")

        from app.db.tenant_models import User as TenantUser
        with _get_tenant_session(tenant) as t_session:
            user = t_session.exec(
                select(TenantUser).where(TenantUser.email == email)
            ).first()
            if not user:
                raise HTTPException(status_code=400, detail="Usuario no encontrado.")
            user.password_hash = new_hash
            user.reset_requested = False
            user.reset_approved = False
            t_session.add(user)
            t_session.commit()

    # Caso: Usuario global
    else:
        with Session(engine) as session:
            user = session.exec(
                select(UserGlobal).where(UserGlobal.email == email)
            ).first()
            if not user:
                raise HTTPException(status_code=400, detail="Usuario no encontrado.")
            user.password_hash = new_hash
            user.reset_requested = False
            user.reset_approved = False
            session.add(user)
            
            tenants = session.exec(
                select(Tenant).where(Tenant.created_by == user.id)
            ).all()
            
            if user.tenant_id and not any(t.id == user.tenant_id for t in tenants):
                t_dir = session.get(Tenant, user.tenant_id)
                if t_dir:
                    tenants.append(t_dir)
            
            session.commit()
            
            # Sync passwords to tenant databases while the tenants are still bound
            from app.db.tenant_models import User as TenantUser
            for tenant in tenants:
                try:
                    with _get_tenant_session(tenant) as t_session:
                        t_user = t_session.exec(
                            select(TenantUser).where(TenantUser.email == email)
                        ).first()
                        if t_user:
                            t_user.password_hash = new_hash
                            t_user.reset_requested = False
                            t_user.reset_approved = False
                            t_session.add(t_user)
                            t_session.commit()
                except Exception as e:
                    print(f"⚠️ Error syncing password to tenant {tenant.subdomain}: {e}")

    return {"message": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión."}


# ─── Routers ──────────────────────────────────────────────────────────────────
from app.routers import admin as admin_router
from app.routers import patients, treatments, appointments, payments, odontograms, settings, employees, medicines, treatment_catalog, stats, billing

app.include_router(admin_router.router)
app.include_router(patients.router, prefix="/api/tenant", tags=["Tenant - Patients"])
app.include_router(treatments.router, prefix="/api/tenant", tags=["Tenant - Treatments"])
app.include_router(appointments.router, prefix="/api/tenant", tags=["Tenant - Appointments"])
app.include_router(payments.router, prefix="/api/tenant", tags=["Tenant - Payments"])
app.include_router(odontograms.router, prefix="/api/tenant", tags=["Tenant - Odontograms"])
app.include_router(settings.router, prefix="/api/tenant", tags=["Tenant - Settings"])
app.include_router(employees.auth_router, prefix="/api/tenant", tags=["Tenant - Auth"])
app.include_router(employees.router, prefix="/api/tenant", tags=["Tenant - Employees"])
app.include_router(medicines.router, prefix="/api/tenant", tags=["Tenant - Medicines"])
app.include_router(treatment_catalog.router, prefix="/api/tenant", tags=["Tenant - Treatment Catalog"])
app.include_router(stats.router, prefix="/api/tenant", tags=["Tenant - Stats"])
app.include_router(billing.router, prefix="/api/tenant", tags=["Tenant - Billing"])
