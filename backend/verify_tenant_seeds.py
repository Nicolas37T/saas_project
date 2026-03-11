"""
Verificar que los roles y usuario admin están en los schemas de los tenants.
"""
from sqlmodel import Session, select
from app.db.session import engine, get_tenant_engine
from app.db.models import Tenant
from app.db.tenant_models import Role, User
from sqlalchemy import text


def verify_tenant_seeds():
    print("=== Verificando Datos en Tenants ===\n")

    with Session(engine) as session:
        tenants = session.exec(select(Tenant)).all()

        for tenant in tenants:
            print(f"--- Tenant: {tenant.subdomain} ({tenant.strategy}) ---")

            if tenant.strategy == "database" and tenant.db_name:
                t_engine = get_tenant_engine(tenant.db_name)
            else:
                t_engine = engine

            with t_engine.connect() as conn:
                if tenant.strategy == "schema":
                    conn.execute(text(f'SET search_path TO "{tenant.subdomain}", public'))

                with Session(bind=conn) as t_session:
                    roles = t_session.exec(select(Role)).all()
                    users = t_session.exec(select(User)).all()

                    print(f"  🎭 Roles ({len(roles)}): {[r.name for r in roles]}")
                    for u in users:
                        role = t_session.exec(select(Role).where(Role.id == u.role_id)).first()
                        print(f"  👤 Usuario: {u.email} | Rol: {role.name if role else 'N/A'} | Status: {u.status}")

            print()


if __name__ == "__main__":
    verify_tenant_seeds()
