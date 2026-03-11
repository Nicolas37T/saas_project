from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from sqlmodel import Session, select
from typing import List
from datetime import datetime
import uuid
from datetime import datetime

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Patient, MedicalHistory, Treatment, Odontogram, Payment, User
from app.db.models import UserGlobal
from app.core.deps import get_current_user
from app.schemas.tenant_schemas import (
    PatientCreate, PatientRead, PatientUpdate,
    MedicalHistoryCreate, MedicalHistoryRead, MedicalHistoryUpdate,
    FullMedicalHistoryCreate, FullMedicalHistoryUpdate
)

router = APIRouter(prefix="/patients", tags=["Patients"])

# --- GLOBAL/STATIC ROUTES (Must be first to avoid UUID collisions) ---

@router.get("/all-medical-histories")
def get_all_medical_histories(
    session: Session = Depends(get_session_for_tenant)
):
    try:
        results = session.exec(
            select(MedicalHistory, Patient)
            .join(Patient, MedicalHistory.patient_id == Patient.id)
            .where(MedicalHistory.status == True)
            .order_by(MedicalHistory.created_at.desc())
        ).all()
        
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
    session: Session = Depends(get_session_for_tenant)
):
    try:
        history = session.get(MedicalHistory, history_id)
        if not history:
            raise HTTPException(status_code=404, detail="History not found")
            
        patient = session.get(Patient, history.patient_id)
        treatment = session.get(Treatment, history.treatment_id) if history.treatment_id else None
        
        odontogram = []
        payments = []
        
        if treatment:
            odontogram = treatment.odontograms
            payments = treatment.payments
            
        return jsonable_encoder({
            "history": history,
            "patient": patient,
            "treatment": treatment,
            "odontogram": odontogram,
            "payments": payments
        })
    except Exception as e:
        print(f"❌ Error in get_medical_history_detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/medical-history-update/{history_id}")
def update_full_medical_history(
    history_id: uuid.UUID,
    update_data: FullMedicalHistoryUpdate,
    session: Session = Depends(get_session_for_tenant)
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

        # 2. Update Treatment summary
        if db_history.treatment_id:
            db_treatment = session.get(Treatment, db_history.treatment_id)
            if db_treatment:
                # Calculate total price and build summary description
                total_price = sum(item.price for item in update_data.odontogram_items)
                total_duration = sum(item.duration_minutes for item in update_data.odontogram_items if item.duration_minutes)
                
                dates = [item.treatment_date for item in update_data.odontogram_items if item.treatment_date]
                latest_date = max(dates) if dates else datetime.utcnow()

                descriptions = [f"Diente {item.tooth_number}: {item.description}" for item in update_data.odontogram_items if item.description]
                summary_desc = " | ".join(descriptions) if descriptions else "Múltiples tratamientos"
                
                db_treatment.description = summary_desc
                db_treatment.price = total_price if total_price > 0 else update_data.price
                db_treatment.duration_minutes = total_duration
                db_treatment.date = latest_date
                db_treatment.updated_at = datetime.utcnow()
                session.add(db_treatment)

                # 3. Replace Odontogram items (delete old, create new)
                old_odontograms = session.exec(
                    select(Odontogram).where(Odontogram.treatment_id == db_treatment.id)
                ).all()
                for old in old_odontograms:
                    session.delete(old)

                for item in update_data.odontogram_items:
                    db_odontogram = Odontogram(
                        tooth_number=item.tooth_number,
                        tooth_type=item.tooth_type,
                        notes=item.notes,
                        price=item.price,
                        description=item.description,
                        duration_minutes=item.duration_minutes,
                        treatment_date=item.treatment_date,
                        treatment_id=db_treatment.id
                    )
                    session.add(db_odontogram)

                # 4. Update Payment
                old_payments = session.exec(
                    select(Payment).where(Payment.treatment_id == db_treatment.id)
                ).all()
                if old_payments:
                    payment = old_payments[0]
                    payment.amount = update_data.payment_amount if update_data.payment_amount is not None else total_price
                    payment.payment_method = update_data.payment_method
                    payment.payment_status = update_data.payment_status
                    session.add(payment)

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
    current_user: UserGlobal = Depends(get_current_user)
):
    db_patient = Patient.model_validate(patient)
    
    # Buscar el usuario dentro del esquema del tenant por email
    tenant_user = session.exec(select(User).where(User.email == current_user.email)).first()
    if tenant_user:
        db_patient.created_by = tenant_user.id
        
    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)
    return db_patient

@router.get("/", response_model=List[PatientRead])
def get_patients(
    skip: int = 0, limit: int = 100,
    session: Session = Depends(get_session_for_tenant)
):
    # Solo devuelve pacientes con status=True (eliminación suave)
    patients = session.exec(
        select(Patient).where(Patient.status == True).offset(skip).limit(limit)
    ).all()
    return patients

@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(
    patient_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

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
    current_user: UserGlobal = Depends(get_current_user)
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db_history = MedicalHistory.model_validate(history)
    db_history.patient_id = patient_id
    db_history.created_by = current_user.id
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
    current_user: UserGlobal = Depends(get_current_user)
):
    db_patient = session.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    try:
        # Calculate total price and build summary description
        total_price = sum(item.price for item in full_data.odontogram_items)
        final_price = total_price if total_price > 0 else full_data.price
        
        total_duration = sum(item.duration_minutes for item in full_data.odontogram_items if item.duration_minutes)
        dates = [item.treatment_date for item in full_data.odontogram_items if item.treatment_date]
        latest_date = max(dates) if dates else datetime.utcnow()

        descriptions = [f"Diente {item.tooth_number}: {item.description}" for item in full_data.odontogram_items if item.description]
        summary_desc = " | ".join(descriptions) if descriptions else "Múltiples tratamientos"

        # 1. Create Treatment (as a summary)
        db_treatment = Treatment(
            description=summary_desc,
            price=final_price,
            duration_minutes=total_duration,
            date=latest_date,
            status_treatments="completed"
        )
        session.add(db_treatment)
        session.flush()

        # 2. Create Odontogram items with individual treatment data
        for item in full_data.odontogram_items:
            db_odontogram = Odontogram(
                tooth_number=item.tooth_number,
                tooth_type=item.tooth_type,
                notes=item.notes,
                price=item.price,
                description=item.description,
                duration_minutes=item.duration_minutes,
                treatment_date=item.treatment_date,
                treatment_id=db_treatment.id
            )
            session.add(db_odontogram)

        # 3. Create Payment
        db_payment = Payment(
            amount=full_data.payment_amount if full_data.payment_amount else final_price,
            payment_method=full_data.payment_method,
            payment_status=full_data.payment_status,
            treatment_id=db_treatment.id
        )
        session.add(db_payment)

        # 4. Create Medical History entry
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
            treatment_id=db_treatment.id,
            created_by=current_user.id
        )
        session.add(db_history)

        session.commit()
        session.refresh(db_history)
        return db_history

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating medical history: {str(e)}")
