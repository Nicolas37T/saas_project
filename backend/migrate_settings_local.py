import psycopg2
from app.core.config import settings

def run():
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    # Obtener todos los esquemas de tenants registrados
    cur.execute("SELECT subdomain FROM public.tenants")
    schemas = [r[0] for r in cur.fetchall()]
    
    # También incluimos algunos nombres de carpetas comunes si fallara lo anterior
    if not schemas:
        schemas = ['dentalnico', 'rosquetesgonza', 'pollosdonpedro', 'dentalluis']

    for schema in schemas:
        try:
            print(f"Modificando {schema}...")
            # Asegurar que la tabla existe (por si acaso no se creó en provisioning)
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS "{schema}".settings (
                    id UUID PRIMARY KEY,
                    business_name VARCHAR NOT NULL,
                    logo_url VARCHAR,
                    phone VARCHAR,
                    cellphone VARCHAR,
                    address VARCHAR,
                    currency VARCHAR DEFAULT 'Bs.',
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    created_by UUID
                )
            """)
            
            # Agregar columnas (por si la tabla existía pero era antigua)
            cur.execute(f'ALTER TABLE "{schema}".settings ADD COLUMN IF NOT EXISTS phone VARCHAR')
            cur.execute(f'ALTER TABLE "{schema}".settings ADD COLUMN IF NOT EXISTS cellphone VARCHAR')
            cur.execute(f'ALTER TABLE "{schema}".settings ADD COLUMN IF NOT EXISTS address VARCHAR')
            cur.execute(f'ALTER TABLE "{schema}".settings ADD COLUMN IF NOT EXISTS currency VARCHAR DEFAULT \'Bs.\'')
            
            # Insertar un registro inicial si está vacío
            cur.execute(f'SELECT COUNT(*) FROM "{schema}".settings')
            if cur.fetchone()[0] == 0:
                import uuid
                from datetime import datetime
                new_id = str(uuid.uuid4())
                cur.execute(f'INSERT INTO "{schema}".settings (id, business_name, currency, created_at, updated_at) VALUES (\'{new_id}\', \'{schema}\', \'Bs.\', \'{datetime.utcnow()}\', \'{datetime.utcnow()}\')')
                print(f"  ✅ Registro inicial creado para {schema}")

            print(f'✅ Actualizado {schema}.settings')
        except Exception as e:
            print(f'❌ Error en {schema}: {e}')

if __name__ == "__main__":
    run()
