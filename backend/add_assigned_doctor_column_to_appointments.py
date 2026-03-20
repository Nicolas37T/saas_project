from sqlmodel import Session, select, text
from app.db.session import engine, get_tenant_engine
from app.db.models import Tenant

def migrate():
    with Session(engine) as session:
        tenants = session.exec(select(Tenant)).all()
        for tenant in tenants:
            print(f"Migrating Appointments for tenant: {tenant.subdomain}")
            try:
                if tenant.strategy == "schema":
                    schema = tenant.subdomain
                    with engine.connect() as conn:
                        conn.execute(text(f'SET search_path TO "{schema}"'))
                        col_check = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_schema = '{schema}' AND table_name = 'appointments' AND column_name = 'assigned_doctor_id'")).fetchone()
                        if not col_check:
                            conn.execute(text("ALTER TABLE appointments ADD COLUMN assigned_doctor_id UUID REFERENCES users(id)"))
                            print(f"  [Schema] Added assigned_doctor_id to {schema}.appointments")
                        else:
                            print(f"  [Schema] Column assigned_doctor_id already exists in {schema}.appointments")
                        conn.commit()
                else:
                    t_engine = get_tenant_engine(tenant.db_name)
                    with t_engine.connect() as conn:
                        col_check = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'assigned_doctor_id'")).fetchone()
                        if not col_check:
                            conn.execute(text("ALTER TABLE appointments ADD COLUMN assigned_doctor_id UUID REFERENCES users(id)"))
                            print(f"  [Database] Added assigned_doctor_id to {tenant.db_name}.public.appointments")
                        else:
                            print(f"  [Database] Column assigned_doctor_id already exists in {tenant.db_name}.public.appointments")
                        conn.commit()
            except Exception as e:
                print(f"  Error on {tenant.subdomain}: {e}")

if __name__ == "__main__":
    migrate()
