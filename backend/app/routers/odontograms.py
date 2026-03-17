from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Odontogram, Patient, PatientShare
from app.core.deps import get_current_tenant_user
from app.schemas.tenant_schemas import OdontogramCreate, OdontogramRead, OdontogramUpdate

router = APIRouter(prefix="/odontograms", tags=["Odontograms"])

@router.post("/", response_model=OdontogramRead)
def create_odontogram(
    odontogram: OdontogramCreate,
    session: Session = Depends(get_session_for_tenant)
):
    db_odontogram = Odontogram.model_validate(odontogram)
    session.add(db_odontogram)
    session.commit()
    session.refresh(db_odontogram)
    return db_odontogram

@router.get("/", response_model=List[OdontogramRead])
def get_odontograms(
    skip: int = 0, limit: int = 100,
    patient_id: uuid.UUID = None,
    session: Session = Depends(get_session_for_tenant),
    current_user = Depends(get_current_tenant_user)
):
    try:
        query = select(Odontogram).where(Odontogram.status == True)

        # Optional filter by patient
        if patient_id:
            query = query.where(Odontogram.patient_id == patient_id)

        # Role-based filtering
        role = current_user.computed_role.lower()
        if role not in ['owner', 'admin', 'recepcionista']:
            shared_query = select(PatientShare.patient_id).where(PatientShare.doctor_id == current_user.id)
            query = query.join(Patient, Odontogram.patient_id == Patient.id).where(
                (Patient.created_by == current_user.id) |
                (Patient.assigned_doctor_id == current_user.id) |
                (Patient.id.in_(shared_query))
            )

        results = session.exec(
            query.order_by(Odontogram.created_at.desc())
            .offset(skip)
            .limit(limit)
        ).all()

        odontograms_list = []
        for row in results:
            if isinstance(row, tuple):
                odontograms_list.append(row[0])
            else:
                odontograms_list.append(row)

        return odontograms_list
    except Exception as e:
        import traceback
        print(f"❌ ERROR IN get_odontograms: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en get_odontograms: {str(e)}")

@router.get("/{odontogram_id}", response_model=OdontogramRead)
def get_odontogram(
    odontogram_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    odontogram = session.get(Odontogram, odontogram_id)
    if not odontogram:
        raise HTTPException(status_code=404, detail="Odontogram not found")
    return odontogram

@router.put("/{odontogram_id}", response_model=OdontogramRead)
def update_odontogram(
    odontogram_id: uuid.UUID,
    odontogram_update: OdontogramUpdate,
    session: Session = Depends(get_session_for_tenant)
):
    db_odontogram = session.get(Odontogram, odontogram_id)
    if not db_odontogram:
        raise HTTPException(status_code=404, detail="Odontogram not found")

    update_data = odontogram_update.model_dump(exclude_unset=True)
    db_odontogram.sqlmodel_update(update_data)

    session.add(db_odontogram)
    session.commit()
    session.refresh(db_odontogram)
    return db_odontogram

@router.delete("/{odontogram_id}")
def delete_odontogram(
    odontogram_id: uuid.UUID,
    session: Session = Depends(get_session_for_tenant)
):
    db_odontogram = session.get(Odontogram, odontogram_id)
    if not db_odontogram:
        raise HTTPException(status_code=404, detail="Odontogram not found")

    db_odontogram.status = False
    session.add(db_odontogram)
    session.commit()
    return {"ok": True}
