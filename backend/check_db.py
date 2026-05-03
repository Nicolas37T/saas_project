import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from sqlmodel import Session, select
from app.db.models import UserGlobal

try:
    with Session(engine) as session:
        user = session.exec(select(UserGlobal).where(UserGlobal.email == "center@saas.com")).first()
        print(f"User: {user.email}")
        print(f"Reset Requested: {user.reset_requested}")
        print(f"Reset Approved: {user.reset_approved}")
except Exception as e:
    print("Error:", e)
