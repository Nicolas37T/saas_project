import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

load_dotenv()

def reset_database():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL no encontrada en el .env")
        return

    # Extraer credenciales y host del URL
    # postgresql://postgres:password@localhost:5432/saas_master
    try:
        parts = database_url.split("://")[1].split("@")
        user_pass = parts[0].split(":")
        host_port_db = parts[1].split("/")
        
        user = user_pass[0]
        password = user_pass[1]
        host_port = host_port_db[0].split(":")
        host = host_port[0]
        port = host_port[1] if len(host_port) > 1 else "5432"
        db_name = host_port_db[1]
    except Exception as e:
        print(f"❌ Error al parsear DATABASE_URL: {e}")
        return

    print(f"--- Iniciando reseteo total de la base de datos: {db_name} ---")

    # Conectar a la base de datos 'postgres' para poder borrar saas_master
    conn = None
    try:
        conn = psycopg2.connect(
            user=user,
            password=password,
            host=host,
            port=port,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # 1. Terminar conexiones activas
        print(f"Desconectando usuarios de {db_name}...")
        cur.execute(f"""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{db_name}'
              AND pid <> pg_backend_pid();
        """)

        # 2. Borrar base de datos
        print(f"Borrando base de datos {db_name}...")
        cur.execute(f"DROP DATABASE IF EXISTS {db_name}")
        print(f"✅ Base de datos {db_name} eliminada.")

        # 3. Crear base de datos
        print(f"Creando base de datos {db_name}...")
        cur.execute(f"CREATE DATABASE {db_name}")
        print(f"✅ Base de datos {db_name} creada con éxito.")

        cur.close()
    except Exception as e:
        print(f"❌ Error durante el proceso: {e}")
    finally:
        if conn:
            conn.close()

    print("\n🚀 PROCESO COMPLETADO.")
    print("Por favor, inicia el backend (uvicorn) para que SQLModel inicialice las tablas automáticamente.")

if __name__ == "__main__":
    reset_database()
