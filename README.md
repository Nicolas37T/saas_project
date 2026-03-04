# SaaS Project

Este es un proyecto SaaS (Software as a Service) multi-tenant. Consta de un backend construido con FastAPI (Python) y un frontend construido con Next.js (React).

## Requisitos Previos

Asegúrate de tener instalado en tu computadora:
- [Node.js](https://nodejs.org/) (Versión 18 o superior)
- [Python](https://www.python.org/downloads/) (Versión 3.9 o superior)
- [PostgreSQL](https://www.postgresql.org/download/) (Base de datos en ejecución)
- [Git](https://git-scm.com/)

## 🚀 Instalación y Configuración

Sigue estos pasos para clonar y ejecutar el proyecto en tu máquina local.

### 1. Clonar el Repositorio

Abre tu terminal y ejecuta:

```bash
git clone <URL_DE_TU_REPOSITORIO>
cd saas_project
```

### 2. Configurar el Backend (FastAPI)

Abre una terminal en la carpeta `backend`:

```bash
cd backend
```

Crea un entorno virtual y actívalo:
```bash
# En Windows
python -m venv venv
.\venv\Scripts\activate

# En Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

Instala las dependencias:
```bash
pip install -r requirements.txt
```

Configura las variables de entorno:
1. Crea un archivo llamado `.env` en la carpeta `backend/`.
2. Añade las configuraciones necesarias (como la URL de la base de datos PostgreSQL, claves JWT, etc.).
   
   Ejemplo de `.env`:
   ```env
   DATABASE_URL=postgresql://tu_usuario:tu_contraseña@localhost/saas_master
   SECRET_KEY=tu_clave_secreta_super_segura
   ```

Inicia el servidor backend:
```bash
uvicorn app.main:app --reload
```
El backend estará corriendo en `http://localhost:8000`.

### 3. Configurar el Frontend (Next.js)

Abre **otra** terminal y dirígete a la carpeta `frontend`:

```bash
cd frontend
```

Instala las dependencias de Node:
```bash
npm install
```

Configura las variables de entorno del frontend (opcional):
Crea un archivo `.env.local` en la carpeta `frontend/` si necesitas definir variables como la URL del API (por defecto asume que es `http://localhost:8000`).

Inicia el servidor de desarrollo del frontend:
```bash
npm run dev
```
El frontend estará corriendo en `http://localhost:3000`.

## 🛠️ Credenciales por defecto

Al arrancar el backend por primera vez, se generará la base de datos y un usuario administrador por defecto (si la lógica de semilla está habilitada en tu `main.py`):
- **Email:** `admin@saas.com`
- **Contraseña:** `admin1234`

## Estructura del Proyecto

- `/backend`: API RESTful construida con FastAPI, SQLModel y PostgreSQL. Maneja la creación dinámica de bases de datos para cada cliente (Tenants).
- `/frontend`: Aplicación web moderna con Next.js, Tailwind CSS y shadcn/ui. Contiene el portal público, registro, y el dashboard administrativo.
