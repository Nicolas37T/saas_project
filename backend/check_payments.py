from app.db.session import engine
from sqlmodel import text

def check_payments():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT count(*) FROM dentalluis.payments"))
        count = result.fetchone()[0]
        print(f"Payment count for dentalluis: {count}")

if __name__ == "__main__":
    check_payments()
