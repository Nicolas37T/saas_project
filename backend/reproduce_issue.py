from app.db.session import engine
from sqlmodel import Session, text
from app.db.tenant_models import Appointment
import uuid
from datetime import datetime

def test_reproduction(schema):
    with Session(engine) as session:
        print(f"Setting search_path to {schema}")
        session.exec(text(f'SET search_path TO "{schema}"'))
        
        print("Creating dummy appointment...")
        apt = Appointment(
            appointment_date=datetime.now(),
            notes="Test",
            patient_id=uuid.uuid4() # Random UUID just to see if it even reaches the insert
        )
        
        try:
            session.add(apt)
            print("Committing...")
            session.commit()
            print("Refreshing...")
            session.refresh(apt)
            print("Success!")
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    # We need a real patient_id if there is a FK constraint.
    # Let's find a patient in dentalluis.
    with engine.connect() as conn:
        res = conn.execute(text("SELECT id FROM dentalluis.patients LIMIT 1"))
        patient_id = res.fetchone()
        if patient_id:
            patient_id = patient_id[0]
            print(f"Using patient_id: {patient_id}")
            
            with Session(engine) as session:
                session.exec(text('SET search_path TO "dentalluis"'))
                apt = Appointment(
                    appointment_date=datetime.now(),
                    notes="Test reproduction",
                    patient_id=patient_id
                )
                session.add(apt)
                session.commit()
                print("Commit worked.")
                session.refresh(apt)
                print("Refresh worked.")
        else:
            print("No patient found in dentalluis.")
