from app.db.session import engine, get_tenant_engine
from sqlmodel import Session, select, text
from app.db.models import Tenant

def verify_all():
    with Session(engine) as session:
        tenants = session.exec(select(Tenant)).all()
        for tenant in tenants:
            if tenant.strategy == "schema":
                with engine.connect() as conn:
                    res = conn.execute(text(f"SELECT count(*) FROM information_schema.tables WHERE table_schema = '{tenant.subdomain}'"))
                    print(f"Tenant {tenant.subdomain} (schema): {res.fetchone()[0]} tables.")
            else:
                try:
                    t_engine = get_tenant_engine(tenant.db_name)
                    with t_engine.connect() as conn:
                        res = conn.execute(text("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"))
                        print(f"Tenant {tenant.subdomain} (database {tenant.db_name}): {res.fetchone()[0]} tables.")
                except Exception as e:
                    print(f"Tenant {tenant.subdomain} (database {tenant.db_name}): ❌ Error: {e}")

if __name__ == "__main__":
    verify_all()
