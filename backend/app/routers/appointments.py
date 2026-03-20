from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Appointment, Patient, User, PatientShare
from app.core.deps import get_current_tenant_user
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
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    try:
        # Base query for active appointments
        query = select(Appointment).where(Appointment.status == True)
        
        # Role-based filtering
        role = current_user.computed_role.lower()
        if role not in ['owner', 'admin', 'recepcionista']:
            # Para doctores: ver solo las citas que le pertenecen (asignadas a él)
            query = query.where(Appointment.assigned_doctor_id == current_user.id)
            
        results = session.exec(
            query.order_by(Appointment.appointment_date.desc())
            .offset(skip)
            .limit(limit)
        ).all()
        
        # Row safety: if join causes Row objects, return only the Appointment (Tuple index 0)
        appointments_list = []
        for row in results:
            if isinstance(row, tuple):
                appointments_list.append(row[0])
            else:
                appointments_list.append(row)
                
        return appointments_list
    except Exception as e:
        import traceback
        print(f"❌ ERROR IN get_appointments: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en get_appointments: {str(e)}")

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
