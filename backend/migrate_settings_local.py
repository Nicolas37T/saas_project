import psycopg2
from app.core.config import settings

def run():
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    schemas = ['dentalnico', 'rosquetesgonza', 'pollosdonpedro', 'dentalluis']
    for schema in schemas:
        try:
            print(f"Modificando {schema}...")
            cur.execute(f'ALTER TABLE "{schema}".settings ADD COLUMN IF NOT EXISTS phone VARCHAR')
            cur.execute(f'ALTER TABLE "{schema}".settings ADD COLUMN IF NOT EXISTS cellphone VARCHAR')
            cur.execute(f'ALTER TABLE "{schema}".settings ADD COLUMN IF NOT EXISTS address VARCHAR')
            cur.execute(f'ALTER TABLE "{schema}".settings ADD COLUMN IF NOT EXISTS currency VARCHAR DEFAULT \'Bs.\'')
            print(f'Actualizado {schema}.settings')
        except Exception as e:
            print(f'Error en {schema}: {e}')

if __name__ == "__main__":
    run()
