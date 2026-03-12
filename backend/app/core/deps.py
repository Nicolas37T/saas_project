from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

from app.db.session import engine
from app.db.models import UserGlobal, UserRole

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-me")

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserGlobal:
    """Valida el JWT y devuelve el UserGlobal autenticado."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    with Session(engine) as session:
        user = session.get(UserGlobal, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
        return user


def get_current_superadmin(current_user: UserGlobal = Depends(get_current_user)) -> UserGlobal:
    """Verifica que el usuario autenticado sea superadmin."""
    with Session(engine) as session:
        role = session.get(UserRole, current_user.role_id)
        if not role or role.name != "superadmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso denegado. Se requiere rol de superadmin."
            )
    return current_user

from app.db.session import get_session_for_tenant
from fastapi import Request

class AuthUser:
    def __init__(self, db_user, is_employee: bool, computed_role: str):
        self.db_user = db_user
        self.id = db_user.id
        self.email = db_user.email
        self.is_employee = is_employee
        self.computed_role = computed_role

def get_current_tenant_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session_for_tenant)
) -> AuthUser:
    """
    Dependencia híbrida: 
    Si el JWT indica is_employee=True, busca en el tenant actual (usando get_session_for_tenant).
    Si no, busca en la tabla global (UserGlobal).
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        is_employee: bool = payload.get("is_employee", False)
        
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    if is_employee:
        from app.db.tenant_models import User, Role
        user = session.get(User, user_id)
        if not user or not user.status:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Empleado no encontrado o inactivo")
        
        computed_role = "empleado"
        if user.role_id:
            role = session.get(Role, user.role_id)
            if role:
                computed_role = role.name.lower()
                
        return AuthUser(db_user=user, is_employee=True, computed_role=computed_role)
    else:
        with Session(engine) as global_session:
            user = global_session.get(UserGlobal, user_id)
            if not user:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario global no encontrado")
            
            computed_role = "owner"
            if user.role_id:
                role = global_session.get(UserRole, user.role_id)
                if role:
                    computed_role = role.name.lower()
                    
            return AuthUser(db_user=user, is_employee=False, computed_role=computed_role)


