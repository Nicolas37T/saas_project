from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Appointment
from app.schemas.tenant_schemas import AppointmentCreate, AppointmentRead, AppointmentUpdate

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/", response_model=AppointmentRead)
def create_appointment(
    appointment: AppointmentCreate,
    session: Session = Depends(get_session_for_tenant)
):
    db_appointment = Appointment.model_validate(appointment)
    session.add(db_appointment)
    session.commit()
    session.refresh(db_appointment)
    return db_appointment

@router.get("/", response_model=List[AppointmentRead])
def get_appointments(
    skip: int = 0, limit: int = 100,
    session: Session = Depends(get_session_for_tenant)
):
    appointments = session.exec(
        select(Appointment)
        .where(Appointment.status == True)
        .offset(skip)
        .limit(limit)
    ).all()
    return appointments

@router.get("/{appointment_id}", response_model=AppointmentRead)
def get_appointment(
    appointment_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    appointment = session.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.put("/{appointment_id}", response_model=AppointmentRead)
def update_appointment(
    appointment_id: uuid.UUID,
    appointment_update: AppointmentUpdate,
    session: Session = Depends(get_session_for_tenant)
):
    db_appointment = session.get(Appointment, appointment_id)
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_data = appointment_update.model_dump(exclude_unset=True)
    db_appointment.sqlmodel_update(update_data)
    
    session.add(db_appointment)
    session.commit()
    session.refresh(db_appointment)
    return db_appointment

@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    db_appointment = session.get(Appointment, appointment_id)
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Soft delete: set status to False instead of deleting from DB
    db_appointment.status = False
    session.add(db_appointment)
    session.commit()
    return {"ok": True}
