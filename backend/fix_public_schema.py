from sqlmodel import create_engine, text
from app.core.config import settings

def fix_db():
    print(f"Connecting to: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Creating 'public' schema...")
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS public;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        conn.commit()
        print("✅ Schema 'public' created and permissions granted.")

if __name__ == "__main__":
    fix_db()
