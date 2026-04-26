from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from typing import List, Dict, Optional

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Patient, Treatment, Appointment
from app.core.deps import get_current_tenant_user

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/dashboard")
def get_dashboard_stats(
    days: int = Query(default=7, ge=1, le=90),
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    # Total counts (these remain global/all-time or could also be filtered, but usually summary cards are total)
    total_patients = session.exec(select(func.count(Patient.id)).where(Patient.status == True)).one()
    total_treatments = session.exec(select(func.count(Treatment.id)).where(Treatment.status == True)).one()
    total_appointments = session.exec(select(func.count(Appointment.id)).where(Appointment.status == True)).one()

    # Stats for the last X days (charts)
    today = datetime.utcnow().date()
    chart_data = []
    
    # Generate list of days to ensure we have every day even with 0 counts
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        next_day = day + timedelta(days=1)
        
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(next_day, datetime.min.time())

        # Patients created this day
        day_patients = session.exec(
            select(func.count(Patient.id))
            .where(Patient.status == True)
            .where(Patient.created_at >= day_start)
            .where(Patient.created_at < day_end)
        ).one()
        
        # Treatments created this day
        day_treatments = session.exec(
            select(func.count(Treatment.id))
            .where(Treatment.status == True)
            .where(Treatment.created_at >= day_start)
            .where(Treatment.created_at < day_end)
        ).one()
        
        # Appointments for this day
        day_appointments = session.exec(
            select(func.count(Appointment.id))
            .where(Appointment.status == True)
            .where(Appointment.appointment_date >= day_start)
            .where(Appointment.appointment_date < day_end)
        ).one()
        
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
