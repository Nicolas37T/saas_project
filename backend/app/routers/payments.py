from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Payment
from app.schemas.tenant_schemas import PaymentCreate, PaymentRead, PaymentUpdate

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/", response_model=PaymentRead)
def create_payment(
    payment: PaymentCreate,
    session: Session = Depends(get_session_for_tenant)
):
    db_payment = Payment.model_validate(payment)
    session.add(db_payment)
    session.commit()
    session.refresh(db_payment)
    return db_payment

@router.get("/", response_model=List[PaymentRead])
def get_payments(
    skip: int = 0, limit: int = 100,
    session: Session = Depends(get_session_for_tenant)
):
    payments = session.exec(select(Payment).offset(skip).limit(limit)).all()
    return payments

@router.get("/{payment_id}", response_model=PaymentRead)
def get_payment(
    payment_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@router.put("/{payment_id}", response_model=PaymentRead)
def update_payment(
    payment_id: uuid.UUID,
    payment_update: PaymentUpdate,
    session: Session = Depends(get_session_for_tenant)
):
    db_payment = session.get(Payment, payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    update_data = payment_update.model_dump(exclude_unset=True)
    db_payment.sqlmodel_update(update_data)
    
    session.add(db_payment)
    session.commit()
    session.refresh(db_payment)
    return db_payment

@router.delete("/{payment_id}")
def delete_payment(
    payment_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    db_payment = session.get(Payment, payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    session.delete(db_payment)
    session.commit()
    return {"ok": True}
