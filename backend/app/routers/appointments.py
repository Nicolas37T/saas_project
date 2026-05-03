from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List
from datetime import datetime
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Appointment, Patient, User, PatientShare
from app.core.deps import get_current_tenant_user
from app.schemas.tenant_schemas import AppointmentCreate, AppointmentRead, AppointmentUpdate

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def _check_doctor_conflict(
    session: Session,
    doctor_id: uuid.UUID,
    appointment_date,
    exclude_id: uuid.UUID | None = None,
):
    """
    Raises HTTP 409 if the doctor already has an active appointment
    at the exact same minute as `appointment_date`.
    Pass `exclude_id` when editing so the appointment doesn't conflict with itself.
    """
    new_dt = appointment_date.replace(second=0, microsecond=0)
    # Check 1-minute window in SQL instead of loading all doctor appointments
    window_end = new_dt.replace(second=59)

    query = select(Appointment).where(
        Appointment.assigned_doctor_id == doctor_id,
        Appointment.status == True,
        Appointment.appointment_date >= new_dt,
        Appointment.appointment_date <= window_end,
    )
    if exclude_id is not None:
        query = query.where(Appointment.id != exclude_id)

    conflict = session.exec(query).first()
    if conflict:
        raise HTTPException(
            status_code=409,
            detail="El doctor ya tiene una cita programada en esa fecha y hora."
        )


@router.post("/", response_model=AppointmentRead)
def create_appointment(
    appointment: AppointmentCreate,
    session: Session = Depends(get_session_for_tenant)
):
    if appointment.assigned_doctor_id and appointment.appointment_date:
        _check_doctor_conflict(
            session,
            appointment.assigned_doctor_id,
            appointment.appointment_date,
        )

    db_appointment = Appointment.model_validate(appointment)
    session.add(db_appointment)
    session.commit()
    session.refresh(db_appointment)
    return db_appointment


@router.get("/", response_model=List[AppointmentRead])
def get_appointments(
    skip: int = 0,
    limit: int = 500,
    date_from: str | None = Query(None, description="ISO date YYYY-MM-DD — inclusive start"),
    date_to: str | None = Query(None, description="ISO date YYYY-MM-DD — exclusive end"),
    patient_id: str | None = Query(None, description="Filter by patient UUID"),
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    try:
        query = select(Appointment).where(Appointment.status == True)

        # Role-based filtering
        role = current_user.computed_role.lower()
        if role not in ['owner', 'admin', 'recepcionista']:
            query = query.where(Appointment.assigned_doctor_id == current_user.id)

        # Patient filter
        if patient_id:
            query = query.where(Appointment.patient_id == uuid.UUID(patient_id))

        # Server-side date range filtering
        if date_from:
            query = query.where(Appointment.appointment_date >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.where(Appointment.appointment_date < datetime.fromisoformat(date_to))

        results = session.exec(
            query.order_by(Appointment.appointment_date.desc())
            .offset(skip)
            .limit(limit)
        ).all()

        appointments_list = []
        for row in results:
            if isinstance(row, tuple):
                appointments_list.append(row[0])
            else:
                appointments_list.append(row)

        return appointments_list
    except HTTPException:
        raise
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

    # Resolve final doctor + date after the update is applied
    doctor_id = (
        appointment_update.assigned_doctor_id
        if appointment_update.assigned_doctor_id is not None
        else db_appointment.assigned_doctor_id
    )
    new_date = (
        appointment_update.appointment_date
        if appointment_update.appointment_date is not None
        else db_appointment.appointment_date
    )

    if doctor_id and new_date:
        _check_doctor_conflict(session, doctor_id, new_date, exclude_id=appointment_id)

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

    session.delete(db_appointment)
    session.commit()
    return {"ok": True}
