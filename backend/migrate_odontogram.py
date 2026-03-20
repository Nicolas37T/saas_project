"""
Migration script: Restructure odontogram <-> treatments relationship.

Old model: Treatment (parent) -> Odontogram (child per tooth)
New model: Odontogram (parent per tooth per patient) -> Treatment (child per procedure)

Run from the backend directory:
  python migrate_odontogram.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

# The tenant schema to migrate - update this if you have multiple tenants
TENANT_SCHEMA = "adolfo"

engine = create_engine(settings.DATABASE_URL)

migration_sql = f"""
-- ========================================================
-- MIGRATION: Restructure odontogram <-> treatments
-- Schema: {TENANT_SCHEMA}
-- ========================================================

SET search_path TO "{TENANT_SCHEMA}", public;

-- Step 1: Truncate old data (development data only)
TRUNCATE TABLE "{TENANT_SCHEMA}".odontogram CASCADE;
TRUNCATE TABLE "{TENANT_SCHEMA}".treatments CASCADE;

-- Step 2: Modify odontogram table (now represents a tooth per patient)
ALTER TABLE "{TENANT_SCHEMA}".odontogram
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS duration_minutes,
  DROP COLUMN IF EXISTS treatment_date,
  DROP COLUMN IF EXISTS procedure_status,
  DROP COLUMN IF EXISTS treatment_id;

ALTER TABLE "{TENANT_SCHEMA}".odontogram
  ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES "{TENANT_SCHEMA}".patients(id);

-- Step 3: Modify treatments table (now represents a procedure per tooth)
ALTER TABLE "{TENANT_SCHEMA}".treatments
  DROP COLUMN IF EXISTS patient_id,
  DROP COLUMN IF EXISTS status_treatments,
  DROP COLUMN IF EXISTS date;

ALTER TABLE "{TENANT_SCHEMA}".treatments
  ADD COLUMN IF NOT EXISTS odontogram_id UUID REFERENCES "{TENANT_SCHEMA}".odontogram(id),
  ADD COLUMN IF NOT EXISTS treatment_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS procedure_status VARCHAR DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Step 4: Verify result
SELECT 
  'odontogram columns' as table_info,
  column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '{TENANT_SCHEMA}' AND table_name = 'odontogram'
UNION ALL
SELECT 
  'treatments columns' as table_info,
  column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '{TENANT_SCHEMA}' AND table_name = 'treatments'
ORDER BY table_info, column_name;
"""

def run_migration():
    print(f"🔄 Starting migration for schema: {TENANT_SCHEMA}")
    print("=" * 60)
    
    with engine.connect() as conn:
        # Execute each statement separately for better error handling
        statements = [s.strip() for s in migration_sql.split(';') if s.strip() and not s.strip().startswith('--') and not s.strip().startswith('/*')]
        
        # Execute non-SELECT statements first
        for stmt in statements:
            if stmt and not stmt.upper().startswith('SELECT'):
                try:
                    conn.execute(text(stmt))
                    print(f"✅ Executed: {stmt[:80].replace(chr(10), ' ')}...")
                except Exception as e:
                    if 'does not exist' in str(e).lower() or 'already exists' in str(e).lower():
                        print(f"⚠️  Skipped (already applied): {str(e)[:80]}")
                    else:
                        raise e
        
        conn.commit()
        print("\n✅ Migration committed successfully!")
        
        # Verify columns
        print("\n📋 Verifying new schema...")
        
        result = conn.execute(text(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = '{TENANT_SCHEMA}' AND table_name = 'odontogram'
            ORDER BY ordinal_position
        """))
        print(f"\n🦷 odontogram columns:")
        for row in result:
            print(f"   - {row[0]}: {row[1]}")
            
        result = conn.execute(text(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = '{TENANT_SCHEMA}' AND table_name = 'treatments'
            ORDER BY ordinal_position
        """))
        print(f"\n💊 treatments columns:")
        for row in result:
            print(f"   - {row[0]}: {row[1]}")
    
    print("\n🎉 Migration complete!")

if __name__ == "__main__":
    run_migration()
