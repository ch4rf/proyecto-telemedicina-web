# Sistema de Telemedicina - Variante 8

## Descripción del Proyecto
Plataforma web integral de telemedicina diseñada para conectar pacientes y médicos. El sistema permite agendar consultas, mantener un registro centralizado del expediente clínico básico de cada paciente y emitir recetas simples asociadas a una consulta médica, aplicando un control de acceso estricto para garantizar la privacidad.

## Integrantes del Equipo
1. Josué Estuardo Caal Tzub
2. Daniel Esaú Mejia Garcia
3. Luis Enrique Cab Caal
4. Adami Ramiro Oliva Martínez

## Estructura del Sistema
El proyecto implementa una arquitectura modular de tres capas:
* **/frontend:** Desarrollado con React, Vite y Tailwind CSS para una interfaz reactiva y validaciones en el cliente.
* **/backend:** API RESTful construida con Node.js y Express, encargada de la lógica de negocio, control de acceso (OWASP) y operaciones CRUD.
* **/database:** Scripts SQL para la creación y población de tablas en PostgreSQL con campos estructurados y JSONB.
* **/docs:** Documentación técnica, diagramas de arquitectura y especificaciones del proyecto.

---

## Instrucciones de Instalación y Ejecución Local

### Prerrequisitos
* **Node.js** (v18 o superior)
* **Docker Desktop** (para levantar PostgreSQL y pgAdmin)

---

### Paso 1: Levantar la Base de Datos con Docker
Desde la raíz del repositorio, ejecuta:
```bash
docker compose up -d
```
Esto creará e iniciará dos contenedores:
- **telemedicina_db (PostgreSQL 15):** Escuchando en el puerto host `5433` e inicializado automáticamente con el esquema y datos de prueba de `database/init.sql`.
- **telemedicina_pgadmin:** Interfaz web de pgAdmin disponible en `http://localhost:5050` (Usuario: `admin@telemedicina.com` / Clave: `admin`).

---

### Paso 2: Configuración y Arranque del Backend

1. Entra a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea tu archivo de variables de entorno `.env` a partir de la plantilla:
   - En Windows (PowerShell / CMD):
     ```bash
     copy .env.example .env
     ```
   - En Linux / macOS / Git Bash:
     ```bash
     cp .env.example .env
     ```
   *Nota: El archivo `.env` ya contiene la configuración predeterminada apuntando al puerto `5433` de Docker.*
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   El backend iniciará en `http://localhost:4000`.

---

### Paso 3: Configuración y Arranque del Frontend

1. Abre una nueva terminal y navega al directorio del cliente:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación web estará disponible en `http://localhost:5173`.

---

## Cuentas de Acceso Preconfiguradas (Demo)

Las siguientes credenciales están disponibles para pruebas inmediatas:

| Rol | Correo Electrónico | Contraseña | Nombre |
| :--- | :--- | :--- | :--- |
| **Médico** | `estuardo@email.com` | `123` | Dr. Estuardo Caal |
| **Paciente** | `paciente@test.com` | `123` | Juan Pérez |
| **Administrador** | `admin@telemedicina.com` | `admin123` | Administrador Sistema |
