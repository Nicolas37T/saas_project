from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from app.db.session import engine
from app.db.models import Tenant, Subscription
from app.core.deps import get_current_tenant_user
from datetime import datetime
from dateutil.relativedelta import relativedelta
import uuid

router = APIRouter(prefix="/billing", tags=["Tenant - Billing"])

@router.get("/status")
async def get_billing_status(
    request: Request,
    current_user = Depends(get_current_tenant_user)
):
    """Obtiene el estado actual de la suscripción"""
    tenant_obj = getattr(request.state, "tenant", None)
    if not tenant_obj:
        raise HTTPException(status_code=400, detail="Tenant no identificado")

    with Session(engine) as session:
        active_sub = session.exec(
            select(Subscription)
            .where(Subscription.tenant_id == tenant_obj.id)
            .order_by(Subscription.end_date.desc())
        ).first()

        return {
            "status": tenant_obj.status,
            "end_date": active_sub.end_date if active_sub else None,
            "plan_id": tenant_obj.plan_id
        }

@router.post("/renew")
async def renew_subscription(
    request: Request,
    current_user = Depends(get_current_tenant_user)
):
    """Renueva la suscripción del tenant actual por 1 mes más (Simulado)"""
    # 1. Verificar si el usuario es owner o admin
    user_role = getattr(current_user, "computed_role", "")
    if user_role not in ["owner", "admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Solo el dueño del negocio puede renovar la suscripción")

    tenant_obj = getattr(request.state, "tenant", None)
    if not tenant_obj:
        raise HTTPException(status_code=400, detail="Tenant no identificado")

    with Session(engine) as session:
        # Recargar tenant de la DB maestra
        tenant = session.get(Tenant, tenant_obj.id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant no encontrado")

        # Obtener suscripción actual
        active_sub = session.exec(
            select(Subscription)
            .where(Subscription.tenant_id == tenant.id)
            .order_by(Subscription.end_date.desc())
        ).first()

        if not active_sub:
             raise HTTPException(status_code=404, detail="No se encontró una suscripción previa")

        # Simular pago y extender fecha
        now = datetime.utcnow()
        # Si ya venció, empezamos desde hoy. Si no, sumamos al end_date actual.
        if active_sub.end_date and active_sub.end_date > now:
            new_end_date = active_sub.end_date + relativedelta(months=1)
        else:
            new_end_date = now + relativedelta(months=1)
        
        # Actualizar suscripción
        active_sub.end_date = new_end_date
        active_sub.status = "active"
        
        # Reactivar tenant
        tenant.status = "active"
        
        session.add(active_sub)
        session.add(tenant)
        session.commit()
        
        return {
            "message": "Suscripción renovada exitosamente",
            "new_end_date": new_end_date,
            "status": "active"
        }
