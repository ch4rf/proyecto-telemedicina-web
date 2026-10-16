# Diccionario de Lógica y Funciones

Este documento contiene el inventario de la lógica del sistema original (Stored Procedures de SQL Server) mapeado hacia su comportamiento y módulo correspondiente en la nueva arquitectura de la API REST.

---

## 1. Módulo: Seguridad y Auditoría

| Nombre Original (SP) | Acción / Objetivo Principal | Tipo de Operación | Destino en la Nueva Arquitectura |
| :--- | :--- | :--- | :--- |
| `sp_RegistrarUsuario` | Inserta un nuevo usuario asignándole un rol. | Escritura (INSERT) | Se convierte en ruta `POST /api/usuarios`. La encriptación se delega a Node.js con `bcrypt`. |
| `sp_ValidarUsuario` | Verifica las credenciales de acceso y registra el éxito o fallo. | Lectura / Bitácora | Se convierte en ruta `POST /api/usuarios/login`. Retorna un token seguro (JWT). Registra en `auditoria_general`. |

---

## 2. Módulo: Catálogos Locales

| Nombre Original (SP) | Acción / Objetivo Principal | Tipo de Operación | Destino en la Nueva Arquitectura |
| :--- | :--- | :--- | :--- |
| `sp_ListarAsentamientos` / `sp_ObtenerAsentamientos` | Trae la lista completa de sectores/zonas ordenados alfabéticamente. | Lectura (SELECT) | Ruta `GET /api/catalogos/zonas`. Apunta a `cat_zonas_sectores`. |
| `sp_InsertarAsentamiento` / `sp_EditarAsentamiento` / `sp_EliminarAsentamiento` | CRUD completo para el mantenimiento de los sectores o zonas de la iglesia. | Escritura (CUD) | Rutas `POST`, `PUT`, `DELETE` en `/api/catalogos/zonas`. El borrado se protege por FK nativa. |
| `sp_MostrarCatalogoLugares` / `sp_MostrarLugaresIglesia` | Obtiene el listado de espacios físicos de la iglesia. | Lectura (SELECT) | Ruta `GET /api/catalogos/lugares`. Se elimina la duplicidad del SP original. |
| `sp_InsertarLugar` / `sp_EditarLugar` / `sp_EliminarLugar` | CRUD para gestionar las ubicaciones e indicar si requieren un anfitrión. | Escritura (CUD) | Rutas `POST`, `PUT`, `DELETE` en `/api/catalogos/lugares`. |
| `sp_MostrarCatalogosMinisterios` / `sp_MostrarMinisterios` | Lista las diferentes áreas de servicio de la congregación. | Lectura (SELECT) | Ruta `GET /api/catalogos/ministerios`. |
| `sp_InsertarMinisterio` / `sp_EditarMinisterio` / `sp_EliminarMinisterio` | CRUD básico para la administración de ministerios. | Escritura (CUD) | Rutas `POST`, `PUT`, `DELETE` en `/api/catalogos/ministerios`. |
| `sp_MostrarMotivosRetiro` / `sp_InsertarMotivoRetiro` / `sp_EditarMotivoRetiro` / `sp_EliminarMotivoRetiro` | CRUD para gestionar las razones por las cuales un miembro se da de baja. | Completo (CRUD) | Rutas HTTP bajo el endpoint `/api/catalogos/motivos-retiro`. |
| `sp_MostrarProfesiones` / `sp_InsertarProfesion` / `sp_EditarProfesion` / `sp_EliminarProfesion` | CRUD para administrar el catálogo de oficios y profesiones de los miembros. | Completo (CRUD) | Rutas HTTP bajo el endpoint `/api/catalogos/profesiones`. |
| `sp_MostrarTiposActividad` / `sp_InsertarTipoActividad` / `sp_EditarTipoActividad` / `sp_EliminarTipoActividad` | CRUD para tipificar los eventos (Células, Cultos, Ensayos, etc.). | Completo (CRUD) | Rutas HTTP bajo el endpoint `/api/catalogos/tipos-actividad`. |
| `sp_MostrarTiposDuracion` / `sp_InsertarTipoDuracion` / `sp_EditarTipoDuracion` / `sp_EliminarTipoDuracion` | CRUD para parametrizar las duraciones de eventos y si requieren hora fija. | Completo (CRUD) | Rutas HTTP bajo el endpoint `/api/catalogos/tipos-duracion`. |
| `sp_MostrarTiposRecepcion` / `sp_InsertarTipoRecepcion` / `sp_EditarTipoRecepcion` / `sp_EliminarTipoRecepcion` | CRUD para definir cómo fue recibido el miembro (Bautismo, Carta de traslado, etc.). | Completo (CRUD) | Rutas HTTP bajo el endpoint `/api/catalogos/tipos-recepcion`. |
| `SP_Obtener_Estado` | Lista los estados de membresía (Activo, Inactivo, Bajo disciplina). | Lectura (SELECT) | Ruta `GET /api/catalogos/estados`. |
| `sp_ObtenerGeneros` | Retorna las opciones de género configuradas. | Lectura (SELECT) | Ruta `GET /api/catalogos/generos`. |

---

## 3. Módulo: Membresía y Hogares

| Nombre Original (SP) | Acción / Objetivo Principal | Tipo de Operación | Destino en la Nueva Arquitectura |
| :--- | :--- | :--- | :--- |
| `sp_ObtenerFamilias` | Trae un listado minimalista (ID y Nombre) para llenar elementos de selección. | Lectura (SELECT) | Ruta `GET /api/familias/lista-seleccion`. |
| `sp_ListarFamilias` | Lista general de hogares con su dirección y una subconsulta del total de integrantes. | Lectura (SELECT) | Ruta `GET /api/familias`. Ejecuta el conteo dinámico directamente en SQL. |
| `sp_InsertarFamilia` / `sp_EditarFamilia` / `sp_EliminarFamilia` | CRUD centralizado para la creación y gestión de los núcleos familiares. | Escritura (CUD) | Rutas `POST`, `PUT`, `DELETE` en `/api/familias`. La eliminación limpia en cascada a los miembros. |
| `sp_ContarMiembrosFamilia` | Cuenta de forma aislada cuántos miembros pertenecen a un ID de familia. | Lectura (SELECT) | Reemplazado por consultas lógicas dentro de las rutas del backend. |
| `sp_MiembrosPorFamilia` | Extrae la lista de integrantes específicos que componen un hogar. | Lectura (SELECT) | Ruta `GET /api/familias/:id/miembros`. El ID se valida previamente en Node.js. |
| `sp_MostrarMiembros` | Consulta maestra con múltiples LEFT JOINs para la cuadrícula general de personas. | Lectura (SELECT) | Ruta `GET /api/miembros`. SQL plano optimizado ejecutado desde Node.js. |
| `sp_BuscarMiembroPorID` | Extrae de forma individual toda la ficha de información de un congregante. | Lectura (SELECT) | Ruta `GET /api/miembros/:id`. |
| `sp_BuscarMiembrosPorNombre` | Buscador avanzado de personas filtrando por coincidencia en nombres o apellidos. | Lectura (SELECT) | Ruta `GET /api/miembros/busqueda?nombre=...` empleando operadores `LIKE`. |
| `sp_BuscarMiembrosHuerfanos` | Localiza personas que no están vinculadas a ninguna familia filtrando por apellido. | Lectura (SELECT) | Ruta `GET /api/miembros/huerfanos`. Útil para los procesos de asignación. |
| `sp_InsertarMiembro` / `sp_EditarMiembro` | Registra o actualiza la ficha completa de una persona en la base de datos. | Escritura (CUI) | Rutas `POST` y `PUT` en `/api/miembros`. Disparan el log automático en la auditoría. |
| `sp_AsignarFamilia` | Vincula a un miembro existente con un hogar y le asigna un rol familiar. | Escritura (UPDATE) | Ruta `PATCH /api/miembros/:id/asignar-familia`. |
| `sp_QuitarMiembroFamilia` | Remueve a un miembro de su grupo familiar actual colocándolo como huérfano. | Escritura (UPDATE) | Ruta `PATCH /api/miembros/:id/remover-familia` (Pone `id_familia = NULL`). |
| `sp_DarBajaMiembro` | Actualiza el estado de una persona para retirarla de la membresía activa de la iglesia. | Escritura (UPDATE) | Ruta `PATCH /api/miembros/:id/dar-baja`. |

---

## 4. Módulo: Ministerios

| Nombre Original (SP) | Acción / Objetivo Principal | Tipo de Operación | Destino en la Nueva Arquitectura |
| :--- | :--- | :--- | :--- |
| `sp_MostrarHistorialMinisterio` | Despliega la lista cronológica completa de quiénes han servido en un ministerio. | Lectura (SELECT) | Ruta `GET /api/ministerios/:id/historial`. |
| `sp_MostrarMiembrosPorMinisterio` | Filtra únicamente a las personas que actualmente sirven de forma activa en un área. | Lectura (SELECT) | Ruta `GET /api/ministerios/:id/miembros-activos`. |
| `sp_AsignarMiembroAMinisterio` | Inserta un nuevo registro de servicio en el historial validando que no esté duplicado. | Escritura (INSERT) | Ruta `POST /api/ministerios/asignar`. Node.js realiza la validación previa de actividad. |
| `sp_DarBajaMiembroMinisterio` | Concluye el periodo de servicio de un miembro en un ministerio registrando la fecha de fin. | Escritura (UPDATE) | Ruta `PATCH /api/ministerios/historial/:id/dar-baja`. |

---

## 5. Módulo: Actividades

| Nombre Original (SP) | Acción / Objetivo Principal | Tipo de Operación | Destino en la Nueva Arquitectura |
| :--- | :--- | :--- | :--- |
| `sp_BuscarActividades` | Consulta avanzada con múltiples filtros opcionales para buscar eventos de la iglesia. | Lectura (SELECT) | Ruta `GET /api/actividades`. **Usa sintaxis CTE** dinámica construida en Node.js. |
| `sp_InsertarActividad` / `sp_EditarActividad` / `sp_EliminarActividad` | CRUD operativo básico para la agenda y control de eventos de los ministerios. | Completo (CRUD) | Rutas `POST`, `PUT` y `DELETE` mapeadas bajo el endpoint `/api/actividades`. |