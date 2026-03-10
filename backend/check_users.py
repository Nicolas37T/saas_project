from app.db.session import engine
from sqlmodel import Session, select, text

def check_users():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT email, tenant_subdomain FROM users_global"))
        for row in result:
            print(f"User: {row[0]}, Tenant: {row[1]}")

if __name__ == "__main__":
    check_users()
