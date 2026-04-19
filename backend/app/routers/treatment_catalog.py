from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
import uuid

from app.db.session import get_session_for_tenant
from app.db.tenant_models import TreatmentCatalog, User
from app.schemas.tenant_schemas import TreatmentCatalogCreate, TreatmentCatalogRead, TreatmentCatalogUpdate
from app.routers.employees import get_current_tenant_user

router = APIRouter(prefix="/treatment-catalog", tags=["Tenant - Treatment Catalog"])

@router.post("/", response_model=TreatmentCatalogRead)
def create_catalog_item(
    *,
    session: Session = Depends(get_session_for_tenant),
    item: TreatmentCatalogCreate,
    current_user: User = Depends(get_current_tenant_user)
):
    db_item = TreatmentCatalog.from_orm(item)
    db_item.created_by = current_user.id
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

@router.get("/", response_model=List[TreatmentCatalogRead])
def read_catalog(
    *,
    session: Session = Depends(get_session_for_tenant),
    offset: int = 0,
    limit: int = 200
):
    items = session.exec(
        select(TreatmentCatalog)
        .order_by(TreatmentCatalog.name)
        .offset(offset)
        .limit(limit)
    ).all()
    return items

@router.patch("/{item_id}", response_model=TreatmentCatalogRead)
def update_catalog_item(
    *,
    session: Session = Depends(get_session_for_tenant),
    item_id: uuid.UUID,
    item: TreatmentCatalogUpdate,
    current_user: User = Depends(get_current_tenant_user)
):
    db_item = session.get(TreatmentCatalog, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Treatment catalog item not found")
    
    item_data = item.dict(exclude_unset=True)
    for key, value in item_data.items():
        setattr(db_item, key, value)
    
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_catalog_item(
    *,
    session: Session = Depends(get_session_for_tenant),
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_tenant_user)
):
    item = session.get(TreatmentCatalog, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Treatment catalog item not found")
    
    session.delete(item)
    session.commit()
    return {"ok": True}
