from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Medicine, User
from app.schemas.tenant_schemas import MedicineCreate, MedicineRead, MedicineUpdate
from app.routers.employees import get_current_tenant_user

router = APIRouter(prefix="/medicines", tags=["Tenant - Medicines"])

@router.post("/", response_model=MedicineRead)
def create_medicine(
    *,
    session: Session = Depends(get_session_for_tenant),
    medicine: MedicineCreate,
    current_user: User = Depends(get_current_tenant_user)
):
    db_medicine = Medicine.from_orm(medicine)
    db_medicine.created_by = current_user.id
    session.add(db_medicine)
    session.commit()
    session.refresh(db_medicine)
    return db_medicine

@router.get("/", response_model=List[MedicineRead])
def read_medicines(
    *,
    session: Session = Depends(get_session_for_tenant),
    offset: int = 0,
    limit: int = 100
):
    medicines = session.exec(select(Medicine).offset(offset).limit(limit)).all()
    return medicines

@router.get("/{medicine_id}", response_model=MedicineRead)
def read_medicine(
    *,
    session: Session = Depends(get_session_for_tenant),
    medicine_id: uuid.UUID
):
    medicine = session.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medication not found")
    return medicine

@router.patch("/{medicine_id}", response_model=MedicineRead)
def update_medicine(
    *,
    session: Session = Depends(get_session_for_tenant),
    medicine_id: uuid.UUID,
    medicine: MedicineUpdate,
    current_user: User = Depends(get_current_tenant_user)
):
    db_medicine = session.get(Medicine, medicine_id)
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    medicine_data = medicine.dict(exclude_unset=True)
    for key, value in medicine_data.items():
        setattr(db_medicine, key, value)
    
    session.add(db_medicine)
    session.commit()
    session.refresh(db_medicine)
    return db_medicine

@router.delete("/{medicine_id}")
def delete_medicine(
    *,
    session: Session = Depends(get_session_for_tenant),
    medicine_id: uuid.UUID,
    current_user: User = Depends(get_current_tenant_user)
):
    medicine = session.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    session.delete(medicine)
    session.commit()
    return {"ok": True}
