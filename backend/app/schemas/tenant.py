from pydantic import BaseModel, EmailStr
from typing import Optional

class TenantCreate(BaseModel):
    business_name: str
    subdomain: str
    domain: Optional[str] = None
    business_type: str
    plan_id: str
    email: EmailStr
    password: str
