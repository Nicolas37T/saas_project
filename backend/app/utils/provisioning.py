import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from app.core.config import settings

def create_tenant_db(db_name: str) -> bool:
    """
    Crea una base de datos física en PostgreSQL para el nuevo tenant.
    NOTA: En entornos de nube (como Railway/Render), esto puede fallar si el 
    usuario de la base de datos no tiene permisos de 'CREATEDB'.
    Se recomienda usar la estrategia de 'schema' para máxima compatibilidad.
    """
    print(f"--- Intentando aprovisionar DB física: {db_name} ---")
    # Intentamos conectar a la base de datos 'postgres' para crear la nueva
    base_url = settings.DATABASE_URL.rsplit('/', 1)[0] + '/postgres'

    conn = None
    try:
        conn = psycopg2.connect(base_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute(f'CREATE DATABASE "{db_name}"')
        cur.close()
        print(f"✅ DB '{db_name}' creada con éxito.")
        return True
    except psycopg2.errors.DuplicateDatabase:
        print(f"ℹ️ DB '{db_name}' ya existía.")
        return True
    except psycopg2.errors.InsufficientPrivilege:
        print(f"⚠️ Error: Permisos insuficientes para crear bases de datos físicas.")
        print("MICA: Se recomienda cambiar el plan del tenant a uno que use la estrategia 'schema'.")
        return False
    except Exception as e:
        print(f"❌ Error inesperado al crear DB: {e}")
        return False
    finally:
        if conn:
            conn.close()

def create_tenant_schema(schema_name: str) -> bool:
    """
    Crea un esquema (schema) dentro de la base de datos maestra para el tenant.
    """
    print(f"--- Aprovisionando SCHEMA: {schema_name} ---")
    
    conn = None
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"')
        cur.close()
        
        # Create all tables in the new schema
        from sqlmodel import SQLModel
        from app.db.session import engine
        from sqlalchemy import text
        from app.db.tenant_models import Role, User, Setting, Patient, Treatment, MedicalHistory, Appointment, Payment, Odontogram
        
        with engine.connect() as sqla_conn:
            # Forzamos la busqueda de Tablas al nuevo esquema para esta conexion
            sqla_conn.execute(text(f'SET search_path TO "{schema_name}"'))
            
            # Filtramos para que SOLO construya estas tablas
            tenant_models = [Role, User, Setting, Patient, Treatment, MedicalHistory, Appointment, Payment, Odontogram]
            tenant_tables = [m.__table__ for m in tenant_models]
            
            SQLModel.metadata.create_all(sqla_conn, tables=tenant_tables)
            sqla_conn.commit()

        print(f"✅ Schema '{schema_name}' creado con tablas inicializadas")
        return True
    except Exception as e:
        print(f"❌ Error al crear Schema: {e}")
        return False
    finally:
        if conn:
            conn.close()
