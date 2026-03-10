from app.db.session import engine, get_session_for_tenant
from sqlmodel import Session, text, SQLModel
from app.db.tenant_models import Appointment
import uuid
from datetime import datetime
from unittest.mock import MagicMock

def test_new_session_logic(subdomain):
    # Mocking Request for Depends
    from fastapi import Request
    mock_request = MagicMock(spec=Request)
    
    # Mocking tenant object
    class MockTenant:
        def __init__(self, sub, strat):
            self.subdomain = sub
            self.strategy = strat
    
    mock_request.state.tenant = MockTenant(subdomain, "schema")
    
    # Use generator
    gen = get_session_for_tenant(mock_request)
    session = next(gen)
    
    # Find a patient_id
    with engine.connect() as conn:
        res = conn.execute(text(f"SELECT id FROM {subdomain}.patients LIMIT 1"))
        patient_id = res.fetchone()[0]

    print(f"Testing for {subdomain} with patient_id {patient_id}")
    
    try:
        apt = Appointment(
            appointment_date=datetime.now(),
            notes="Final test",
            patient_id=patient_id
        )
        session.add(apt)
        session.commit()
        print("Commit worked.")
        session.refresh(apt)
        print("Refresh worked. ID:", apt.id)
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        try:
            next(gen)
        except StopIteration:
            pass

if __name__ == "__main__":
    test_new_session_logic("dentalluis")
