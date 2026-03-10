from app.db.session import engine
from app.db.models import Tenant
from app.db.tenant_models import Role, User, Setting, Patient, Treatment, MedicalHistory, Appointment, Payment, Odontogram
from sqlmodel import Session, select, SQLModel, text
import sqlalchemy

def initialize_all_tenants():
    with Session(engine) as session:
        tenants = session.exec(select(Tenant)).all()
        print(f"Found {len(tenants)} tenants in master DB.")
        
        for tenant in tenants:
            if tenant.strategy == "schema":
                print(f"Checking schema for tenant: {tenant.subdomain}")
                # Ensure schema exists
                with engine.connect() as conn:
                    conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{tenant.subdomain}"'))
                    conn.commit()
                
                # Initialize tables
                print(f"Initializing tables in schema: {tenant.subdomain}")
                try:
                    tenant_models = [Role, User, Setting, Patient, Treatment, MedicalHistory, Appointment, Payment, Odontogram]
                    tenant_tables = [m.__table__ for m in tenant_models]
                    
                    for table in tenant_tables:
                        table.schema = tenant.subdomain
                    
                    # Use a separate connection to avoid search_path issues
                    with engine.connect() as conn:
                        SQLModel.metadata.create_all(conn, tables=tenant_tables)
                        conn.commit()
                        
                    # Reset schema attribute
                    for table in tenant_tables:
                        table.schema = None
                    
                    print(f"✅ Tables initialized for schema {tenant.subdomain}")
                except Exception as e:
                    print(f"❌ Error initializing schema {tenant.subdomain}: {e}")
            
            elif tenant.strategy == "database":
                print(f"Initializing dedicated database for tenant: {tenant.subdomain} ({tenant.db_name})")
                from app.db.session import get_tenant_engine
                try:
                    t_engine = get_tenant_engine(tenant.db_name)
                    # For database strategy, tables are in default schema (usually public) of that DB
                    SQLModel.metadata.create_all(t_engine)
                    print(f"✅ Tables initialized for database {tenant.db_name}")
                except Exception as e:
                    print(f"❌ Error initializing database {tenant.db_name}: {e}")
            else:
                print(f"Unknown strategy {tenant.strategy} for {tenant.subdomain}")

if __name__ == "__main__":
    initialize_all_tenants()
