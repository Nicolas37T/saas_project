from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
import uuid

# ─── TENANT ROLES & USERS ─────────────────────────────────────────────────────

class Role(SQLModel, table=True):
    """Roles within a specific tenant (e.g., dentist, secretary)"""
    
    __tablename__ = "roles"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    users: List["User"] = Relationship(back_populates="role")

class User(SQLModel, table=True):
    """Users belonging to a specific tenant."""
    __tablename__ = "users"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    full_name: Optional[str] = None
    status: bool = Field(default=True)
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    role_id: Optional[uuid.UUID] = Field(default=None, foreign_key="roles.id")
    role: Optional[Role] = Relationship(back_populates="users")

# ─── SETTINGS ─────────────────────────────────────────────────────────────────

class Setting(SQLModel, table=True):
    """Tenant-specific settings"""
    __tablename__ = "settings"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    business_name: str
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    cellphone: Optional[str] = None
    address: Optional[str] = None
    currency: str = Field(default="Bs.")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")

# ─── DENTAL CLINIC MODELS ─────────────────────────────────────────────────────

class Patient(SQLModel, table=True):
    __tablename__ = "patients"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    first_name: str
    last_name: str
    phone: Optional[str] = None
    birth_day: Optional[datetime] = None
    address: Optional[str] = None
    description: Optional[str] = None
    status: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    created_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    medical_histories: List["MedicalHistory"] = Relationship(back_populates="patient")
    appointments: List["Appointment"] = Relationship(back_populates="patient")
    treatments: List["Treatment"] = Relationship(back_populates="patient")
    shared_with: List["PatientShare"] = Relationship(back_populates="patient")

class PatientShare(SQLModel, table=True):
    __tablename__ = "patient_shares"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    doctor_id: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    patient: Patient = Relationship(back_populates="shared_with")
    doctor: User = Relationship()

class Treatment(SQLModel, table=True):
    __tablename__ = "treatments"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    description: str
    price: float = Field(default=0.0)
    status_treatments: str = Field(default="pending") # e.g. pending, in_progress, completed
    duration_minutes: Optional[int] = None
    date: Optional[datetime] = None
    status: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    payments: List["Payment"] = Relationship(back_populates="treatment")
    odontograms: List["Odontogram"] = Relationship(back_populates="treatment")
    medical_histories: List["MedicalHistory"] = Relationship(back_populates="treatment")

    patient_id: Optional[uuid.UUID] = Field(default=None, foreign_key="patients.id")
    patient: Optional["Patient"] = Relationship(back_populates="treatments")

class MedicalHistory(SQLModel, table=True):
    __tablename__ = "medical_history"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    description: Optional[str] = None
    
    # Dental Hygiene Fields
    uses_toothbrush: bool = Field(default=True)
    uses_dentifrice: bool = Field(default=True)
    brushing_frequency: Optional[str] = None
    brushing_technique: Optional[str] = None
    uses_floss: bool = Field(default=False)
    
    status: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    patient: Patient = Relationship(back_populates="medical_histories")

    treatment_id: Optional[uuid.UUID] = Field(default=None, foreign_key="treatments.id")
    treatment: Optional[Treatment] = Relationship(back_populates="medical_histories")

    created_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")

class Appointment(SQLModel, table=True):
    __tablename__ = "appointments"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    appointment_date: datetime
    notes: Optional[str] = None
    appointment_status: str = Field(default="scheduled") # e.g. scheduled, confirmed, cancelled, completed
    status: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    patient: Patient = Relationship(back_populates="appointments")

class Payment(SQLModel, table=True):
    __tablename__ = "payments"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    amount: float
    payment_method: str = Field(default="cash") # cash, card, transfer
    payment_status: str = Field(default="completed") # pending, completed, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)

    treatment_id: uuid.UUID = Field(foreign_key="treatments.id")
    treatment: Treatment = Relationship(back_populates="payments")

class Odontogram(SQLModel, table=True):
    __tablename__ = "odontogram"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tooth_number: int
    tooth_type: str  # e.g., adult, child, molar, incisor etc.
    notes: Optional[str] = None
    price: float = Field(default=0.0)
    description: Optional[str] = None  # Treatment name for this tooth
    duration_minutes: Optional[int] = None
    treatment_date: Optional[datetime] = None
    status: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    treatment_id: uuid.UUID = Field(foreign_key="treatments.id")
    treatment: Treatment = Relationship(back_populates="odontograms")
