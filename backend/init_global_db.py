from sqlmodel import SQLModel, Session, select
from app.db.session import engine
from app.db.models import UserRole, Plan, Tenant, UserGlobal, Subscription
from app.core.security import get_password_hash

def init_db():
    print("--- Initializing Global Tables ---")
    global_models = [UserRole, Plan, Tenant, UserGlobal, Subscription]
    global_tables = [m.__table__ for m in global_models]
    
    # Create tables
    SQLModel.metadata.create_all(engine, tables=global_tables)
    print("✅ Tables created in 'public' schema.")

    with Session(engine) as session:
        # 1. Seed Roles
        for role_name, desc in [
            ("superadmin", "Administrador de la plataforma SaaS"),
            ("owner",      "Dueño de un negocio (tenant)"),
        ]:
            if not session.exec(select(UserRole).where(UserRole.name == role_name)).first():
                session.add(UserRole(name=role_name, description=desc))
        
        # 2. Seed Plans
        for plan_name, price, max_u, strategy in [
            ("Plan Básico", 10.0, 5,  "schema"),
            ("Plan Pro",    30.0, 20, "schema"),
            ("Plan Enterprise", 50.0, 100, "schema"),
        ]:
            if not session.exec(select(Plan).where(Plan.name == plan_name)).first():
                session.add(Plan(name=plan_name, price=price, billing_cycle="monthly", max_users=max_u, strategy=strategy))
        
        session.commit()

        # 3. Seed Superadmin
        if not session.exec(select(UserGlobal).where(UserGlobal.email == "admin@saas.com")).first():
            superadmin_role = session.exec(select(UserRole).where(UserRole.name == "superadmin")).first()
            session.add(UserGlobal(
                email="admin@saas.com",
                full_name="Super Administrador",
                password_hash=get_password_hash("admin1234"),
                is_verified=True,
                role_id=superadmin_role.id,
            ))
            session.commit()
            print("✅ Superadmin seed completed.")

if __name__ == "__main__":
    init_db()
