import sys
import os
from sqlalchemy import create_engine, text

# Agregamos el directorio actual al path para importar módulos locales si fuera necesario
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def cleanup_production():
    """
    Script de limpieza definitiva para el esquema 'public' en Railway.
    Elimina tablas que pertenecen a los tenants y que se crearon por error en 'public'.
    """
    # Intentamos obtener la URL de las variables de entorno o del argumento
    database_url = os.getenv("DATABASE_URL")
    if not database_url and len(sys.argv) > 1:
        database_url = sys.argv[1]
    
    if not database_url:
        print("❌ Error: No se proporcionó DATABASE_URL (vía env o argumento).")
        print("Uso: python cleanup_production.py <DATABASE_URL>")
        return

    # Ajustar URL para SQLAlchemy si es necesario
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    print(f"--- Iniciando limpieza de base de datos en: {database_url.split('@')[-1]} ---")
    
    engine = create_engine(database_url)
    
    # Nombres de tablas que NO deben estar en public (pertenecen a schemas de tenants)
    tenant_tables = [
        "appointments", "medical_history", "odontogram", "patients", 
        "payments", "roles", "settings", "treatments", "users",
        # Versiones en singular por si acaso
        "appointment", "medicalhistory", "role", "setting", "treatment", "user"
    ]
    
    with engine.connect() as conn:
        # Asegurarnos de que estamos operando sobre public
        conn.execute(text("SET search_path TO public"))
        
        for table in tenant_tables:
            try:
                # Comprobar si existe la tabla antes de intentar borrarla
                result = conn.execute(text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '{table}');"))
                exists = result.scalar()
                
                if exists:
                    print(f"Borrando tabla: public.{table}...")
                    conn.execute(text(f'DROP TABLE IF EXISTS public."{table}" CASCADE;'))
                    conn.commit()
                    print(f"✅ Tabla {table} eliminada.")
                else:
                    # print(f"ℹ️ Tabla {table} no existe en public.")
                    pass
            except Exception as e:
                print(f"❌ Error al procesar {table}: {e}")
        
        print("--- Limpieza completada ---")

if __name__ == "__main__":
    cleanup_production()
