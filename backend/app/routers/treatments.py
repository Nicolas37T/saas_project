from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Treatment
from app.schemas.tenant_schemas import TreatmentCreate, TreatmentRead, TreatmentUpdate

router = APIRouter(prefix="/treatments", tags=["Treatments"])

@router.post("/", response_model=TreatmentRead)
def create_treatment(
    treatment: TreatmentCreate,
    session: Session = Depends(get_session_for_tenant)
):
    db_treatment = Treatment.model_validate(treatment)
    session.add(db_treatment)
    session.commit()
    session.refresh(db_treatment)
    return db_treatment

@router.get("/", response_model=List[TreatmentRead])
def get_treatments(
    skip: int = 0, limit: int = 100,
    session: Session = Depends(get_session_for_tenant)
):
    treatments = session.exec(select(Treatment).offset(skip).limit(limit)).all()
    return treatments

@router.get("/{treatment_id}", response_model=TreatmentRead)
def get_treatment(
    treatment_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    treatment = session.get(Treatment, treatment_id)
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    return treatment

@router.put("/{treatment_id}", response_model=TreatmentRead)
def update_treatment(
    treatment_id: uuid.UUID,
    treatment_update: TreatmentUpdate,
    session: Session = Depends(get_session_for_tenant)
):
    db_treatment = session.get(Treatment, treatment_id)
    if not db_treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    update_data = treatment_update.model_dump(exclude_unset=True)
    db_treatment.sqlmodel_update(update_data)
    
    session.add(db_treatment)
    session.commit()
    session.refresh(db_treatment)
    return db_treatment

@router.delete("/{treatment_id}")
def delete_treatment(
    treatment_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    db_treatment = session.get(Treatment, treatment_id)
    if not db_treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    session.delete(db_treatment)
    session.commit()
    return {"ok": True}
