# Mapa de Módulos del Sistema

Este documento mantiene la relación lógica y física de la arquitectura de la base de datos y la API REST, dividida por módulos. Es la guía principal para la resolución de errores, estandarización y el desarrollo de nuevas características.

## Descripción General de la Arquitectura
* **Frontend:** HTML, CSS, JavaScript (Peticiones vía `fetch`).
* **Backend:** API REST con Node.js.
* **Base de Datos:** PostgreSQL.

---

## Módulos del Sistema

| Nombre del Módulo | Responsabilidad Principal | Tablas Asociadas | (Futuros) Endpoints / SPs |
| :--- | :--- | :--- | :--- |
| **Seguridad y Auditoría** | Controlar el acceso al sistema, permisos y registrar cada movimiento (INSERT, UPDATE, DELETE) para trazabilidad. | `Usuarios`, `Roles`, `Auditoria_General` | *Pendiente de definir* |
| **Catálogos Locales** | Almacenar las opciones de selección estáticas (zonas, sectores, estados, profesiones) para evitar escribir texto libre y estandarizar datos. | `Cat_Zonas_Sectores`, `Cat_Estado_Miembro`, `Cat_Genero`, `Cat_Lugares_Iglesia`, `Cat_Ministerios`, `Cat_Motivo_Retiro`, `Cat_Profesiones`, `Cat_Tipo_Actividad`, `Cat_Tipo_Duracion`, `Cat_Tipo_Recepcion` | *Pendiente de definir* |
| **Membresía y Hogares** | Gestionar la información personal de los congregantes, agrupándolos por núcleos familiares y direcciones físicas. | `Familias`, `MIEMBROS` | *Pendiente de definir* |
| **Ministerios** | Llevar el historial exacto de qué miembro sirve en qué ministerio, sus cargos y el tiempo que han estado activos. | `Miembros_Ministerios_Historial` | *Pendiente de definir* |
| **Actividades** | Agendar y controlar los eventos de la iglesia, vinculando ministerios responsables, lugares y anfitriones. | `Actividades` | *Pendiente de definir* |