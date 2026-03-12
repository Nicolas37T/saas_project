import psycopg2
from app.core.config import settings
from sqlalchemy import text
from app.db.session import engine
from sqlmodel import Session, select
from app.db.models import Tenant

def fix_medical_history_constraints():
    """
    Drops the old foreign key constraint on medical_history.created_by 
    and points it to the tenant-specific users table.
    """
    print("--- Fixing Medical History Constraints for all Tenants ---")
    
    with Session(engine) as session:
        tenants = session.exec(select(Tenant)).all()
        
    for tenant in tenants:
        schema_name = tenant.subdomain
        print(f"Processing tenant: {schema_name}")
        
        try:
            with engine.connect() as conn:
                # 0. Check if tables exist
                try:
                    res_mh = conn.execute(text(f"SELECT 1 FROM information_schema.tables WHERE table_schema = '{schema_name}' AND table_name = 'medical_history'")).fetchone()
                    res_u = conn.execute(text(f"SELECT 1 FROM information_schema.tables WHERE table_schema = '{schema_name}' AND table_name = 'users'")).fetchone()
                    
                    if not res_mh or not res_u:
                        print(f"   ⚠️ Skipping {schema_name}: tables medical_history or users not found.")
                        continue
                except Exception as table_check_err:
                    print(f"   ⚠️ Error checking tables for {schema_name}: {table_check_err}")
                    continue

                # Set search path to tenant schema
                conn.execute(text(f'SET search_path TO "{schema_name}", public'))
                
                # 1. Check if constraint exists and drop it
                # We search for any constraint on medical_history that involves created_by
                conn.execute(text(f"""
                    DO $$ 
                    DECLARE
                        r RECORD;
                    BEGIN 
                        FOR r IN (
                            SELECT conname 
                            FROM pg_constraint c 
                            JOIN pg_class cl ON cl.oid = c.conrelid 
                            JOIN pg_namespace n ON n.oid = cl.relnamespace
                            WHERE n.nspname = '{schema_name}' 
                            AND cl.relname = 'medical_history'
                            AND c.conname LIKE 'medical_history_created_by%'
                        ) LOOP
                            EXECUTE 'ALTER TABLE "{schema_name}"."medical_history" DROP CONSTRAINT ' || quote_ident(r.conname);
                        END LOOP;
                    END $$;
                """))
                
                # 2. FIX DATA: Ensure all created_by in medical_history exist in users table
                # If they don't, set them to the first available user in the schema
                first_user_res = conn.execute(text(f'SELECT id FROM "{schema_name}"."users" LIMIT 1')).fetchone()
                if first_user_res:
                    first_user_id = first_user_res[0]
                    print(f"   - Fixing invalid created_by references to user {first_user_id}")
                    conn.execute(text(f"""
                        UPDATE "{schema_name}"."medical_history"
                        SET created_by = '{first_user_id}'
                        WHERE created_by NOT IN (SELECT id FROM "{schema_name}"."users")
                    """))
                else:
                    print(f"   ⚠️ Warning: No users found in {schema_name}.users. Cannot fix invalid references or create FK.")
                    continue

                # 3. Add the new constraint pointing to the tenant's users table
                print(f"   - Adding constraint medical_history_created_by_fkey -> {schema_name}.users(id)")
                conn.execute(text(f"""
                    ALTER TABLE "{schema_name}"."medical_history" 
                    ADD CONSTRAINT "medical_history_created_by_fkey" 
                    FOREIGN KEY (created_by) REFERENCES "{schema_name}"."users"(id);
                """))
                
                conn.commit()
                print(f"✅ Successfully updated constraints for {schema_name}")
                
        except Exception as e:
            print(f"❌ Error fixing constraints for {schema_name}: {e}")

if __name__ == "__main__":
    fix_medical_history_constraints()
