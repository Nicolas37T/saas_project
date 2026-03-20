"""
Script de backfill: siembra roles y usuario admin en tenants ya existentes.
Ejecutar UNA sola vez para migrar tenants creados antes del cambio.
"""
from sqlmodel import Session, select
from app.db.session import engine
from app.db.models import Tenant, UserGlobal
from app.utils.provisioning import seed_tenant_defaults


def backfill_existing_tenants():
    print("=== Backfill: Sembrando roles y admin en tenants existentes ===\n")

    with Session(engine) as session:
        tenants = session.exec(select(Tenant)).all()
        print(f"Tenants encontrados: {len(tenants)}\n")

        for tenant in tenants:
            print(f"--- Procesando: {tenant.subdomain} (strategy={tenant.strategy}) ---")

            # Buscar el usuario dueño de este tenant
            owner = session.exec(
                select(UserGlobal).where(UserGlobal.tenant_id == tenant.id)
            ).first()

            if not owner:
                print(f"  ⚠️ No se encontró usuario dueño para {tenant.subdomain}. Saltando.\n")
                continue

            print(f"  👤 Dueño: {owner.email}")

            result = seed_tenant_defaults(
                schema_name=tenant.subdomain,
                owner_email=owner.email,
                owner_password_hash=owner.password_hash,
                owner_full_name=owner.full_name or tenant.business_name,
                strategy=tenant.strategy or "schema",
                db_name=tenant.db_name,
            )

            if result:
                print(f"  ✅ Backfill exitoso para {tenant.subdomain}\n")
            else:
                print(f"  ❌ Backfill falló para {tenant.subdomain}\n")

    print("=== Backfill completado ===")


if __name__ == "__main__":
    backfill_existing_tenants()
