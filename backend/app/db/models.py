from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
import uuid


# ─── ROLES ────────────────────────────────────────────────────────────────────

class UserRole(SQLModel, table=True):
    """
    Catálogo de roles de la plataforma.
    Ejemplos: 'superadmin', 'owner'
    """
    __tablename__ = "user_roles"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True)       # 'superadmin', 'owner'
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    users: List["UserGlobal"] = Relationship(back_populates="role")


# ─── PLANES ───────────────────────────────────────────────────────────────────

class Plan(SQLModel, table=True):
    __tablename__ = "plans"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True)
    description: Optional[str] = None
    price: float
    billing_cycle: str          # "monthly" | "yearly"
    max_users: int
    strategy: str = Field(default="schema") # "schema" | "database"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    tenants: List["Tenant"] = Relationship(back_populates="plan")
    subscriptions: List["Subscription"] = Relationship(back_populates="plan")


# ─── TENANTS ──────────────────────────────────────────────────────────────────

class Tenant(SQLModel, table=True):
    __tablename__ = "tenants"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    business_name: str
    business_type: str = Field(default="Otro")
    subdomain: str = Field(unique=True, index=True)
    custom_domain: Optional[str] = Field(default=None, unique=True)
    domain: Optional[str] = Field(default=None)
    status: str = Field(default="active")   # "active", "suspended", "past_due"
    strategy: str = Field(default="schema") # "schema" | "database"
    db_name: str
    db_host: str = Field(default="localhost")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Quién creó el tenant (dueño del negocio)
    created_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users_global.id")

    plan_id: uuid.UUID = Field(foreign_key="plans.id")
    plan: Plan = Relationship(back_populates="tenants")

    users: List["UserGlobal"] = Relationship(
        back_populates="tenant",
        sa_relationship_kwargs={"foreign_keys": "[UserGlobal.tenant_id]"}
    )
    subscriptions: List["Subscription"] = Relationship(back_populates="tenant")


# ─── USUARIOS GLOBALES ────────────────────────────────────────────────────────

class UserGlobal(SQLModel, table=True):
    __tablename__ = "users_global"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: Optional[str] = None
    password_hash: str
    is_verified: bool = Field(default=False)
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # FK al rol (reemplaza el campo rol_global string)
    role_id: uuid.UUID = Field(foreign_key="user_roles.id")
    role: UserRole = Relationship(back_populates="users")

    # FK al tenant (sólo si es tipo 'owner')
    tenant_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="tenants.id",
        sa_column_kwargs={"name": "tenant_id"}
    )
    tenant: Optional[Tenant] = Relationship(
        back_populates="users",
        sa_relationship_kwargs={"foreign_keys": "[UserGlobal.tenant_id]"}
    )


# ─── SUSCRIPCIONES ────────────────────────────────────────────────────────────

class Subscription(SQLModel, table=True):
    __tablename__ = "subscriptions"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    external_id: Optional[str] = None          # Stripe subscription ID en producción
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    status: str = Field(default="active")       # "active", "trialing", "canceled"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    tenant_id: uuid.UUID = Field(foreign_key="tenants.id")
    plan_id: uuid.UUID = Field(foreign_key="plans.id")

    tenant: Tenant = Relationship(back_populates="subscriptions")
    plan: Plan = Relationship(back_populates="subscriptions")
