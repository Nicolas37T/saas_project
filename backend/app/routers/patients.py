from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from sqlmodel import Session, select
from typing import List
from datetime import datetime
import uuid
from datetime import datetime

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Patient, MedicalHistory, Treatment, Odontogram, Payment, User, PatientShare, Appointment
from app.db.models import UserGlobal
from app.core.deps import get_current_tenant_user
from app.schemas.tenant_schemas import (
    PatientCreate, PatientRead, PatientUpdate,
    MedicalHistoryCreate, MedicalHistoryRead, MedicalHistoryUpdate,
    FullMedicalHistoryCreate, FullMedicalHistoryUpdate,
    PatientShareCreate, PatientShareRead
)

router = APIRouter(prefix="/patients", tags=["Patients"])

# --- GLOBAL/STATIC ROUTES (Must be first to avoid UUID collisions) ---

@router.get("/all-medical-histories")
def get_all_medical_histories(
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    try:
        query = select(MedicalHistory, Patient).join(Patient, MedicalHistory.patient_id == Patient.id).where(MedicalHistory.status == True)
        
        # Role-based filtering
        role = current_user.computed_role.lower()
        if role not in ['owner', 'admin', 'recepcionista']:
            # For doctors: see histories of patients they created, are assigned to, OR shared with them
            shared_query = select(PatientShare.patient_id).where(PatientShare.doctor_id == current_user.id)
            query = query.where(
                (Patient.created_by == current_user.id) | 
                (Patient.assigned_doctor_id == current_user.id) |
                (Patient.id.in_(shared_query))
            )
            
        results = session.exec(query.order_by(MedicalHistory.created_at.desc())).all()
        
        histories_list = [
            {
                "id": str(h.id),
                "created_at": h.created_at,
                "patient_name": f"{p.first_name} {p.last_name}",
                "patient_id": str(p.id),
                "conditions": h.conditions,
                "description": h.description
            }
            for h, p in results
        ]
        
        return jsonable_encoder(histories_list)
    except Exception as e:
        print(f"❌ Error in get_all_medical_histories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/medical-history-detail/{history_id}")
def get_medical_history_detail(
    history_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    try:
        history = session.get(MedicalHistory, history_id)
        if not history:
            raise HTTPException(status_code=404, detail="History not found")
            
        patient = session.get(Patient, history.patient_id)
        
        # Load odontograms for this patient with their treatments
        odontograms = session.exec(
            select(Odontogram).where(
                Odontogram.patient_id == history.patient_id,
                Odontogram.status == True
            )
        ).all()
        
        # Role-based filtering for treatments
        role = current_user.computed_role.lower()

        # Build a structured list: each odontogram with its treatments
        odontogram_data = []
        for o in odontograms:
            treatments_query = select(Treatment).where(
                Treatment.odontogram_id == o.id,
                Treatment.status == True
            )
            
            treatments = session.exec(treatments_query).all()
            
            mapped_treatments = []
            for t in treatments:
                price = t.price
                if role not in ['admin', 'recepcionista']:
                    is_creator = t.created_by == current_user.id
                    owns_patient = patient.created_by == current_user.id or patient.assigned_doctor_id == current_user.id
                    if not is_creator and not (t.created_by is None and owns_patient):
                        price = 0
                        
                mapped_treatments.append({
                    "id": str(t.id),
                    "description": t.description,
                    "price": price,
                    "procedure_status": t.procedure_status,
                    "treatment_date": t.treatment_date,
                    "status": t.status,
                })
            
            odontogram_data.append({
                "id": str(o.id),
                "tooth_number": o.tooth_number,
                "tooth_type": o.tooth_type,
                "notes": o.notes,
                "status": o.status,
                "treatments": mapped_treatments
            })
            
        return jsonable_encoder({
            "history": history,
            "patient": patient,
            "odontograms": odontogram_data,
        })
    except Exception as e:
        print(f"❌ Error in get_medical_history_detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/medical-history-update/{history_id}")
def update_full_medical_history(
    history_id: uuid.UUID,
    update_data: FullMedicalHistoryUpdate,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    try:
        db_history = session.get(MedicalHistory, history_id)
        if not db_history:
            raise HTTPException(status_code=404, detail="History not found")

        # 1. Update MedicalHistory fields
        db_history.conditions = update_data.conditions
        db_history.allergies = update_data.allergies
        db_history.medications = update_data.medications
        db_history.description = update_data.medical_description
        db_history.uses_toothbrush = update_data.uses_toothbrush
        db_history.uses_dentifrice = update_data.uses_dentifrice
        db_history.brushing_frequency = update_data.brushing_frequency
        db_history.brushing_technique = update_data.brushing_technique
        db_history.uses_floss = update_data.uses_floss
        db_history.updated_at = datetime.utcnow()
        session.add(db_history)

        # 2. Upsert Odontogram + Treatments per tooth
        patient_id = db_history.patient_id
        existing_odontograms = session.exec(
            select(Odontogram).where(
                Odontogram.patient_id == patient_id,
                Odontogram.status == True
            )
        ).all()
        existing_by_tooth = {o.tooth_number: o for o in existing_odontograms}
        incoming_tooth_numbers = set()

        for item in update_data.odontogram_items:
            incoming_tooth_numbers.add(item.tooth_number)
            
            if item.tooth_number in existing_by_tooth:
                db_odontogram = existing_by_tooth[item.tooth_number]
                db_odontogram.tooth_type = item.tooth_type
                db_odontogram.notes = item.notes
                db_odontogram.updated_at = datetime.utcnow()
                session.add(db_odontogram)
            else:
                db_odontogram = Odontogram(
                    tooth_number=item.tooth_number,
                    tooth_type=item.tooth_type,
                    notes=item.notes,
                    patient_id=patient_id
                )
                session.add(db_odontogram)
                session.flush()

            # Upsert treatments for this tooth
            old_treatments = session.exec(
                select(Treatment).where(Treatment.odontogram_id == db_odontogram.id)
            ).all()
            old_treatment_dict = {str(t.id): t for t in old_treatments}
            incoming_treatment_ids = set()

            for t_item in item.treatments:
                t_item_id_str = str(t_item.id) if getattr(t_item, "id", None) else None
                if t_item_id_str and t_item_id_str in old_treatment_dict:
                    incoming_treatment_ids.add(t_item_id_str)
                    db_treatment = old_treatment_dict[t_item_id_str]
                    
                    # Only update if the user created it, or it's a legacy treatment
                    if db_treatment.created_by == current_user.id or db_treatment.created_by is None:
                        db_treatment.description = t_item.description
                        db_treatment.price = t_item.price
                        if t_item.treatment_date:
                            db_treatment.treatment_date = t_item.treatment_date
                        db_treatment.procedure_status = t_item.procedure_status
                    
                    session.add(db_treatment)
                else:
                    db_treatment = Treatment(
                        description=t_item.description,
                        price=t_item.price,
                        treatment_date=t_item.treatment_date,
                        procedure_status=t_item.procedure_status,
                        odontogram_id=db_odontogram.id,
                        created_by=current_user.id
                    )
                    session.add(db_treatment)
                    
            for old_id, old_t in old_treatment_dict.items():
                if old_id not in incoming_treatment_ids:
                    # Only soft delete if the user owns it
                    if old_t.created_by == current_user.id or old_t.created_by is None:
                        old_t.status = False
                    session.add(old_t)

        # Soft-delete teeth removed from the incoming list
        for tooth_num, old_o in existing_by_tooth.items():
            if tooth_num not in incoming_tooth_numbers:
                old_o.status = False
                session.add(old_o)

        session.commit()
        session.refresh(db_history)
        return jsonable_encoder(db_history)

    except Exception as e:
        session.rollback()
        print(f"❌ Error in update_full_medical_history: {e}")
        raise HTTPException(status_code=400, detail=f"Error updating medical history: {str(e)}")


@router.delete("/medical-history-delete/{history_id}")
def soft_delete_medical_history(
    history_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    try:
        db_history = session.get(MedicalHistory, history_id)
        if not db_history:
            raise HTTPException(status_code=404, detail="History not found")
        
        db_history.status = False
        db_history.updated_at = datetime.utcnow()
        session.add(db_history)
        session.commit()
        return {"ok": True, "message": "History soft-deleted successfully"}
    except Exception as e:
        session.rollback()
        print(f"❌ Error in soft_delete_medical_history: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# --- PATIENTS ---

@router.post("/", response_model=PatientRead)
def create_patient(
    patient: PatientCreate,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    db_patient = Patient.model_validate(patient)
    
    # Buscar el usuario dentro del esquema del tenant por email
    tenant_user = session.exec(select(User).where(User.email == current_user.email)).first()
    if tenant_user:
        db_patient.created_by = tenant_user.id
        # El campo creator_name solo va en el esquema de respuesta, no en el modelo DB
        
    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)
    
    # Poblar creator_name para la respuesta
    res = PatientRead.model_validate(db_patient)
    if tenant_user:
        res.creator_name = tenant_user.full_name
    return res

@router.get("/", response_model=List[PatientRead])
def get_patients(
    skip: int = 0, limit: int = 100,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    try:
        # Base query for active patients
        # Join with User to get the creator's name
        query = (
            select(Patient, User.full_name)
            .outerjoin(User, Patient.created_by == User.id)
            .where(Patient.status == True)
        )
        
        # Apply privacy filter based on role
        role = current_user.computed_role.lower()
        if role not in ['owner', 'admin', 'recepcionista']:
            # For doctors: see patients they created OR assigned to OR shared with them OR have appointments with
            shared_query = select(PatientShare.patient_id).where(PatientShare.doctor_id == current_user.id)
            appointment_query = select(Appointment.patient_id).where(Appointment.assigned_doctor_id == current_user.id)
            
            query = query.where(
                (Patient.created_by == current_user.id) | 
                (Patient.assigned_doctor_id == current_user.id) |
                (Patient.id.in_(shared_query)) |
                (Patient.id.in_(appointment_query))
            )
            
        results = session.exec(query.offset(skip).limit(limit)).all()
        
        # Get all patient IDs in the results
        patient_ids = []
        for row in results:
            try:
                p, _ = row
                patient_ids.append(p.id)
            except (ValueError, TypeError):
                patient_ids.append(row.id)
                
        # Which of these patients are shared?
        shared_ids = set()
        if patient_ids:
            shared_query = select(PatientShare.patient_id).where(PatientShare.patient_id.in_(patient_ids))
            shared_ids = {row for row in session.exec(shared_query).all()}
        
        patients = []
        for row in results:
            # SQLAlchemy Row supports unpacking similar to a tuple
            try:
                p, creator_name = row
            except (ValueError, TypeError):
                p = row
                creator_name = None

            p_read = PatientRead.model_validate(p)
            p_read.creator_name = creator_name
            p_read.is_shared = p.id in shared_ids
            patients.append(p_read)
            
        return patients
    except Exception as e:
        import traceback
        print(f"❌ ERROR IN get_patients: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en get_patients: {str(e)}")

@router.post("/{patient_id}/share", response_model=PatientShareRead)
def share_patient(
    patient_id: uuid.UUID,
    data: PatientShareCreate,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    """Permite compartir un paciente con otro doctor"""
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
    # Verificar que el usuario tenga permiso para compartir (dueño o asignado o admin)
    role = current_user.computed_role.lower()
    is_owner_or_admin = role in ['owner', 'admin']
    is_assigned = patient.assigned_doctor_id == current_user.id
    is_creator = patient.created_by == current_user.id
    
    if not (is_owner_or_admin or is_assigned or is_creator):
        raise HTTPException(status_code=403, detail="No tienes permiso para compartir este paciente")
        
    # Verificar que el destino sea un doctor (opcional pero recomendado)
    target_doctor = session.get(User, data.doctor_id)
    if not target_doctor:
        raise HTTPException(status_code=404, detail="Doctor no encontrado")
        
    # Crear el registro de compartir
    existing_share = session.exec(select(PatientShare).where(
        PatientShare.patient_id == patient_id, 
        PatientShare.doctor_id == data.doctor_id
    )).first()
    
    if existing_share:
        return existing_share
        
    db_share = PatientShare(patient_id=patient_id, doctor_id=data.doctor_id)
    session.add(db_share)
    session.commit()
    session.refresh(db_share)
    
    # Poblar nombre para la respuesta
    res = PatientShareRead.model_validate(db_share)
    res.doctor_name = target_doctor.full_name
    return res

@router.delete("/{patient_id}/share/{doctor_id}")
def unshare_patient(
    patient_id: uuid.UUID,
    doctor_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    """Quitar el acceso compartido de un doctor"""
    patient = session.get(Patient, patient_id)
    if not patient:
         raise HTTPException(status_code=404, detail="Paciente no encontrado")
         
    role = current_user.computed_role.lower()
    is_owner_or_admin = role in ['owner', 'admin']
    is_assigned = patient.assigned_doctor_id == current_user.id
    is_creator = patient.created_by == current_user.id
    
    if not (is_owner_or_admin or is_assigned or is_creator):
        raise HTTPException(status_code=403, detail="No tienes permiso para dejar de compartir este paciente")

    share_record = session.exec(select(PatientShare).where(
        PatientShare.patient_id == patient_id, 
        PatientShare.doctor_id == doctor_id
    )).first()
    
    if share_record:
        session.delete(share_record)
        session.commit()
        
    return {"ok": True}

@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(
    patient_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    res = PatientRead.model_validate(patient)
    shared = session.exec(select(PatientShare).where(PatientShare.patient_id == patient_id)).first()
    res.is_shared = shared is not None
    return res

@router.get("/{patient_id}/has-history")
def check_patient_history(
    patient_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    """Verifica si un paciente ya tiene un historial clínico activo."""
    exists = session.exec(
        select(MedicalHistory).where(MedicalHistory.patient_id == patient_id, MedicalHistory.status == True)
    ).first()
    return {"has_history": exists is not None}

@router.put("/{patient_id}", response_model=PatientRead)
def update_patient(
    patient_id: uuid.UUID,
    patient_update: PatientUpdate,
    session: Session = Depends(get_session_for_tenant)
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()  # Siempre actualizar timestamp
    db_patient.sqlmodel_update(update_data)
    
    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)
    return db_patient

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    """Eliminación suave: solo cambia status a False, no elimina de la BD."""
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db_patient.status = False
    db_patient.updated_at = datetime.utcnow()
    session.add(db_patient)
    session.commit()
    return {"ok": True, "message": "Paciente desactivado correctamente"}

# --- MEDICAL HISTORY ---

@router.post("/{patient_id}/medical-history", response_model=MedicalHistoryRead)
def create_medical_history(
    patient_id: uuid.UUID,
    history: MedicalHistoryCreate,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db_history = MedicalHistory.model_validate(history)
    db_history.patient_id = patient_id
    
    # Buscar el usuario dentro del esquema del tenant por email
    tenant_user = session.exec(select(User).where(User.email == current_user.email)).first()
    if tenant_user:
        db_history.created_by = tenant_user.id
        
    session.add(db_history)
    session.commit()
    session.refresh(db_history)
    return db_history

@router.get("/{patient_id}/medical-history", response_model=List[MedicalHistoryRead])
def get_medical_histories(
    patient_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient.medical_histories

@router.post("/{patient_id}/full-history", response_model=MedicalHistoryRead)
def create_full_medical_history(
    patient_id: uuid.UUID,
    full_data: FullMedicalHistoryCreate,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    try:
        # 0. Check if patient already has a medical history
        existing_history = session.exec(
            select(MedicalHistory).where(MedicalHistory.patient_id == patient_id, MedicalHistory.status == True)
        ).first()
        
        if existing_history:
            raise HTTPException(status_code=400, detail="Este paciente ya tiene un historial médico activo. Solo se permite un historial por paciente.")

        # 1. Create Medical History entry
        db_history = MedicalHistory(
            conditions=full_data.conditions,
            allergies=full_data.allergies,
            medications=full_data.medications,
            description=full_data.medical_description,
            uses_toothbrush=full_data.uses_toothbrush,
            uses_dentifrice=full_data.uses_dentifrice,
            brushing_frequency=full_data.brushing_frequency,
            brushing_technique=full_data.brushing_technique,
            uses_floss=full_data.uses_floss,
            patient_id=patient_id,
        )
        tenant_user = session.exec(select(User).where(User.email == current_user.email)).first()
        if tenant_user:
            db_history.created_by = tenant_user.id
            
        session.add(db_history)
        session.flush()

        # 2. Create Odontogram (tooth) records + Treatments per tooth
        for item in full_data.odontogram_items:
            db_odontogram = Odontogram(
                tooth_number=item.tooth_number,
                tooth_type=item.tooth_type,
                notes=item.notes,
                patient_id=patient_id
            )
            session.add(db_odontogram)
            session.flush()

            for t_item in item.treatments:
                db_treatment = Treatment(
                    description=t_item.description,
                    price=t_item.price,
                    treatment_date=t_item.treatment_date,
                    procedure_status=t_item.procedure_status,
                    odontogram_id=db_odontogram.id,
                    created_by=db_history.created_by
                )
                session.add(db_treatment)

        session.commit()
        session.refresh(db_history)
        return db_history

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating medical history: {str(e)}")
