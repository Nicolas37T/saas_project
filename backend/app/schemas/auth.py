from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    subdomain: Optional[str] = None
    role: str
    is_employee: Optional[bool] = False
    tenant_status: Optional[str] = None
    user_id: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    tenant_subdomain: Optional[str] = None  # Si es empleado, necesita el subdomain

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
