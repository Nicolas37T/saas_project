from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import Odontogram
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
    session: Session = Depends(get_session_for_tenant)
):
    odontograms = session.exec(select(Odontogram).offset(skip).limit(limit)).all()
    return odontograms

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
    
    session.delete(db_odontogram)
    session.commit()
    return {"ok": True}
