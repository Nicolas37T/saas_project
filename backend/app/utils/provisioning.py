import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from app.core.config import settings


def create_tenant_schema(schema_name: str) -> bool:
    """
    Crea un schema PostgreSQL aislado para el nuevo tenant.
    Compatible con Supabase (no requiere CREATE DATABASE).
    """
    print(f"--- Aprovisionando schema: {schema_name} ---")

    conn = None
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute(
            sql.SQL("CREATE SCHEMA IF NOT EXISTS {}").format(
                sql.Identifier(schema_name)
            )
        )
        cur.close()
        print(f"✅ Schema '{schema_name}' creado")
        return True
    except Exception as e:
        print(f"❌ Error al crear schema: {e}")
        return False
    finally:
        if conn:
            conn.close()
