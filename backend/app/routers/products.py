from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
import uuid
import re

from app.core.deps import get_current_user
from app.db.models import UserGlobal, Tenant
from app.db.session import engine
from app.db.tenant_models import Product

router = APIRouter(prefix="/products", tags=["Products"])

_initialized_schemas: set = set()


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = 0.0
    stock: int = 0


def _ensure_tenant_tables(schema_name: str):
    """Crea la tabla products dentro del schema usando el pool existente."""
    if schema_name in _initialized_schemas:
        return
    if not re.match(r'^[a-zA-Z0-9_]+$', schema_name):
        raise HTTPException(status_code=400, detail="Schema name inválido")
    s = schema_name
    with engine.connect() as conn:
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS {s}.products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR NOT NULL, description VARCHAR,
                price DOUBLE PRECISION DEFAULT 0.0,
                stock INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT now())
        """))
        conn.commit()
    _initialized_schemas.add(schema_name)


def _open_session(user: UserGlobal):
    """Retorna (session, tenant) con search_path listo — una sola sesión."""
    if not user.tenant_id:
        raise HTTPException(status_code=403, detail="No tienes un negocio asociado")
    session = Session(engine)
    tenant = session.get(Tenant, user.tenant_id)
    if not tenant:
        session.close()
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    _ensure_tenant_tables(tenant.schema_name)
    session.execute(text(f"SET search_path TO {tenant.schema_name}, public"))
    return session, tenant


def _close_session(session: Session):
    session.execute(text("SET search_path TO public"))
    session.close()


@router.get("")
def list_products(current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        products = session.exec(select(Product)).all()
        return [
            {
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
                "price": p.price,
                "stock": p.stock,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in products
        ]
    finally:
        _close_session(session)


@router.post("")
def create_product(data: ProductCreate, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        product = Product(
            name=data.name,
            description=data.description,
            price=data.price,
            stock=data.stock,
        )
        session.add(product)
        session.commit()
        session.refresh(product)
        return {
            "id": str(product.id),
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock": product.stock,
            "created_at": product.created_at.isoformat() if product.created_at else None,
        }
    finally:
        _close_session(session)


@router.delete("/{product_id}")
def delete_product(product_id: str, current_user: UserGlobal = Depends(get_current_user)):
    session, _ = _open_session(current_user)
    try:
        try:
            pid = uuid.UUID(product_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de producto inválido")

        product = session.get(Product, pid)
        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        session.delete(product)
        session.commit()
        return {"message": "Producto eliminado"}
    finally:
        _close_session(session)
