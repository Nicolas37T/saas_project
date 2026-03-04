from fastapi import Request, HTTPException
from app.db.session import Session, engine
from app.db.models import Tenant
from sqlmodel import select

async def tenant_middleware(request: Request, call_next):
    # 0. Ignorar peticiones OPTIONS (CORS preflight)
    if request.method == "OPTIONS":
        return await call_next(request)

    # 1. Obtener el host sin el puerto (ej: negocio1.localhost:8000 -> negocio1.localhost)
    host = request.headers.get("host", "").split(":")[0]
    
    # 2. Determinar el subdominio
    subdomain = None
    if "." in host:
        # Si es una IP (ej: 127.0.0.1), no hay subdominio
        parts = host.split(".")
        if not all(part.isdigit() for part in parts):
            subdomain = parts[0]
    
    # Opción B: Usar un header para pruebas (X-Tenant) tiene prioridad
    tenant_header = request.headers.get("X-Tenant")
    if tenant_header:
        subdomain = tenant_header

    # Si no hay subdominio o es una ruta reservada, es contexto GLOBAL
    if subdomain in [None, "", "www", "localhost", "admin"]:
        request.state.tenant = None
    else:
        # 3. Buscar el tenant en la DB maestra
        with Session(engine) as session:
            statement = select(Tenant).where(Tenant.subdomain == subdomain)
            tenant = session.exec(statement).first()
            
            if not tenant:
                # Si hay un subdominio pero no existe en la DB, error 404
                raise HTTPException(status_code=404, detail=f"Negocio '{subdomain}' no encontrado")
            
            # Guardamos el objeto tenant en el estado de la petición
            request.state.tenant = tenant

    response = await call_next(request)
    return response

