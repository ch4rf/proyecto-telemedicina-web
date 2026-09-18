# Sistema de Telemedicina - Variante 8

## Descripción del Proyecto
Plataforma web integral de telemedicina diseñada para conectar pacientes y médicos. El sistema permite agendar consultas, mantener un registro centralizado del expediente clínico básico de cada paciente y emitir recetas simples asociadas a una consulta médica, aplicando un control de acceso estricto para garantizar la privacidad.

## Integrantes del Equipo
1. Josué Estuardo Caal Tzub
2. Daniel Esaú Mejia Garcia
3. Luis Enrique Cab Caal
4. Adami Ramiro Oliva Martínez

## Estructura del Sistema
El proyecto implementa una arquitectura de tres capas:
* **/frontend:** Desarrollado con React y Tailwind CSS para una interfaz responsiva y validaciones en el cliente.
* **/backend:** API RESTful construida con Node.js y Express, encargada de la lógica de negocio, control de acceso (OWASP) y operaciones CRUD.
* **/database:** Scripts SQL para la creación de tablas en PostgreSQL, utilizando un modelo relacional y campos JSONB.
* **/docs:** Documentación técnica, diagramas de arquitectura y mockups de las pantallas principales.

## Instrucciones de Instalación

### Backend (Node.js)
1. Navegar al directorio: `cd backend`
2. Instalar dependencias: `npm install`
3. Configurar las variables de entorno (`.env`)
4. Iniciar el servidor: `npm run dev`

### Frontend (React)
1. Navegar al directorio: `cd frontend`
2. Instalar dependencias: `npm install`
3. Iniciar la aplicación: `npm run dev`