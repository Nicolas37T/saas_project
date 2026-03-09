from sqlmodel import create_engine, Session, text
from app.core.config import settings
from typing import Dict

# Motor para la base de datos maestra
engine = create_engine(settings.DATABASE_URL)

# Caché para motores de tenants (evita crear uno nuevo en cada petición)
tenant_engines: Dict[str, any] = {}

def get_session():
    """Sesión para la base de datos maestra o global"""
    with Session(engine) as session:
        yield session

def get_tenant_engine(db_name: str):
    """Obtiene o crea un motor para una base de datos de tenant física específica"""
    if db_name not in tenant_engines:
        base_url = settings.DATABASE_URL.rsplit('/', 1)[0]
        tenant_url = f"{base_url}/{db_name}"
        tenant_engines[db_name] = create_engine(tenant_url)
    return tenant_engines[db_name]

from fastapi import Request

def get_session_for_tenant(request: Request):
    """
    Generador de sesiones inteligente: 
    - Extrae el tenant del estado de la petición (inyectado por el middleware).
    - Si el tenant es 'database', abre conexión a su DB dedicada.
    - Si es 'schema', usa la DB maestra y cambia el search_path.
    """
    tenant = getattr(request.state, "tenant", None)
    if not tenant:
        with Session(engine) as session:
            yield session
        return

    if tenant.strategy == "database":
        # Estrategia: Base de Datos Separada (Física)
        tenant_engine = get_tenant_engine(tenant.db_name)
        with Session(tenant_engine) as session:
            yield session
    else:
        # Estrategia: Esquema (Schema) dentro de la DB Maestra
        with Session(engine) as session:
            # Ponemos el esquema en el search_path para esta sesión
            session.exec(text(f'SET search_path TO "{tenant.subdomain}"'))
            yield session

