from app.db.session import engine
from sqlmodel import Session, select, text

def check_tenants():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT business_name, subdomain, strategy, status FROM tenants"))
        for row in result:
            print(f"Business: {row[0]}, Subdomain: {row[1]}, Strategy: {row[2]}, Status: {row[3]}")

if __name__ == "__main__":
    check_tenants()
