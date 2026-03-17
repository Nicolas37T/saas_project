"""
Migration step 2: Drop old columns that were skipped.
Run from the backend directory:
  python migrate_drop_columns.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

TENANT_SCHEMA = "adolfo"
engine = create_engine(settings.DATABASE_URL)

# Each column drop as separate statement
odontogram_drops = [
    f'ALTER TABLE "{TENANT_SCHEMA}".odontogram DROP COLUMN IF EXISTS price',
    f'ALTER TABLE "{TENANT_SCHEMA}".odontogram DROP COLUMN IF EXISTS description',
    f'ALTER TABLE "{TENANT_SCHEMA}".odontogram DROP COLUMN IF EXISTS duration_minutes',
    f'ALTER TABLE "{TENANT_SCHEMA}".odontogram DROP COLUMN IF EXISTS treatment_date',
    f'ALTER TABLE "{TENANT_SCHEMA}".odontogram DROP COLUMN IF EXISTS procedure_status',
    f'ALTER TABLE "{TENANT_SCHEMA}".odontogram DROP COLUMN IF EXISTS treatment_id',
]

treatments_drops = [
    f'ALTER TABLE "{TENANT_SCHEMA}".treatments DROP COLUMN IF EXISTS patient_id',
    f'ALTER TABLE "{TENANT_SCHEMA}".treatments DROP COLUMN IF EXISTS status_treatments',
    f'ALTER TABLE "{TENANT_SCHEMA}".treatments DROP COLUMN IF EXISTS date',
    f'ALTER TABLE "{TENANT_SCHEMA}".treatments DROP COLUMN IF EXISTS duration_minutes',
]

def run():
    print(f"🔄 Dropping old columns from schema: {TENANT_SCHEMA}")
    
    with engine.connect() as conn:
        all_stmts = odontogram_drops + treatments_drops
        for stmt in all_stmts:
            try:
                conn.execute(text(stmt))
                print(f"✅ {stmt}")
            except Exception as e:
                print(f"⚠️  Skipped: {str(e)[:100]}")
        
        conn.commit()
        print("\n✅ Drops committed!")
        
        # Verify final columns
        for tbl in ['odontogram', 'treatments']:
            result = conn.execute(text(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = '{TENANT_SCHEMA}' AND table_name = '{tbl}'
                ORDER BY ordinal_position
            """))
            print(f"\n📋 {tbl} columns:")
            for row in result:
                print(f"   - {row[0]}: {row[1]}")

    print("\n🎉 Done!")

if __name__ == "__main__":
    run()
