from app.db.session import engine
from sqlmodel import text

def list_tables(schema):
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{schema}'"))
        tables = [row[0] for row in result]
        print(f"Tables in schema '{schema}':")
        for table in tables:
            print(f"  - {table}")

if __name__ == "__main__":
    list_tables("dentalluis")
