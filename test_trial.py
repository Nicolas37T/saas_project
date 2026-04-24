import sys
import os
from datetime import datetime, timedelta
import uuid

# Añadir el path del backend para poder importar los modelos
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.session import engine
from app.db.models import Tenant
from sqlmodel import Session, select

def test_trial_expiration():
    with Session(engine) as session:
        # 1. Buscar un tenant existente o el primero que encontremos
        tenant = session.exec(select(Tenant)).first()
        if not tenant:
            print("No se encontraron tenants para probar.")
            return

        print(f"Probando con tenant: {tenant.business_name} ({tenant.subdomain})")
        
        # 2. Guardar estado original
        original_status = tenant.status
        original_created_at = tenant.created_at
        
        try:
            # 3. Ponerlo en modo 'trialing' y con fecha de hace 10 días (expirado)
            tenant.status = "trialing"
            tenant.created_at = datetime.utcnow() - timedelta(days=10)
            session.add(tenant)
            session.commit()
            print(f"✅ Tenant configurado como TRIAL EXPIRADO (hace 10 días).")
            print(f"Estado: {tenant.status}, Creado: {tenant.created_at}")
            
            # Aquí el usuario debería intentar loguearse y fallar.
            
        except Exception as e:
            print(f"Error: {e}")
            session.rollback()

if __name__ == "__main__":
    test_trial_expiration()
