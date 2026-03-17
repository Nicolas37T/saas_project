import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def verify_db():
    database_url = os.getenv("DATABASE_URL")
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        # Check tables in public schema
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cur.fetchall()
        print(f"Tables in 'public' schema: {[t[0] for t in tables]}")
        
        # Check for other schemas (excluding system schemas)
        cur.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'pg_toast')
        """)
        schemas = cur.fetchall()
        print(f"Custom schemas: {[s[0] for s in schemas]}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    verify_db()
