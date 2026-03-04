from sqlmodel import create_engine, Session
from app.core.config import settings
from typing import Dict

# Motor para la base de datos maestra
engine = create_engine(settings.DATABASE_URL)

# Caché para motores de tenants (evita crear uno nuevo en cada petición)
tenant_engines: Dict[str, any] = {}

def get_session():
    """Sesión para la base de datos maestra"""
    with Session(engine) as session:
        yield session

def get_tenant_engine(db_name: str):
    """Obtiene o crea un motor para una base de datos de tenant específica"""
    if db_name not in tenant_engines:
        # Construimos la URL para el tenant (asumiendo el mismo host/pass que la maestra)
        base_url = settings.DATABASE_URL.rsplit('/', 1)[0]
        tenant_url = f"{base_url}/{db_name}"
        tenant_engines[db_name] = create_engine(tenant_url)
    return tenant_engines[db_name]

def get_tenant_session(db_name: str):
    """Generador de sesiones para una base de datos de tenant específica"""
    tenant_engine = get_tenant_engine(db_name)
    with Session(tenant_engine) as session:
        yield session

