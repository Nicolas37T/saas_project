from sqlalchemy import create_engine, text
from app.core.config import settings

def cleanup_public_schema():
    """
    Borra las tablas de inquilinos que se crearon por error en el esquema 'public'.
    ESTO NO BORRA LOS ESQUEMAS DE LOS TENANTS.
    """
    engine = create_engine(settings.DATABASE_URL)
    
    tenant_tables = [
        "appointments",
        "medical_history",
        "odontogram",
        "patients",
        "payments",
        "roles",
        "settings",
        "treatments",
        "users"
    ]
    
    with engine.connect() as conn:
        print("--- Iniciando limpieza del esquema PUBLIC ---")
        # Desactivar temporalmente FK checks si es necesario (Postgres usa CASCADE usualmente)
        for table in tenant_tables:
            try:
                print(f"Borrando tabla: public.{table}...")
                conn.execute(text(f'DROP TABLE IF EXISTS public."{table}" CASCADE;'))
                conn.commit()
                print(f"✅ Tabla {table} eliminada.")
            except Exception as e:
                print(f"❌ Error al borrar {table}: {e}")
        
        print("--- Limpieza completada ---")

if __name__ == "__main__":
    cleanup_public_schema()
