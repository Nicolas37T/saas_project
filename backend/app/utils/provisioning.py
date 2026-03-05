import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from app.core.config import settings

def create_tenant_db(db_name: str) -> bool:
    """
    1. Crea una base de datos física en PostgreSQL para el nuevo tenant.
    (En MVP simplificado, no creamos tablas dentro, queda vacía).
    """
    print(f"--- Aprovisionando DB: {db_name} ---")
    base_url = settings.DATABASE_URL.rsplit('/', 1)[0] + '/postgres'

    conn = None
    try:
        conn = psycopg2.connect(base_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute(f'CREATE DATABASE "{db_name}"')
        cur.close()
        print(f"✅ DB '{db_name}' creada")
        return True
    except psycopg2.errors.DuplicateDatabase:
        print(f"ℹ️ DB '{db_name}' ya existía.")
        return True
    except Exception as e:
        print(f"❌ Error al crear DB: {e}")
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
        print(f"✅ Schema '{schema_name}' creado")
        return True
    except Exception as e:
        print(f"❌ Error al crear Schema: {e}")
        return False
    finally:
        if conn:
            conn.close()
