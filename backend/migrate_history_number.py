"""
Migration script: Add history_number column to medical_history table.

This adds an auto-incrementing integer identifier to each medical history,
and backfills existing records with sequential numbers based on created_at.

Run from the backend directory:
  python migrate_history_number.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

def get_tenant_schemas():
    """Discover all tenant schemas (non-system schemas)."""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT schema_name FROM information_schema.schemata
            WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
            AND schema_name NOT LIKE 'pg_%'
        """))
        return [row[0] for row in result]

def migrate_schema(schema_name: str):
    """Add history_number column and backfill existing records for a single tenant schema."""
    print(f"\n🔄 Migrating schema: {schema_name}")
    
    with engine.connect() as conn:
        # Check if medical_history table exists in this schema
        result = conn.execute(text(f"""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = '{schema_name}' AND table_name = 'medical_history'
            )
        """))
        if not result.scalar():
            print(f"   ⚠️  No medical_history table found, skipping.")
            return

        # Step 1: Add the column if it doesn't exist
        try:
            conn.execute(text(f"""
                ALTER TABLE "{schema_name}".medical_history
                ADD COLUMN IF NOT EXISTS history_number INTEGER
            """))
            print(f"   ✅ Column history_number added (or already exists)")
        except Exception as e:
            print(f"   ⚠️  Column add skipped: {str(e)[:80]}")

        # Step 2: Backfill existing records with sequential numbers based on created_at
        result = conn.execute(text(f"""
            SELECT id FROM "{schema_name}".medical_history 
            WHERE history_number IS NULL 
            ORDER BY created_at ASC
        """))
        rows = result.fetchall()
        
        if rows:
            # Get current max number
            max_result = conn.execute(text(f"""
                SELECT COALESCE(MAX(history_number), 0) FROM "{schema_name}".medical_history
            """))
            current_max = max_result.scalar() or 0
            
            for i, row in enumerate(rows, start=current_max + 1):
                conn.execute(text(f"""
                    UPDATE "{schema_name}".medical_history 
                    SET history_number = {i} 
                    WHERE id = '{row[0]}'
                """))
            print(f"   ✅ Backfilled {len(rows)} existing records (#{current_max + 1} to #{current_max + len(rows)})")
        else:
            print(f"   ℹ️  No records to backfill")

        # Step 3: Create index
        try:
            conn.execute(text(f"""
                CREATE INDEX IF NOT EXISTS ix_medical_history_history_number 
                ON "{schema_name}".medical_history (history_number)
            """))
            print(f"   ✅ Index created")
        except Exception as e:
            print(f"   ⚠️  Index creation skipped: {str(e)[:80]}")

        conn.commit()
        print(f"   🎉 Schema {schema_name} migrated successfully!")


def run_migration():
    print("=" * 60)
    print("🏥 Migration: Add history_number to medical_history")
    print("=" * 60)
    
    schemas = get_tenant_schemas()
    print(f"\n📋 Found {len(schemas)} tenant schema(s): {', '.join(schemas)}")
    
    for schema in schemas:
        migrate_schema(schema)
    
    print("\n" + "=" * 60)
    print("🎉 All migrations complete!")
    print("=" * 60)


if __name__ == "__main__":
    run_migration()
