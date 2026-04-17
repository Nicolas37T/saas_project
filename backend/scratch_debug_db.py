from sqlmodel import create_engine, text
from app.core.config import settings

def debug_db():
    print(f"Connecting to: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("--- Search Path ---")
        result = conn.execute(text("SHOW search_path")).fetchone()
        print(f"Current search_path: {result[0]}")
        
        print("\n--- Schemas ---")
        result = conn.execute(text("SELECT schema_name FROM information_schema.schemata")).fetchall()
        for row in result:
            print(f"Schema: {row[0]}")
            
        print("\n--- Current User ---")
        result = conn.execute(text("SELECT current_user")).fetchone()
        print(f"User: {result[0]}")

if __name__ == "__main__":
    debug_db()
