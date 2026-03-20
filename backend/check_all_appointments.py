from app.db.session import engine
from sqlmodel import Session, select, text
from app.db.models import Tenant

def check_all_tenant_tables():
    with Session(engine) as session:
        tenants = session.exec(select(Tenant)).all()
        for tenant in tenants:
            schema = tenant.subdomain
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT count(*) FROM information_schema.tables WHERE table_schema = '{schema}' AND table_name = 'appointments'"))
                count = result.fetchone()[0]
                print(f"Tenant: {schema}, appointments table count: {count}")

if __name__ == "__main__":
    check_all_tenant_tables()
