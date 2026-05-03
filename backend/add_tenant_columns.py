import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from sqlmodel import Session, select
from sqlalchemy import text
from app.db.models import Tenant

try:
    with engine.connect() as conn:
        with Session(conn) as session:
            tenants = session.exec(select(Tenant)).all()
            for t in tenants:
                print(f"Updating tenant {t.subdomain} with strategy {t.strategy}")
                if t.strategy == "schema":
                    conn.execute(text(f'SET search_path TO "{t.subdomain}", public'))
                    try:
                        conn.execute(text("ALTER TABLE users ADD COLUMN reset_requested BOOLEAN DEFAULT FALSE"))
                        conn.execute(text("ALTER TABLE users ADD COLUMN reset_approved BOOLEAN DEFAULT FALSE"))
                        print(f"  Added columns to {t.subdomain}")
                    except Exception as e:
                        print(f"  Warning on {t.subdomain}: {e}")
                elif t.strategy == "database":
                    from app.db.session import get_tenant_engine
                    tenant_eng = get_tenant_engine(t.db_name)
                    with tenant_eng.connect() as t_conn:
                        try:
                            t_conn.execute(text("ALTER TABLE users ADD COLUMN reset_requested BOOLEAN DEFAULT FALSE"))
                            t_conn.execute(text("ALTER TABLE users ADD COLUMN reset_approved BOOLEAN DEFAULT FALSE"))
                            print(f"  Added columns to {t.db_name}")
                        except Exception as e:
                            print(f"  Warning on {t.db_name}: {e}")
                        t_conn.commit()
            conn.commit()
    print("Done updating tenant databases.")
except Exception as e:
    print("Error:", e)
