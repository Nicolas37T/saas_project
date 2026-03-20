from app.db.session import engine
from sqlmodel import text

def inspect_schema(schema_name):
    print(f"\n--- INSPECTING SCHEMA: {schema_name} ---")
    with engine.connect() as conn:
        # Check tables
        result = conn.execute(text(f"SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = '{schema_name}'"))
        tables = [row[0] for row in result]
        print(f"Tables: {tables}")
        
        for table in ['patients', 'treatments', 'payments']:
            if table in tables:
                print(f"\nColumns in {table}:")
                col_result = conn.execute(text(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = '{schema_name}' 
                    AND table_name = '{table}'
                """))
                for col in col_result:
                    print(f"  - {col[0]} ({col[1]})")
            else:
                print(f"\n❌ Table {table} NOT FOUND in {schema_name}")

if __name__ == "__main__":
    for schema in ['dentalluis', 'rosquetesgonza', 'pollosdonpedro']:
        inspect_schema(schema)
