import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from app.core.config import settings

def create_tenant_db(db_name: str) -> bool:
    """
    Crea una base de datos física en PostgreSQL para el nuevo tenant.
    NOTA: En entornos de nube (como Railway/Render), esto puede fallar si el 
    usuario de la base de datos no tiene permisos de 'CREATEDB'.
    Se recomienda usar la estrategia de 'schema' para máxima compatibilidad.
    """
    print(f"--- Intentando aprovisionar DB física: {db_name} ---")
    base_url = settings.DATABASE_URL.rsplit('/', 1)[0] + '/postgres'

    conn = None
    try:
        conn = psycopg2.connect(base_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute(f'CREATE DATABASE "{db_name}"')
        cur.close()
        print(f"✅ DB '{db_name}' creada con éxito.")
        return True
    except psycopg2.errors.DuplicateDatabase:
        print(f"ℹ️ DB '{db_name}' ya existía.")
        return True
    except psycopg2.errors.InsufficientPrivilege:
        print(f"⚠️ Error: Permisos insuficientes para crear bases de datos físicas.")
        return False
    except Exception as e:
        print(f"❌ Error inesperado al crear DB: {e}")
        return False
    finally:
        if conn:
            conn.close()


def create_tenant_schema(schema_name: str) -> bool:
    """
    Crea un esquema (schema) dentro de la base de datos maestra para el tenant.
    """
    print(f"--- Aprovisionando SCHEMA: {schema_name} ---")
    
    conn = None
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"')
        cur.close()
        
        from sqlmodel import SQLModel
        from app.db.session import engine
        from sqlalchemy import text
        from app.db.tenant_models import Role, User, Setting, Patient, Treatment, MedicalHistory, Appointment, Payment, Odontogram, PatientShare
        
        with engine.connect() as sqla_conn:
            sqla_conn.execute(text(f'SET search_path TO "{schema_name}", public'))
            
            tenant_models = [Role, User, Setting, Patient, Treatment, MedicalHistory, Appointment, Payment, Odontogram, PatientShare]
            tenant_tables = [m.__table__ for m in tenant_models]
            
            for table in tenant_tables:
                table.schema = schema_name
                
            SQLModel.metadata.create_all(sqla_conn, tables=tenant_tables)
            
            for table in tenant_tables:
                table.schema = None
                
            sqla_conn.commit()

        print(f"✅ Schema '{schema_name}' creado con tablas inicializadas")
        return True
    except Exception as e:
        print(f"❌ Error al crear Schema: {e}")
        return False
    finally:
        if conn:
            conn.close()


def seed_tenant_defaults(
    schema_name: str,
    owner_email: str,
    owner_password_hash: str,
    owner_full_name: str,
    strategy: str = "schema",
    db_name: str = None,
) -> bool:
    """
    Siembra los datos iniciales en el schema/BD del tenant recién creado:
      1. Roles base: admin, doctor, recepcionista
      2. Usuario dueño copiado como 'admin' del tenant

    Args:
        schema_name:         Subdominio / nombre de esquema del tenant
        owner_email:         Email del usuario registrado
        owner_password_hash: Hash ya generado (no texto plano)
        owner_full_name:     Nombre completo
        strategy:            'schema' o 'database'
        db_name:             Solo necesario si strategy='database'
    """
    print(f"--- Sembrando datos iniciales para tenant: {schema_name} ---")
    try:
        from sqlmodel import Session, select
        from app.db.session import engine, get_tenant_engine
        from app.db.tenant_models import Role, User
        from sqlalchemy import text
        import uuid

        # Motor correcto según estrategia
        if strategy == "database" and db_name:
            tenant_engine = get_tenant_engine(db_name)
        else:
            tenant_engine = engine

        with tenant_engine.connect() as conn:
            # Establecer search_path para estrategia de esquema
            if strategy == "schema":
                conn.execute(text(f'SET search_path TO "{schema_name}", public'))
                conn.commit()

            with Session(bind=conn) as session:
                # ── 1. Crear roles base ──────────────────────────────────────────
                default_roles = ["admin", "doctor", "recepcionista"]
                role_objects = {}

                for role_name in default_roles:
                    existing = session.exec(select(Role).where(Role.name == role_name)).first()
                    if not existing:
                        new_role = Role(name=role_name)
                        session.add(new_role)
                        session.flush()
                        role_objects[role_name] = new_role
                        print(f"  ✅ Rol '{role_name}' creado.")
                    else:
                        role_objects[role_name] = existing
                        print(f"  ℹ️ Rol '{role_name}' ya existía.")

                session.commit()

                # Re-fetch tras commit para evitar DetachedInstance
                for role_name in default_roles:
                    role_objects[role_name] = session.exec(
                        select(Role).where(Role.name == role_name)
                    ).first()

                # ── 2. Crear usuario admin del tenant ────────────────────────────
                admin_role = role_objects.get("admin")
                if not admin_role:
                    print("  ❌ No se pudo obtener el rol 'admin'")
                    return False

                existing_user = session.exec(
                    select(User).where(User.email == owner_email)
                ).first()

                if not existing_user:
                    username = owner_email.split("@")[0]
                    # Garantizar username único
                    if session.exec(select(User).where(User.username == username)).first():
                        username = f"{username}_{uuid.uuid4().hex[:6]}"

                    tenant_admin = User(
                        username=username,
                        email=owner_email,
                        password_hash=owner_password_hash,
                        full_name=owner_full_name,
                        status=True,
                        role_id=admin_role.id,
                    )
                    session.add(tenant_admin)
                    session.commit()
                    print(f"  ✅ Admin '{owner_email}' creado en el tenant.")
                else:
                    # Si ya existe pero sin rol admin, actualizarlo
                    if existing_user.role_id != admin_role.id:
                        existing_user.role_id = admin_role.id
                        session.add(existing_user)
                        session.commit()
                    print(f"  ℹ️ Usuario '{owner_email}' ya existía en el tenant.")

                # ── 3. Crear Setting inicial ───────────────────────────────────────
                from app.db.tenant_models import Setting
                existing_setting = session.exec(select(Setting)).first()
                if not existing_setting:
                    new_setting = Setting(
                        business_name=owner_full_name,
                        currency="Bs.",
                        created_by=existing_user.id if existing_user else tenant_admin.id
                    )
                    session.add(new_setting)
                    session.commit()
                    print(f"  ✅ Setting inicial creado para '{owner_full_name}'.")
                else:
                    print(f"  ℹ️ Setting inicial ya existía en el tenant.")

        print(f"✅ Seed completado para tenant: {schema_name}")
        return True

    except Exception as e:
        import traceback
        print(f"❌ Error en seed_tenant_defaults: {e}")
        traceback.print_exc()
        return False
