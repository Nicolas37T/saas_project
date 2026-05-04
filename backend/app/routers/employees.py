from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import uuid
from datetime import datetime
from app.core.timezone import now_bolivia

from app.db.session import get_session_for_tenant
from app.db.tenant_models import User, Role
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.deps import get_current_tenant_user
from app.db.models import UserGlobal, UserRole
from app.schemas.auth import LoginRequest, Token
from fastapi import Request

router = APIRouter(prefix="/employees", tags=["Employees"])
auth_router = APIRouter(tags=["Auth"])

# --- SCHEMAS ---

class RoleRead(BaseModel):
    id: uuid.UUID
    name: str

class EmployeeRead(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    full_name: Optional[str] = None
    role: Optional[RoleRead] = None
    status: bool
    created_at: datetime

class EmployeeCreate(BaseModel):
    username: Optional[str] = None
    email: EmailStr
    full_name: str
    password: str
    role_id: uuid.UUID

class EmployeeUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[uuid.UUID] = None
    status: Optional[bool] = None

# --- ENDPOINTS ---

@auth_router.post("/auth/login", response_model=Token)
def login_employee(
    data: LoginRequest,
    request: Request,
    session: Session = Depends(get_session_for_tenant)
):
    """Login específico para empleados de un tenant"""
    user = session.exec(select(User).where(
        (User.email == data.email) | (User.username == data.email)
    )).first()

    if not user or not user.status:
        raise HTTPException(status_code=401, detail="Credenciales inválidas o cuenta deshabilitada")
    
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    tenant_obj = getattr(request.state, "tenant", None)
    if not tenant_obj:
        raise HTTPException(status_code=400, detail="Tenant no especificado o inválido")
        
    role_name = user.role.name if getattr(user, "role", None) else "empleado"

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "full_name": user.full_name or "",
        "role": role_name,
        "is_employee": True,
        "tenant_subdomain": tenant_obj.subdomain
    }

    access_token = create_access_token(data=token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_name,
        "subdomain": tenant_obj.subdomain,
        "is_employee": True
    }

# ... (get_roles remains same)
@auth_router.get("/roles", response_model=List[RoleRead])
def get_roles(
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    """Lista los roles disponibles en el tenant"""
    roles = session.exec(select(Role)).all()
    return roles

@router.get("/", response_model=List[EmployeeRead])
def get_employees(
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    """Lista los empleados activos del tenant actual"""
    # Permitir a cualquier usuario autenticado ver la lista de empleados para asignaciones.

    # Filtrar solo empleados activos
    employees = session.exec(select(User).where(User.status == True)).all()
    return employees

@router.get("/doctors", response_model=List[EmployeeRead])
def get_doctors(
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    """Lista solo los empleados con rol DOCTOR que están activos"""
    doctors = session.exec(
        select(User)
        .join(Role, User.role_id == Role.id)
        .where(Role.name == "doctor")
        .where(User.status == True)
    ).all()
    return doctors

@router.post("/", response_model=EmployeeRead)
def create_employee(
    data: EmployeeCreate,
    request: Request,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    """Crea un nuevo empleado en el tenant"""
    # 1. Verificar permisos
    if getattr(current_user, "computed_role", "") not in ["admin", "superadmin", "owner"]:
         raise HTTPException(status_code=403, detail="No tienes permiso para crear empleados")

    # 1.5 Validar el límite de usuarios del plan
    tenant_obj = getattr(request.state, "tenant", None)
    if tenant_obj and tenant_obj.plan_id:
        from app.db.session import engine
        from app.db.models import Plan
        with Session(engine) as public_session:
            plan = public_session.get(Plan, tenant_obj.plan_id)
            if plan and plan.max_users:
                from sqlalchemy import func
                active_users = session.exec(select(func.count(User.id)).where(User.status == True)).one()
                if active_users >= plan.max_users:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Límite alcanzado: Tu plan actual ({plan.name}) sólo permite hasta {plan.max_users} usuarios activos."
                    )


    # 2. Verificar si ya existe
    existing_user = session.exec(select(User).where((User.email == data.email) | (User.username == data.username))).first()
    
    if existing_user:
        if existing_user.status:
            raise HTTPException(status_code=400, detail="El email o nombre de usuario ya está registrado y activo en este negocio")
        
        # SI EL USUARIO EXISTE PERO ESTÁ DESACTIVADO -> RE-ACTIVARLO
        # 3. Validar Rol existe
        role = session.get(Role, data.role_id)
        if not role:
            raise HTTPException(status_code=404, detail="El rol seleccionado no existe")
            
        existing_user.full_name = data.full_name
        existing_user.email = data.email
        # Si se envió un nuevo username (no vacío), usarlo. Si no, dejar el que tenía o generarlo si era vacío.
        if data.username:
            existing_user.username = data.username
        
        existing_user.password_hash = get_password_hash(data.password)
        existing_user.role_id = data.role_id
        existing_user.status = True
        existing_user.updated_at = now_bolivia()
        
        session.add(existing_user)
        session.commit()
        session.refresh(existing_user)
        return existing_user

    # 3. Validar Rol existe
    role = session.get(Role, data.role_id)
    if not role:
        raise HTTPException(status_code=404, detail="El rol seleccionado no existe")

    # 4. Procesar Username si es nulo o vacío
    username = data.username
    if not username:
        # Generar base del username desde el email
        base_username = data.email.split("@")[0].lower()
        username = base_username
        
        # Asegurar unicidad (en caso de que el prefijo del email ya exista)
        counter = 1
        while session.exec(select(User).where(User.username == username)).first():
            username = f"{base_username}{counter}"
            counter += 1

    # 5. Crear usuario
    db_user = User(
        username=username,
        email=data.email,
        full_name=data.full_name,
        password_hash=get_password_hash(data.password),
        role_id=data.role_id,
        status=True
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user

@router.put("/{employee_id}", response_model=EmployeeRead)
def update_employee(
    employee_id: uuid.UUID,
    data: EmployeeUpdate,
    request: Request,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    """Actualiza datos de un empleado"""
    # 1. Verificar permisos
    if getattr(current_user, "computed_role", "") not in ["admin", "superadmin", "owner"]:
         raise HTTPException(status_code=403, detail="No tienes permiso para editar empleados")

    db_user = session.get(User, employee_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Si se intenta reactivar un empleado, validar el límite de usuarios del plan
    if data.status is True and db_user.status is False:
        tenant_obj = getattr(request.state, "tenant", None)
        if tenant_obj and tenant_obj.plan_id:
            from app.db.session import engine
            from app.db.models import Plan
            with Session(engine) as public_session:
                plan = public_session.get(Plan, tenant_obj.plan_id)
                if plan and plan.max_users:
                    from sqlalchemy import func
                    active_users = session.exec(select(func.count(User.id)).where(User.status == True)).one()
                    if active_users >= plan.max_users:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Límite alcanzado: Tu plan actual ({plan.name}) sólo permite hasta {plan.max_users} usuarios activos. No puedes reactivar este usuario."
                        )

    update_data = data.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    if "role_id" in update_data:
        role = session.get(Role, update_data["role_id"])
        if not role:
            raise HTTPException(status_code=404, detail="El rol seleccionado no existe")

    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db_user.updated_at = now_bolivia()
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    """Soft delete de un empleado (cambia status a false)"""
    # 1. Verificar permisos
    if getattr(current_user, "computed_role", "") not in ["admin", "superadmin", "owner"]:
         raise HTTPException(status_code=403, detail="No tienes permiso para eliminar empleados")

    db_user = session.get(User, employee_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    db_user.status = False
    db_user.updated_at = now_bolivia()
    session.add(db_user)
    session.commit()
    return {"ok": True, "message": "Empleado eliminado correctamente"}

@router.post("/{employee_id}/approve-reset")
def approve_employee_reset(
    employee_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    """Aprueba el reseteo de contraseña de un empleado."""
    if getattr(current_user, "computed_role", "") not in ["admin", "superadmin", "owner"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para aprobar el reseteo de contraseñas")

    db_user = session.get(User, employee_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    if not db_user.reset_requested:
        raise HTTPException(status_code=400, detail="Este empleado no ha solicitado recuperación de contraseña")

    db_user.reset_approved = True
    session.add(db_user)
    session.commit()
    return {"message": "Reseteo aprobado exitosamente"}

