from app.db.session import engine
from sqlmodel import text

def check_users_global():
    with engine.connect() as conn:
        print("\nColumns in users_global:")
        result = conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users_global'
        """))
        for row in result:
            print(f"  - {row[0]} ({row[1]})")

if __name__ == "__main__":
    check_users_global()
