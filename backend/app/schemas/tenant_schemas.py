from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator
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
    is_shared: bool = False
    history_id: Optional[uuid.UUID] = None
    history_number: Optional[int] = None

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
    description: str = Field(..., max_length=1000)
    price: float = Field(0.0, ge=0.0)
    procedure_status: str = Field("pendiente", pattern="^(?i)(pendiente|en_progreso|completado|cancelado)$")
    treatment_date: Optional[datetime] = None
    status: bool = True
    odontogram_id: Optional[uuid.UUID] = None

class TreatmentCreate(TreatmentBase):
    pass

class TreatmentUpdate(BaseModel):
    description: Optional[str] = None
    price: Optional[float] = None
    procedure_status: Optional[str] = None
    treatment_date: Optional[datetime] = None
    status: Optional[bool] = None

class TreatmentRead(TreatmentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Medical History ---
class MedicalHistoryBase(BaseModel):
    conditions: Optional[str] = Field(None, max_length=1000)
    allergies: Optional[str] = Field(None, max_length=1000)
    medications: Optional[str] = Field(None, max_length=1000)
    description: Optional[str] = Field(None, max_length=1000)
    
    # Dental Hygiene
    uses_toothbrush: bool = True
    uses_dentifrice: bool = True
    brushing_frequency: Optional[str] = Field(None, max_length=100)
    brushing_technique: Optional[str] = Field(None, max_length=100)
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
    history_number: Optional[int] = None
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
    tooth_type: str = Field(..., pattern="^(?i)(Permanente|Temporal)$")
    notes: Optional[str] = Field(None, max_length=1000)
    status: bool = True
    patient_id: uuid.UUID

    @field_validator('tooth_number')
    @classmethod
    def validate_tooth_number(cls, v: int) -> int:
        valid_permanents = list(range(11, 19)) + list(range(21, 29)) + list(range(31, 39)) + list(range(41, 49))
        valid_temporals = list(range(51, 56)) + list(range(61, 66)) + list(range(71, 76)) + list(range(81, 86))
        if v not in valid_permanents and v not in valid_temporals:
            raise ValueError(f"Número de diente inválido (FDI): {v}")
        return v

class OdontogramCreate(OdontogramBase):
    pass

class OdontogramUpdate(BaseModel):
    tooth_number: Optional[int] = None
    tooth_type: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[bool] = None

class OdontogramRead(OdontogramBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    treatments: List[TreatmentRead] = []

    model_config = ConfigDict(from_attributes=True)

class OdontogramReadWithPatient(OdontogramRead):
    patient: Optional["PatientRead"] = None
    model_config = ConfigDict(from_attributes=True)


# --- Composite Creation Schemas ---

class FullOdontogramItem(BaseModel):
    """A single tooth record to add to the odontogram"""
    tooth_number: int
    tooth_type: str = Field(..., pattern="^(?i)(Permanente|Temporal)$")
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator('tooth_number')
    @classmethod
    def validate_tooth_number(cls, v: int) -> int:
        valid_permanents = list(range(11, 19)) + list(range(21, 29)) + list(range(31, 39)) + list(range(41, 49))
        valid_temporals = list(range(51, 56)) + list(range(61, 66)) + list(range(71, 76)) + list(range(81, 86))
        if v not in valid_permanents and v not in valid_temporals:
            raise ValueError(f"Número de diente inválido (FDI): {v}")
        return v

class FullTreatmentItem(BaseModel):
    """A single procedure applied to a tooth"""
    id: Optional[uuid.UUID] = None
    description: str = Field(..., max_length=1000)
    price: float = Field(0.0, ge=0.0)
    treatment_date: Optional[datetime] = None
    procedure_status: str = Field("pendiente", pattern="^(?i)(pendiente|en_progreso|completado|cancelado)$")

class FullMedicalHistoryCreate(BaseModel):
    # Medical History data
    conditions: Optional[str] = Field(None, max_length=1000)
    allergies: Optional[str] = Field(None, max_length=1000)
    medications: Optional[str] = Field(None, max_length=1000)
    medical_description: Optional[str] = Field(None, max_length=1000)
    
    # Dental Hygiene
    uses_toothbrush: bool = True
    uses_dentifrice: bool = True
    brushing_frequency: Optional[str] = Field(None, max_length=100)
    brushing_technique: Optional[str] = Field(None, max_length=100)
    uses_floss: bool = False
    
    # Odontogram items: each tooth with its treatments
    odontogram_items: List["OdontogramWithTreatments"] = []

class OdontogramWithTreatments(BaseModel):
    """A tooth entry for the composite history form"""
    tooth_number: int
    tooth_type: str = Field(..., pattern="^(?i)(Permanente|Temporal)$")
    notes: Optional[str] = Field(None, max_length=1000)
    treatments: List[FullTreatmentItem] = []

    @field_validator('tooth_number')
    @classmethod
    def validate_tooth_number(cls, v: int) -> int:
        valid_permanents = list(range(11, 19)) + list(range(21, 29)) + list(range(31, 39)) + list(range(41, 49))
        valid_temporals = list(range(51, 56)) + list(range(61, 66)) + list(range(71, 76)) + list(range(81, 86))
        if v not in valid_permanents and v not in valid_temporals:
            raise ValueError(f"Número de diente inválido (FDI): {v}")
        return v

class FullMedicalHistoryUpdate(BaseModel):
    # Medical History data
    conditions: Optional[str] = Field(None, max_length=1000)
    allergies: Optional[str] = Field(None, max_length=1000)
    medications: Optional[str] = Field(None, max_length=1000)
    medical_description: Optional[str] = Field(None, max_length=1000)
    
    # Dental Hygiene
    uses_toothbrush: bool = True
    uses_dentifrice: bool = True
    brushing_frequency: Optional[str] = Field(None, max_length=100)
    brushing_technique: Optional[str] = Field(None, max_length=100)
    uses_floss: bool = False
    
    # Odontogram items: each tooth with its treatments
    odontogram_items: List[OdontogramWithTreatments] = []

class TreatmentReadWithRelations(TreatmentRead):
    odontogram: Optional[OdontogramReadWithPatient] = None
    payments: List[PaymentRead] = []

    model_config = ConfigDict(from_attributes=True)

# --- Medicine ---
class MedicineBase(BaseModel):
    name: str

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    name: Optional[str] = None

class MedicineRead(MedicineBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Treatment Catalog ---
class TreatmentCatalogBase(BaseModel):
    name: str
    default_price: Optional[float] = None

class TreatmentCatalogCreate(TreatmentCatalogBase):
    pass

class TreatmentCatalogUpdate(BaseModel):
    name: Optional[str] = None
    default_price: Optional[float] = None

class TreatmentCatalogRead(TreatmentCatalogBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
