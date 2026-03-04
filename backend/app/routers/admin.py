from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import engine
from app.db.models import Tenant, UserGlobal, Plan, Subscription, UserRole
from app.core.deps import get_current_superadmin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/tenants")
def list_tenants(current_user: UserGlobal = Depends(get_current_superadmin)):
    """Listar todos los tenants registrados en la plataforma."""
    with Session(engine) as session:
        tenants = session.exec(select(Tenant)).all()
        return [
            {
                "id": str(t.id),
                "business_name": t.business_name,
                "subdomain": t.subdomain,
                "status": t.status,
                "db_name": t.db_name,
                "plan": {
                    "id": str(t.plan.id),
                    "name": t.plan.name
                } if t.plan else None,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tenants
        ]


@router.get("/users")
def list_users(current_user: UserGlobal = Depends(get_current_superadmin)):
    """Listar todos los usuarios globales."""
    with Session(engine) as session:
        users = session.exec(select(UserGlobal)).all()
        return [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "is_verified": u.is_verified,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "role_id": str(u.role_id),
            }
            for u in users
        ]


@router.get("/plans")
def list_plans(current_user: UserGlobal = Depends(get_current_superadmin)):
    """Listar todos los planes disponibles."""
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

from pydantic import BaseModel
from typing import Optional

class PlanCreate(BaseModel):
    name: str
    price: float
    billing_cycle: str
    max_users: int

@router.post("/plans")
def create_plan(data: PlanCreate, current_user: UserGlobal = Depends(get_current_superadmin)):
    """Crea un nuevo plan en la plataforma."""
    with Session(engine) as session:
        if session.exec(select(Plan).where(Plan.name == data.name)).first():
            raise HTTPException(status_code=400, detail="Ya existe un plan con ese nombre")
            
        new_plan = Plan(
            name=data.name,
            price=data.price,
            billing_cycle=data.billing_cycle,
            max_users=data.max_users
        )
        session.add(new_plan)
        session.commit()
        session.refresh(new_plan)
        return new_plan

class SubscriptionUpdate(BaseModel):
    status: Optional[str] = None
    plan_id: Optional[str] = None

@router.get("/subscriptions")
def list_subscriptions(current_user: UserGlobal = Depends(get_current_superadmin)):
    """Listar todas las suscripciones de la plataforma."""
    with Session(engine) as session:
        subscriptions = session.exec(select(Subscription)).all()
        return [
            {
                "id": str(s.id),
                "tenant_id": str(s.tenant_id),
                "tenant_name": s.tenant.business_name if s.tenant else "Desconocido",
                "plan_id": str(s.plan_id),
                "plan_name": s.plan.name if s.plan else "Desconocido",
                "status": s.status,
                "start_date": s.start_date.isoformat() if s.start_date else None,
                "end_date": s.end_date.isoformat() if s.end_date else None,
                "external_id": s.external_id,
            }
            for s in subscriptions
        ]

@router.patch("/subscriptions/{sub_id}")
def update_subscription(sub_id: str, data: SubscriptionUpdate, current_user: UserGlobal = Depends(get_current_superadmin)):
    """Actualiza manualmente el estado o plan de una suscripción y mutuamente su Tenant asociado."""
    with Session(engine) as session:
        try:
            sub_uuid = uuid.UUID(sub_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de suscripción inválido")
            
        sub = session.exec(select(Subscription).where(Subscription.id == sub_uuid)).first()
        if not sub:
            raise HTTPException(status_code=404, detail="Suscripción no encontrada")

        tenant = sub.tenant
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant asociado a la suscripción no encontrado")
            
        # 1. Cambio de Status
        if data.status:
            if data.status not in ["active", "suspended", "canceled", "past_due", "trialing"]:
                raise HTTPException(status_code=400, detail="Estado de suscripción inválido")
            sub.status = data.status
            
            # Repercutir estado en el Tenant
            if data.status in ["canceled", "suspended", "past_due"]:
                tenant.status = "suspended"
            elif data.status in ["active", "trialing"]:
                tenant.status = "active"

        # 2. Cambio de Plan
        if data.plan_id:
            try:
                plan_uuid = uuid.UUID(data.plan_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="ID de plan inválido")
                
            plan = session.exec(select(Plan).where(Plan.id == plan_uuid)).first()
            if not plan:
                raise HTTPException(status_code=404, detail="El plan asignado no existe")
                
            sub.plan_id = plan_uuid
            tenant.plan_id = plan_uuid

        session.add(sub)
        session.add(tenant)
        session.commit()
        session.refresh(sub)
        
        return {"message": "Suscripción actualizada correctamente", "status": sub.status, "plan_id": str(sub.plan_id)}


@router.get("/stats")
def admin_stats(current_user: UserGlobal = Depends(get_current_superadmin)):
    """Estadísticas generales de la plataforma."""
    with Session(engine) as session:
        total_tenants = len(session.exec(select(Tenant)).all())
        total_users = len(session.exec(select(UserGlobal)).all())
        total_plans = len(session.exec(select(Plan)).all())
        active_tenants = len(session.exec(select(Tenant).where(Tenant.status == "active")).all())
        suspended_tenants = len(session.exec(select(Tenant).where(Tenant.status == "suspended")).all())

        # Cálculo muy simplificado del MRR asumiendo el plan básico ($10) por cada activo
        mrr_estimado = active_tenants * 10.0

        return {
            "total_tenants": total_tenants,
            "active_tenants": active_tenants,
            "total_users": total_users,
            "total_plans": total_plans,
            "suspended_tenants": suspended_tenants,
            "mrr_estimado": mrr_estimado,
        }
