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
