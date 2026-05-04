from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func, or_
from datetime import datetime, timedelta
from app.core.timezone import now_bolivia
from typing import List, Dict, Optional
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Patient, Treatment, Appointment, PatientShare
from app.core.deps import get_current_tenant_user

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/dashboard")
def get_dashboard_stats(
    days: int = Query(default=7, ge=1, le=365),
    doctor_id: Optional[str] = Query(default=None),
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    # Si el usuario es doctor (odontólogo), forzar filtro a sus propios datos
    doctor_roles = {"odontólogo", "odontologo", "doctor", "dentist", "dentista"}
    is_doctor = current_user.computed_role.lower() in doctor_roles

    effective_doctor_id = None
    if is_doctor:
        effective_doctor_id = current_user.id
    elif doctor_id:
        effective_doctor_id = uuid.UUID(doctor_id)

    # --- Helper: construir filtros de paciente por doctor ---
    def patient_doctor_filter(doc_id: uuid.UUID):
        """Pacientes donde el doctor es assigned, creator, o tiene share."""
        shared_patient_ids = select(PatientShare.patient_id).where(
            PatientShare.doctor_id == doc_id
        )
        return or_(
            Patient.assigned_doctor_id == doc_id,
            Patient.created_by == doc_id,
            Patient.id.in_(shared_patient_ids)  # type: ignore
        )

    # --- Summary cards ---
    patient_q = select(func.count(Patient.id)).where(Patient.status == True)
    treatment_q = select(func.count(Treatment.id)).where(Treatment.status == True)
    appointment_q = select(func.count(Appointment.id)).where(Appointment.status == True)

    if effective_doctor_id:
        patient_q = patient_q.where(patient_doctor_filter(effective_doctor_id))
        treatment_q = treatment_q.where(Treatment.created_by == effective_doctor_id)
        appointment_q = appointment_q.where(Appointment.assigned_doctor_id == effective_doctor_id)

    total_patients = session.exec(patient_q).one()
    total_treatments = session.exec(treatment_q).one()
    total_appointments = session.exec(appointment_q).one()

    # --- Chart data (day by day) ---
    today = now_bolivia().date()
    chart_data = []

    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        next_day = day + timedelta(days=1)

        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(next_day, datetime.min.time())

        # Patients created this day
        pq = (
            select(func.count(Patient.id))
            .where(Patient.status == True)
            .where(Patient.created_at >= day_start)
            .where(Patient.created_at < day_end)
        )
        if effective_doctor_id:
            pq = pq.where(patient_doctor_filter(effective_doctor_id))
        day_patients = session.exec(pq).one()

        # Treatments created this day
        tq = (
            select(func.count(Treatment.id))
            .where(Treatment.status == True)
            .where(Treatment.created_at >= day_start)
            .where(Treatment.created_at < day_end)
        )
        if effective_doctor_id:
            tq = tq.where(Treatment.created_by == effective_doctor_id)
        day_treatments = session.exec(tq).one()

        # Appointments for this day
        aq = (
            select(func.count(Appointment.id))
            .where(Appointment.status == True)
            .where(Appointment.appointment_date >= day_start)
            .where(Appointment.appointment_date < day_end)
        )
        if effective_doctor_id:
            aq = aq.where(Appointment.assigned_doctor_id == effective_doctor_id)
        day_appointments = session.exec(aq).one()

        chart_data.append({
            "date": day.strftime("%Y-%m-%d"),
            "patients": day_patients,
            "treatments": day_treatments,
            "appointments": day_appointments
        })

    return {
        "summary": {
            "total_patients": total_patients,
            "total_treatments": total_treatments,
            "total_appointments": total_appointments
        },
        "chart_data": chart_data
    }
