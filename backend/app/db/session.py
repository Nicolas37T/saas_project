from sqlmodel import create_engine, Session
from sqlalchemy import event, text
from app.core.config import settings
from typing import Dict

# Motor único para toda la aplicación
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)


def get_session():
    """Sesión para la base de datos maestra (schema public)"""
    with Session(engine) as session:
        yield session


def get_tenant_session(schema_name: str):
    """
    Genera una sesión que opera en el schema del tenant.
    Setea search_path al inicio y lo restaura al cerrar.
    """
    with Session(engine) as session:
        session.execute(text(f"SET search_path TO {schema_name}, public"))
        yield session
        session.execute(text("SET search_path TO public"))

