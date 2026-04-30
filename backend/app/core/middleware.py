from fastapi import Request, HTTPException
from app.db.session import Session, engine
from app.db.models import Tenant, Subscription
from sqlmodel import select
from datetime import datetime

async def tenant_middleware(request: Request, call_next):
    # 0. Ignorar peticiones OPTIONS (CORS preflight)
    if request.method == "OPTIONS":
        return await call_next(request)

    # 0.5 Rutas globales que NO necesitan resolución de tenant
    GLOBAL_PATHS = ["/admin/", "/auth/", "/register", "/plans", "/docs", "/openapi.json"]
    path = request.url.path
    if any(path.startswith(gp) for gp in GLOBAL_PATHS):
        request.state.tenant = None
        response = await call_next(request)
        return response

    # 1. Obtener el host sin el puerto (ej: negocio1.localhost:8000 -> negocio1.localhost)
    host = request.headers.get("host", "").split(":")[0]
    
    # 2. Determinar el subdominio
    subdomain = None
    if "." in host:
        parts = host.split(".")
        # Si es una IP (ej: 127.0.0.1), no hay subdominio
        if all(part.isdigit() for part in parts):
            subdomain = None
        # Si es el dominio de Railway, no hay subdominio de tenant
        elif "up.railway.app" in host:
            subdomain = None
        # Si es algo.localhost (común en desarrollo local)
        elif parts[-1] == "localhost":
            if len(parts) > 1:
                subdomain = parts[0]
            else:
                subdomain = None
        else:
            subdomain = parts[0]
    
    # Opción B: Usar un header para pruebas (X-Tenant) tiene prioridad
    tenant_header = request.headers.get("X-Tenant")
    if tenant_header:
        subdomain = tenant_header
    
    # Lista de subdominios que NO son tenants (rutas globales)
    RESERVED_SUBDOMAINS = [None, "", "www", "localhost", "admin", "api"]

    # Si no hay subdominio o es una ruta reservada, es contexto GLOBAL
    if subdomain in RESERVED_SUBDOMAINS or (subdomain and subdomain.startswith("saasproject-production")):
        request.state.tenant = None
    else:
        # 3. Buscar el tenant en la DB maestra
        with Session(engine) as session:
            statement = select(Tenant).where(Tenant.subdomain == subdomain)
            tenant = session.exec(statement).first()
            
            if not tenant:
                # Si hay un subdominio pero no existe en la DB, error 404
                raise HTTPException(status_code=404, detail=f"Negocio '{subdomain}' no encontrado")
            
            # 3.1 Verificación de vencimiento de suscripción (si no está ya suspendido)
            if tenant.status != "suspended":
                active_sub = session.exec(
                    select(Subscription)
                    .where(Subscription.tenant_id == tenant.id)
                    .order_by(Subscription.end_date.desc())
                ).first()

                if active_sub and active_sub.end_date and active_sub.end_date < datetime.utcnow():
                    tenant.status = "suspended"
                    session.add(tenant)
                    session.commit()
            
            # 3.2 Verificación de estado del tenant
            if tenant.status == "suspended":
                # Permitir solo si es una ruta de facturación/renovación
                if not path.startswith("/api/tenant/billing"):
                    raise HTTPException(
                        status_code=403, 
                        detail="La suscripción de este negocio ha expirado o se encuentra suspendida. Por favor contacte al administrador o renueve su plan."
                    )

            # Guardamos el objeto tenant en el estado de la petición
            request.state.tenant = tenant

    response = await call_next(request)
    return response

 