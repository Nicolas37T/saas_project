import psycopg2
import sys

# INSTRUCCIONES:
# 1. Ve a Railway -> Servicio Postgres -> Variables
# 2. Copia la variable 'DATABASE_PUBLIC_URL' (o similar que empiece por postgresql://)
# 3. Ejecuta este script: python cleanup_tenant.py "TU_URL_AQUI"

if len(sys.argv) < 2:
    print("Uso: python cleanup_tenant.py <DATABASE_URL>")
    sys.exit(1)

db_url = sys.argv[1]
target_subdomain = "doñaluisa"

try:
    print(f"Conectando a la base de datos...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    print(f"Buscando tenant '{target_subdomain}'...")
    cur.execute("SELECT id FROM tenant WHERE subdomain = %s", (target_subdomain,))
    row = cur.fetchone()
    
    if not row:
        print(f"No se encontró el tenant '{target_subdomain}' en la tabla 'tenant'.")
    else:
        tenant_id = row[0]
        print(f"Tenant ID encontrado: {tenant_id}")

        # 1. Eliminar suscripciones
        print("Eliminando suscripciones...")
        cur.execute("DELETE FROM subscription WHERE tenant_id = %s", (tenant_id,))

        # 2. Eliminar usuarios globales vinculados
        print("Eliminando usuarios globales...")
        cur.execute("DELETE FROM userglobal WHERE tenant_id = %s", (tenant_id,))

        # 3. Eliminar el tenant
        print("Eliminando registro del tenant...")
        cur.execute("DELETE FROM tenant WHERE id = %s", (tenant_id,))

    # 4. Intentar borrar el esquema (aquí es donde fallaba Railway)
    print(f"Intentando borrar el SCHEMA '{target_subdomain}'...")
    try:
        cur.execute(f'DROP SCHEMA IF EXISTS "{target_subdomain}" CASCADE')
        print(f"✅ Schema '{target_subdomain}' eliminado (si existía).")
    except Exception as e:
        print(f"⚠️ No se pudo borrar el schema directamente: {e}")

    cur.close()
    conn.close()
    print("\n✅ LIMPIEZA COMPLETADA.")
    print("Ahora el panel de Railway debería volver a la normalidad.")

except Exception as e:
    print(f"❌ ERROR CRÍTICO: {e}")
