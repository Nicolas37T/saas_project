from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from datetime import date
import uuid
import re

from app.core.deps import get_current_user
from app.db.models import UserGlobal, Tenant
from app.db.session import engine
from app.db.tenant_models import (
    Patient, MedicalHistory, TreatmentCatalog,
    OdontogramEntry, TreatmentRecord, Appointment,
)

router = APIRouter(prefix="/dental", tags=["Dental"])

_initialized_schemas: set = set()


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def _ensure_dental_tables(schema_name: str):
    """Crea las tablas dentales usando el pool existente (sin conexión nueva)."""
    if schema_name in _initialized_schemas:
        return
    if not re.match(r'^[a-zA-Z0-9_]+$', schema_name):
        raise HTTPException(status_code=400, detail="Schema name inválido")

    s = schema_name  # ya validado con regex
    with engine.connect() as conn:
        for ddl in [
            f"""CREATE TABLE IF NOT EXISTS {s}.patients (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    first_name VARCHAR NOT NULL, last_name VARCHAR NOT NULL,
                    phone VARCHAR, email VARCHAR, birthdate DATE,
                    address VARCHAR, notes TEXT, created_at TIMESTAMP DEFAULT now())""",
            f"""CREATE TABLE IF NOT EXISTS {s}.medical_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    patient_id UUID NOT NULL REFERENCES {s}.patients(id) ON DELETE CASCADE,
                    conditions TEXT, allergies TEXT, medications TEXT,
                    notes TEXT, updated_at TIMESTAMP DEFAULT now())""",
            f"""CREATE TABLE IF NOT EXISTS {s}.treatment_catalog (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR NOT NULL, description VARCHAR,
                    price DOUBLE PRECISION DEFAULT 0.0, created_at TIMESTAMP DEFAULT now())""",
            f"""CREATE TABLE IF NOT EXISTS {s}.odontogram_entries (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    patient_id UUID NOT NULL REFERENCES {s}.patients(id) ON DELETE CASCADE,
                    tooth_number INTEGER NOT NULL, condition VARCHAR NOT NULL,
                    notes TEXT, created_at TIMESTAMP DEFAULT now())""",
            f"""CREATE TABLE IF NOT EXISTS {s}.treatment_records (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    patient_id UUID NOT NULL REFERENCES {s}.patients(id) ON DELETE CASCADE,
                    treatment_id UUID REFERENCES {s}.treatment_catalog(id),
                    tooth_number INTEGER, description VARCHAR,
                    cost DOUBLE PRECISION DEFAULT 0.0, status VARCHAR DEFAULT 'pending',
                    treatment_date TIMESTAMP DEFAULT now(), notes TEXT,
                    created_at TIMESTAMP DEFAULT now())""",
            f"""CREATE TABLE IF NOT EXISTS {s}.appointments (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    patient_id UUID NOT NULL REFERENCES {s}.patients(id) ON DELETE CASCADE,
                    appointment_date DATE NOT NULL, start_time VARCHAR NOT NULL,
                    end_time VARCHAR, status VARCHAR DEFAULT 'scheduled',
                    notes TEXT, created_at TIMESTAMP DEFAULT now())""",
        ]:
            conn.execute(text(ddl))
        conn.commit()
    _initialized_schemas.add(schema_name)


def _open_session(user: UserGlobal):
    """Retorna (session, tenant) con search_path listo — una sola sesión."""
    if not user.tenant_id:
        raise HTTPException(status_code=403, detail="No tienes un negocio asociado")
    session = Session(engine)
    tenant = session.get(Tenant, user.tenant_id)
    if not tenant:
        session.close()
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    _ensure_dental_tables(tenant.schema_name)
    session.execute(text(f"SET search_path TO {tenant.schema_name}, public"))
    return session, tenant


def _close_session(session: Session):
    session.execute(text("SET search_path TO public"))
    session.close()


# ─── PACIENTES ────────────────────────────────────────────────────────────────

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    birthdate: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    birthdate: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


def _serialize_patient(p: Patient):
    return {
        "id": str(p.id),
        "first_name": p.first_name,
        "last_name": p.last_name,
        "phone": p.phone,
        "email": p.email,
        "birthdate": p.birthdate.isoformat() if p.birthdate else None,
        "address": p.address,
        "notes": p.notes,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.get("/patients")
def list_patients(current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        patients = session.exec(select(Patient).order_by(Patient.created_at.desc())).all()
        return [_serialize_patient(p) for p in patients]
    finally:
        _close_session(session)


@router.post("/patients")
def create_patient(data: PatientCreate, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        patient = Patient(
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            email=data.email,
            birthdate=date.fromisoformat(data.birthdate) if data.birthdate else None,
            address=data.address,
            notes=data.notes,
        )
        session.add(patient)
        session.commit()
        session.refresh(patient)
        return _serialize_patient(patient)
    finally:
        _close_session(session)


@router.get("/patients/{patient_id}")
def get_patient(patient_id: str, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        pid = uuid.UUID(patient_id)
        patient = session.get(Patient, pid)
        if not patient:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        return _serialize_patient(patient)
    finally:
        _close_session(session)


@router.put("/patients/{patient_id}")
def update_patient(patient_id: str, data: PatientUpdate, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        pid = uuid.UUID(patient_id)
        patient = session.get(Patient, pid)
        if not patient:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        for field, value in data.model_dump(exclude_unset=True).items():
            if field == "birthdate" and value:
                setattr(patient, field, date.fromisoformat(value))
            else:
                setattr(patient, field, value)
        session.add(patient)
        session.commit()
        session.refresh(patient)
        return _serialize_patient(patient)
    finally:
        _close_session(session)


@router.delete("/patients/{patient_id}")
def delete_patient(patient_id: str, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        pid = uuid.UUID(patient_id)
        patient = session.get(Patient, pid)
        if not patient:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        session.delete(patient)
        session.commit()
        return {"message": "Paciente eliminado"}
    finally:
        _close_session(session)


# ─── HISTORIAL MÉDICO ─────────────────────────────────────────────────────────

class HistoryUpsert(BaseModel):
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    notes: Optional[str] = None


@router.get("/patients/{patient_id}/history")
def get_history(patient_id: str, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        pid = uuid.UUID(patient_id)
        history = session.exec(
            select(MedicalHistory).where(MedicalHistory.patient_id == pid)
        ).first()
        if not history:
            return {"conditions": "", "allergies": "", "medications": "", "notes": ""}
        return {
            "id": str(history.id),
            "conditions": history.conditions or "",
            "allergies": history.allergies or "",
            "medications": history.medications or "",
            "notes": history.notes or "",
        }
    finally:
        _close_session(session)


@router.post("/patients/{patient_id}/history")
def upsert_history(patient_id: str, data: HistoryUpsert, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        pid = uuid.UUID(patient_id)
        history = session.exec(
            select(MedicalHistory).where(MedicalHistory.patient_id == pid)
        ).first()
        if history:
            history.conditions = data.conditions
            history.allergies = data.allergies
            history.medications = data.medications
            history.notes = data.notes
        else:
            history = MedicalHistory(
                patient_id=pid,
                conditions=data.conditions,
                allergies=data.allergies,
                medications=data.medications,
                notes=data.notes,
            )
        session.add(history)
        session.commit()
        return {"message": "Historial actualizado"}
    finally:
        _close_session(session)


# ─── ODONTOGRAMA ──────────────────────────────────────────────────────────────

class OdontogramUpsert(BaseModel):
    tooth_number: int
    condition: str
    notes: Optional[str] = None


@router.get("/patients/{patient_id}/odontogram")
def get_odontogram(patient_id: str, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        pid = uuid.UUID(patient_id)
        entries = session.exec(
            select(OdontogramEntry).where(OdontogramEntry.patient_id == pid)
        ).all()
        return [
            {
                "id": str(e.id),
                "tooth_number": e.tooth_number,
                "condition": e.condition,
                "notes": e.notes,
            }
            for e in entries
        ]
    finally:
        _close_session(session)


@router.post("/patients/{patient_id}/odontogram")
def upsert_odontogram(patient_id: str, data: OdontogramUpsert, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        pid = uuid.UUID(patient_id)
        existing = session.exec(
            select(OdontogramEntry).where(
                OdontogramEntry.patient_id == pid,
                OdontogramEntry.tooth_number == data.tooth_number,
            )
        ).first()
        if existing:
            existing.condition = data.condition
            existing.notes = data.notes
            session.add(existing)
        else:
            entry = OdontogramEntry(
                patient_id=pid,
                tooth_number=data.tooth_number,
                condition=data.condition,
                notes=data.notes,
            )
            session.add(entry)
        session.commit()
        return {"message": "Odontograma actualizado"}
    finally:
        _close_session(session)


# ─── CATÁLOGO DE TRATAMIENTOS ─────────────────────────────────────────────────

class TreatmentCatalogCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = 0.0


@router.get("/treatments")
def list_treatments(current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        treatments = session.exec(select(TreatmentCatalog)).all()
        return [
            {
                "id": str(t.id),
                "name": t.name,
                "description": t.description,
                "price": t.price,
            }
            for t in treatments
        ]
    finally:
        _close_session(session)


@router.post("/treatments")
def create_treatment(data: TreatmentCatalogCreate, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        t = TreatmentCatalog(name=data.name, description=data.description, price=data.price)
        session.add(t)
        session.commit()
        session.refresh(t)
        return {"id": str(t.id), "name": t.name, "description": t.description, "price": t.price}
    finally:
        _close_session(session)


@router.delete("/treatments/{treatment_id}")
def delete_treatment(treatment_id: str, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        tid = uuid.UUID(treatment_id)
        t = session.get(TreatmentCatalog, tid)
        if not t:
            raise HTTPException(status_code=404, detail="Tratamiento no encontrado")
        session.delete(t)
        session.commit()
        return {"message": "Tratamiento eliminado"}
    finally:
        _close_session(session)


# ─── TRATAMIENTOS REALIZADOS ──────────────────────────────────────────────────

class RecordCreate(BaseModel):
    treatment_id: Optional[str] = None
    tooth_number: Optional[int] = None
    description: Optional[str] = None
    cost: float = 0.0
    notes: Optional[str] = None


@router.get("/patients/{patient_id}/records")
def list_records(patient_id: str, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        pid = uuid.UUID(patient_id)
        records = session.exec(
            select(TreatmentRecord)
            .where(TreatmentRecord.patient_id == pid)
            .order_by(TreatmentRecord.treatment_date.desc())
        ).all()
        result = []
        for r in records:
            treatment_name = None
            if r.treatment_id:
                t = session.get(TreatmentCatalog, r.treatment_id)
                treatment_name = t.name if t else None
            result.append({
                "id": str(r.id),
                "treatment_id": str(r.treatment_id) if r.treatment_id else None,
                "treatment_name": treatment_name,
                "tooth_number": r.tooth_number,
                "description": r.description,
                "cost": r.cost,
                "status": r.status,
                "treatment_date": r.treatment_date.isoformat() if r.treatment_date else None,
                "notes": r.notes,
            })
        return result
    finally:
        _close_session(session)


@router.post("/patients/{patient_id}/records")
def create_record(patient_id: str, data: RecordCreate, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        pid = uuid.UUID(patient_id)
        record = TreatmentRecord(
            patient_id=pid,
            treatment_id=uuid.UUID(data.treatment_id) if data.treatment_id else None,
            tooth_number=data.tooth_number,
            description=data.description,
            cost=data.cost,
            notes=data.notes,
        )
        session.add(record)
        session.commit()
        session.refresh(record)
        return {"id": str(record.id), "message": "Tratamiento registrado"}
    finally:
        _close_session(session)


@router.patch("/records/{record_id}/pay")
def mark_record_paid(record_id: str, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        rid = uuid.UUID(record_id)
        record = session.get(TreatmentRecord, rid)
        if not record:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        record.status = "paid"
        session.add(record)
        session.commit()
        return {"message": "Marcado como pagado"}
    finally:
        _close_session(session)


# ─── BALANCE DEL PACIENTE ─────────────────────────────────────────────────────

@router.get("/patients/{patient_id}/balance")
def get_balance(patient_id: str, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        pid = uuid.UUID(patient_id)
        records = session.exec(
            select(TreatmentRecord).where(TreatmentRecord.patient_id == pid)
        ).all()
        total = sum(r.cost for r in records)
        paid = sum(r.cost for r in records if r.status == "paid")
        pending = total - paid
        return {"total": total, "paid": paid, "pending": pending}
    finally:
        _close_session(session)


# ─── CITAS ────────────────────────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    patient_id: str
    appointment_date: str
    start_time: str
    end_time: Optional[str] = None
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get("/appointments")
def list_appointments(
    current_user: UserGlobal = Depends(get_current_user),
    patient_id: Optional[str] = Query(None),
    fecha: Optional[str] = Query(None),
):
    session, _ = _open_session(current_user)
    try:
        stmt = select(Appointment).order_by(Appointment.appointment_date.desc(), Appointment.start_time)
        if patient_id:
            stmt = stmt.where(Appointment.patient_id == uuid.UUID(patient_id))
        if fecha:
            stmt = stmt.where(Appointment.appointment_date == date.fromisoformat(fecha))
        appointments = session.exec(stmt).all()
        result = []
        for a in appointments:
            patient = session.get(Patient, a.patient_id)
            result.append({
                "id": str(a.id),
                "patient_id": str(a.patient_id),
                "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Desconocido",
                "appointment_date": a.appointment_date.isoformat(),
                "start_time": a.start_time,
                "end_time": a.end_time,
                "status": a.status,
                "notes": a.notes,
            })
        return result
    finally:
        _close_session(session)


@router.post("/appointments")
def create_appointment(data: AppointmentCreate, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        appt = Appointment(
            patient_id=uuid.UUID(data.patient_id),
            appointment_date=date.fromisoformat(data.appointment_date),
            start_time=data.start_time,
            end_time=data.end_time,
            notes=data.notes,
        )
        session.add(appt)
        session.commit()
        session.refresh(appt)
        return {"id": str(appt.id), "message": "Cita creada"}
    finally:
        _close_session(session)


@router.patch("/appointments/{appt_id}")
def update_appointment(appt_id: str, data: AppointmentUpdate, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        aid = uuid.UUID(appt_id)
        appt = session.get(Appointment, aid)
        if not appt:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        if data.status:
            appt.status = data.status
        if data.notes is not None:
            appt.notes = data.notes
        session.add(appt)
        session.commit()
        return {"message": "Cita actualizada"}
    finally:
        _close_session(session)


@router.delete("/appointments/{appt_id}")
def delete_appointment(appt_id: str, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        aid = uuid.UUID(appt_id)
        appt = session.get(Appointment, aid)
        if not appt:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        session.delete(appt)
        session.commit()
        return {"message": "Cita eliminada"}
    finally:
        _close_session(session)
