from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import Optional
from pydantic import BaseModel

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Setting
from app.core.deps import get_current_tenant_user
from app.db.models import UserGlobal

router = APIRouter()

# Schemas locales para la respuesta y actualización
class SettingUpdate(BaseModel):
    business_name: Optional[str] = None
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    cellphone: Optional[str] = None
    address: Optional[str] = None
    currency: Optional[str] = None

@router.get("/settings", response_model=Setting)
def get_settings(
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    """Obtener la configuración del tenant actual"""
    setting = session.exec(select(Setting)).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Configuración no encontrada para este negocio.")
    return setting

@router.put("/settings", response_model=Setting)
def update_settings(
    data: SettingUpdate,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    """Actualiza la configuración del tenant actual"""
    # Verificar permisos de rol mediante la dependencia híbrida
    if current_user.computed_role not in ["admin", "superadmin", "owner"]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes para editar la configuración.")

    setting = session.exec(select(Setting)).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Configuración no encontrada.")

    # Actualizar solo los campos proporcionados
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(setting, key, value)

    session.add(setting)
    session.commit()
    session.refresh(setting)
    
    return setting
