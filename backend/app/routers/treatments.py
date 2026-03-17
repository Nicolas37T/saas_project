from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Treatment, Odontogram, Patient, PatientShare
from app.core.deps import get_current_tenant_user
from app.schemas.tenant_schemas import TreatmentCreate, TreatmentRead, TreatmentUpdate, TreatmentReadWithRelations

router = APIRouter(prefix="/treatments", tags=["Treatments"])

@router.post("/", response_model=TreatmentReadWithRelations)
def create_treatment(
    treatment: TreatmentCreate,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    db_treatment = Treatment.model_validate(treatment)
    db_treatment.created_by = current_user.id
    session.add(db_treatment)
    session.commit()
    session.refresh(db_treatment)
    return db_treatment

@router.get("/", response_model=List[TreatmentReadWithRelations])
def get_treatments(
    skip: int = 0, limit: int = 100,
    odontogram_id: uuid.UUID = None,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    try:
        query = select(Treatment).where(Treatment.status == True)

        # Optional filter by odontogram (tooth)
        if odontogram_id:
            query = query.where(Treatment.odontogram_id == odontogram_id)

        # Role-based filtering: doctors see all treatments for patients they have access to
        role = current_user.computed_role.lower()
        if role not in ['admin', 'recepcionista']:
            shared_query = select(PatientShare.patient_id).where(PatientShare.doctor_id == current_user.id)
            query = (
                query
                .join(Odontogram, Treatment.odontogram_id == Odontogram.id)
                .join(Patient, Odontogram.patient_id == Patient.id)
                .where(
                    (Patient.created_by == current_user.id) |
                    (Patient.assigned_doctor_id == current_user.id) |
                    (Patient.id.in_(shared_query))
                )
            )

        results = session.exec(
            query.order_by(Treatment.treatment_date.desc())
            .offset(skip)
            .limit(limit)
        ).all()

        treatments_list = []
        for row in results:
            t = row[0] if isinstance(row, tuple) else row
            
            # Mask price if the doctor did not create the treatment (and is not an admin)
            if role not in ['admin', 'recepcionista']:
                # If they didn't create it, and it's not a legacy treatment of a patient they own
                is_creator = t.created_by == current_user.id
                patient = t.odontogram.patient if t.odontogram else None
                owns_patient = patient and (patient.created_by == current_user.id or patient.assigned_doctor_id == current_user.id)
                
                if not is_creator and not (t.created_by is None and owns_patient):
                    t.price = 0
            
            treatments_list.append(t)

        return treatments_list
    except Exception as e:
        import traceback
        print(f"❌ ERROR IN get_treatments: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en get_treatments: {str(e)}")

@router.get("/{treatment_id}", response_model=TreatmentReadWithRelations)
def get_treatment(
    treatment_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    treatment = session.get(Treatment, treatment_id)
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    return treatment

@router.put("/{treatment_id}", response_model=TreatmentReadWithRelations)
def update_treatment(
    treatment_id: uuid.UUID,
    treatment_update: TreatmentUpdate,
    session: Session = Depends(get_session_for_tenant)
):
    db_treatment = session.get(Treatment, treatment_id)
    if not db_treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")

    update_data = treatment_update.model_dump(exclude_unset=True)
    db_treatment.sqlmodel_update(update_data)

    session.add(db_treatment)
    session.commit()
    session.refresh(db_treatment)
    return db_treatment

@router.delete("/{treatment_id}")
def delete_treatment(
    treatment_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    db_treatment = session.get(Treatment, treatment_id)
    if not db_treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")

    db_treatment.status = False
    session.add(db_treatment)
    session.commit()
    return {"ok": True}
