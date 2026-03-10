from app.db.session import engine
from sqlmodel import text

def list_public_tables():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result]
        print("Tables in public schema:")
        for table in tables:
            print(f"  - {table}")

if __name__ == "__main__":
    list_public_tables()
