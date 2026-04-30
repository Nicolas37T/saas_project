from sqlalchemy import text
from app.db.session import engine

def fix_database():
    print("Intentando agregar columna 'trial_days' a la tabla 'plans'...")
    try:
        with engine.connect() as conn:
            # SQL para agregar la columna si no existe
            conn.execute(text("ALTER TABLE plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 30;"))
            conn.commit()
            print("Columna 'trial_days' agregada exitosamente.")
    except Exception as e:
        print(f"Error al actualizar la base de datos: {e}")

if __name__ == "__main__":
    fix_database()
