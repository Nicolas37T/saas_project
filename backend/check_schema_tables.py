from app.db.session import engine
from app.db.models import Tenant
from sqlmodel import Session, select, text

def check_schema_tables():
    """Verifica qué tablas existen en cada schema de tenant"""
    with Session(engine) as session:
        tenants = session.exec(select(Tenant)).all()
        
        for tenant in tenants:
            print(f"\n=== Tenant: {tenant.subdomain} (strategy: {tenant.strategy}) ===")
            
            if tenant.strategy == "schema":
                # Verificar tablas en el schema
                query = """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = %s 
                ORDER BY table_name
                """
                with engine.connect() as conn:
                    result = conn.execute(text(query), {"schema_name": tenant.subdomain})
                    tables = [row[0] for row in result]
                    
                if tables:
                    print(f"Tablas encontradas ({len(tables)}):")
                    for t in tables:
                        print(f"  - {t}")
                else:
                    print("❌ No hay tablas en este schema!")
                    
            elif tenant.strategy == "database":
                print(f"Base de datos dedicada: {tenant.db_name}")

if __name__ == "__main__":
    check_schema_tables()
