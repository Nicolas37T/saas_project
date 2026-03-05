from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field
import uuid


class Product(SQLModel, table=True):
    """Producto registrado dentro del schema de un tenant."""
    __tablename__ = "products"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    description: Optional[str] = None
    price: float = Field(default=0.0)
    stock: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ─── MODELOS DENTALES ─────────────────────────────────────────────────────────

class Patient(SQLModel, table=True):
    __tablename__ = "patients"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    birthdate: Optional[date] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MedicalHistory(SQLModel, table=True):
    __tablename__ = "medical_history"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    notes: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TreatmentCatalog(SQLModel, table=True):
    __tablename__ = "treatment_catalog"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    description: Optional[str] = None
    price: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class OdontogramEntry(SQLModel, table=True):
    __tablename__ = "odontogram_entries"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID
    tooth_number: int
    condition: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TreatmentRecord(SQLModel, table=True):
    __tablename__ = "treatment_records"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID
    treatment_id: Optional[uuid.UUID] = None
    tooth_number: Optional[int] = None
    description: Optional[str] = None
    cost: float = Field(default=0.0)
    status: str = Field(default="pending")
    treatment_date: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Appointment(SQLModel, table=True):
    __tablename__ = "appointments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID
    appointment_date: date
    start_time: str
    end_time: Optional[str] = None
    status: str = Field(default="scheduled")
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
