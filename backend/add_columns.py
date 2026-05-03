import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users_global ADD COLUMN reset_requested BOOLEAN DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE users_global ADD COLUMN reset_approved BOOLEAN DEFAULT FALSE"))
        conn.commit()
        print("Columns added successfully")
except Exception as e:
    print("Error:", e)
