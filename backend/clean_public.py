import asyncio
import os
import sys

# Agregamos el directorio actual al path para importar módulos locales de la app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, text
from app.db.session import engine

def clean_public_schema():
    print("--- Limpiando schema public de tablas de tenant accidentales ---")
    
    tenant_table_names = [
        "role", "user", "setting", "patient", "treatment", 
        "medicalhistory", "appointment", "payment", "odontogram"
    ]
    
    with Session(engine) as session:
        # Asegurarnos de que estamos en public
        session.exec(text("SET search_path TO public"))
        
        for table in tenant_table_names:
            try:
                # Usamos CASCADE por si hay dependencias
                session.exec(text(f"DROP TABLE IF EXISTS public.{table} CASCADE"))
                print(f"Dropped table public.{table}")
            except Exception as e:
                print(f"Error dropping {table}: {e}")
        
        session.commit()
    print("Limpieza completada.")

if __name__ == "__main__":
    clean_public_schema()
