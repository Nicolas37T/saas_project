from app.db.session import engine
from sqlmodel import Session, text

def test_tenant_access(schema):
    with Session(engine) as session:
        print(f"Setting search_path to {schema}")
        session.exec(text(f'SET search_path TO "{schema}"'))
        
        print("Executing query on appointments...")
        try:
            result = session.exec(text("SELECT count(*) FROM appointments")).first()
            print(f"Count: {result}")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_tenant_access("dentalluis")
