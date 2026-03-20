from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Payment, Treatment, Patient, PatientShare, Odontogram
from app.core.deps import get_current_tenant_user
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
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    try:
        # Base query
        query = select(Payment)
        
        # Role-based filtering
        role = current_user.computed_role.lower()
        if role not in ['admin', 'recepcionista']:
            # For doctors and owner: see payments of treatments linked to patients they have access to
            query = (
                query
                .join(Treatment, Payment.treatment_id == Treatment.id)
                .join(Odontogram, Treatment.odontogram_id == Odontogram.id)
                .join(Patient, Odontogram.patient_id == Patient.id)
                .where(
                    (Treatment.created_by == current_user.id) |
                    (
                        (Treatment.created_by.is_(None)) & 
                        (
                            (Patient.created_by == current_user.id) | 
                            (Patient.assigned_doctor_id == current_user.id)
                        )
                    )
                )
            )
            
        results = session.exec(
            query.order_by(Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
        ).all()
        
        # Row safety: unpacking if join causes Tuple results
        payments_list = []
        for row in results:
            if isinstance(row, tuple):
                payments_list.append(row[0])
            else:
                payments_list.append(row)
                
        return payments_list
    except Exception as e:
        import traceback
        print(f"❌ ERROR IN get_payments: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en get_payments: {str(e)}")

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
