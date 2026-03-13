from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime
import uuid

# ─── TENANT ROLES & USERS ─────────────────────────────────────────────────────

class RoleBase(BaseModel):
    name: str

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None

class RoleRead(RoleBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    status: bool = True
    role_id: Optional[uuid.UUID] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    status: Optional[bool] = None
    role_id: Optional[uuid.UUID] = None
    password: Optional[str] = None

class UserRead(UserBase):
    id: uuid.UUID
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── SETTINGS ─────────────────────────────────────────────────────────────────

class SettingBase(BaseModel):
    business_name: str
    logo_url: Optional[str] = None

class SettingCreate(SettingBase):
    pass

class SettingUpdate(BaseModel):
    business_name: Optional[str] = None
    logo_url: Optional[str] = None

class SettingRead(SettingBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


# ─── DENTAL CLINIC MODELS ─────────────────────────────────────────────────────

# --- Patient ---
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    birth_day: Optional[datetime] = None
    address: Optional[str] = None
    description: Optional[str] = None
    status: bool = True
    assigned_doctor_id: Optional[uuid.UUID] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    birth_day: Optional[datetime] = None
    address: Optional[str] = None
    description: Optional[str] = None
    status: Optional[bool] = None
    assigned_doctor_id: Optional[uuid.UUID] = None

class PatientRead(PatientBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[uuid.UUID] = None
    creator_name: Optional[str] = None
    # No incluimos shared_with aquí para evitar recursión pesada,
    # pero podemos agregar una lista simple de IDs si fuera necesario.

    model_config = ConfigDict(from_attributes=True)

class PatientShareBase(BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID

class PatientShareCreate(BaseModel):
    doctor_id: uuid.UUID

class PatientShareRead(PatientShareBase):
    id: uuid.UUID
    created_at: datetime
    doctor_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Treatment ---
class TreatmentBase(BaseModel):
    description: str
    price: float = 0.0
    status_treatments: str = "pendiente"
    duration_minutes: Optional[int] = None
    date: Optional[datetime] = None
    status: bool = True
    patient_id: Optional[uuid.UUID] = None

class TreatmentCreate(TreatmentBase):
    pass

class TreatmentUpdate(BaseModel):
    description: Optional[str] = None
    price: Optional[float] = None
    status_treatments: Optional[str] = None
    duration_minutes: Optional[int] = None
    date: Optional[datetime] = None
    status: Optional[bool] = None

class TreatmentRead(TreatmentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Medical History ---
class MedicalHistoryBase(BaseModel):
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    description: Optional[str] = None
    
    # Dental Hygiene
    uses_toothbrush: bool = True
    uses_dentifrice: bool = True
    brushing_frequency: Optional[str] = None
    brushing_technique: Optional[str] = None
    uses_floss: bool = False
    
    status: bool = True
    patient_id: uuid.UUID
    treatment_id: Optional[uuid.UUID] = None

class MedicalHistoryCreate(MedicalHistoryBase):
    pass

class MedicalHistoryUpdate(BaseModel):
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    description: Optional[str] = None
    status: Optional[bool] = None
    treatment_id: Optional[uuid.UUID] = None

class MedicalHistoryRead(MedicalHistoryBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


# --- Appointment ---
class AppointmentBase(BaseModel):
    appointment_date: datetime
    notes: Optional[str] = None
    appointment_status: str = "scheduled"
    status: bool = True
    patient_id: uuid.UUID
    assigned_doctor_id: Optional[uuid.UUID] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[datetime] = None
    notes: Optional[str] = None
    appointment_status: Optional[str] = None
    status: Optional[bool] = None
    assigned_doctor_id: Optional[uuid.UUID] = None

class AppointmentRead(AppointmentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Payment ---
class PaymentBase(BaseModel):
    amount: float
    payment_method: str = "cash"
    payment_status: str = "completed"
    treatment_id: uuid.UUID

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None

class PaymentRead(PaymentBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Odontogram ---
class OdontogramBase(BaseModel):
    tooth_number: int
    tooth_type: str
    notes: Optional[str] = None
    price: float = 0.0
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    treatment_date: Optional[datetime] = None
    procedure_status: str = "pendiente"
    status: bool = True
    treatment_id: uuid.UUID

class OdontogramCreate(OdontogramBase):
    pass

class OdontogramUpdate(BaseModel):
    tooth_number: Optional[int] = None
    tooth_type: Optional[str] = None
    notes: Optional[str] = None
    procedure_status: Optional[str] = None
    status: Optional[bool] = None

class OdontogramRead(OdontogramBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Composite Creation Schemas ---

class FullMedicalHistoryItem(BaseModel):
    tooth_number: int
    tooth_type: str
    notes: Optional[str] = None
    price: float = 0.0
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    treatment_date: Optional[datetime] = None
    procedure_status: str = "pendiente"

class FullMedicalHistoryCreate(BaseModel):
    # Medical History data
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    medical_description: Optional[str] = None
    
    # Dental Hygiene
    uses_toothbrush: bool = True
    uses_dentifrice: bool = True
    brushing_frequency: Optional[str] = None
    brushing_technique: Optional[str] = None
    uses_floss: bool = False
    
    # Treatment summary price
    price: float = 0.0
    
    # Odontogram data (now contains per-tooth treatment data)
    odontogram_items: List[FullMedicalHistoryItem] = []



class FullMedicalHistoryUpdate(BaseModel):
    # Medical History data
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    medical_description: Optional[str] = None
    
    # Dental Hygiene
    uses_toothbrush: bool = True
    uses_dentifrice: bool = True
    brushing_frequency: Optional[str] = None
    brushing_technique: Optional[str] = None
    uses_floss: bool = False
    
    # Treatment data summary
    price: float = 0.0
    
    # Odontogram data
    odontogram_items: List[FullMedicalHistoryItem] = []
    
    # Odontogram data
    odontogram_items: List[FullMedicalHistoryItem] = []

class TreatmentReadWithRelations(TreatmentRead):
    patient: Optional[PatientRead] = None
    payments: List[PaymentRead] = []
    odontograms: List[OdontogramRead] = []

    model_config = ConfigDict(from_attributes=True)
