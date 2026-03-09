from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Patient, MedicalHistory
from app.schemas.tenant_schemas import (
    PatientCreate, PatientRead, PatientUpdate,
    MedicalHistoryCreate, MedicalHistoryRead, MedicalHistoryUpdate
)

router = APIRouter(prefix="/patients", tags=["Patients"])

# --- PATIENTS ---

@router.post("/", response_model=PatientRead)
def create_patient(
    patient: PatientCreate,
    session: Session = Depends(get_session_for_tenant)
):
    db_patient = Patient.model_validate(patient)
    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)
    return db_patient

@router.get("/", response_model=List[PatientRead])
def get_patients(
    skip: int = 0, limit: int = 100,
    session: Session = Depends(get_session_for_tenant)
):
    patients = session.exec(select(Patient).offset(skip).limit(limit)).all()
    return patients

@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(
    patient_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{patient_id}", response_model=PatientRead)
def update_patient(
    patient_id: uuid.UUID,
    patient_update: PatientUpdate,
    session: Session = Depends(get_session_for_tenant)
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_update.model_dump(exclude_unset=True)
    db_patient.sqlmodel_update(update_data)
    
    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)
    return db_patient

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    session.delete(db_patient)
    session.commit()
    return {"ok": True}

# --- MEDICAL HISTORY ---

@router.post("/{patient_id}/medical-history", response_model=MedicalHistoryRead)
def create_medical_history(
    patient_id: uuid.UUID,
    history: MedicalHistoryCreate,
    session: Session = Depends(get_session_for_tenant)
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db_history = MedicalHistory.model_validate(history)
    db_history.patient_id = patient_id
    session.add(db_history)
    session.commit()
    session.refresh(db_history)
    return db_history

@router.get("/{patient_id}/medical-history", response_model=List[MedicalHistoryRead])
def get_medical_histories(
    patient_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient.medical_histories
