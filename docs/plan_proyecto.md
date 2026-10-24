# Plan Maestro Integral: Sistema de Telemedicina (Variante 8)

Esta planificación integra el diseño de arquitectura, backend seguro, interfaces de usuario y la integración funcional completa de todos los módulos del sistema.

---

## Fase 1: Análisis de Sistemas y Arquitectura
Objetivo: Definir el "qué", el "quién" y el "cómo" antes de codificar la lógica compleja.

- [x] 1.1 Requisitos y Reglas de Negocio: Especificación formal de funciones y restricciones (Documentado en /docs/analisis_sistema/01_requisitos.md).
- [x] 1.2 Casos de Uso y Diagramas de Flujo: Mapeo del viaje del usuario.
- [x] 1.3 Diseño de UI/UX: Refinamiento de wireframes para la sala de videollamada.

---

## Fase 2: Infraestructura y Base de Datos
Objetivo: Preparar los cimientos de almacenamiento e infraestructura local.

- [x] 2.1 Configuración Base (Docker + PostgreSQL): Entorno contenedorizado listo.
- [x] 2.2 Refinamiento del Modelo de Datos: Script init.sql actualizado para videollamadas.

---

## Fase 3: Desarrollo del Backend (Node.js/Express)
Objetivo: Construir el cerebro del sistema, aplicando seguridad OWASP y Arquitectura en Capas.

- [x] 3.1 Autenticación y Seguridad: Hashing de contraseñas y JWT.
- [x] 3.1.1 Refactorización Arquitectónica: Migración al patrón Controller-Service-Repository.
- [x] 3.2 Módulos CRUD Base: Endpoints para Perfiles, Pacientes y Médicos.
- [x] 3.3 Módulo de Agendamiento: Lógica para reservar citas verificando superposición.
- [x] 3.4 Módulo de Videollamadas: Integración WebRTC/Video y generación de salas seguras.

---

## Fase 4: Maquetación y Diseño Visual del Frontend (React.js)
Objetivo: Construir la interfaz de usuario interactiva, estética y responsiva (Mockups y vistas base).

- [x] 4.1 Configuración Inicial: Setup de React, Tailwind CSS y enrutamiento seguro.
- [x] 4.2 Vistas de Autenticación y Dashboards: Maquetación del Login y Panel Principal.
- [x] 4.3 Sala de Videollamada y Expediente: Maquetación visual Split-Screen con controles.

---

## Fase 5: Integración Funcional Integral Frontend-Backend
Objetivo: Dotar de funcionalidad real y dinámica al 100% de los elementos visuales, botones, formularios e interacciones.

### Modulo 5.1: Base de Datos y Endpoints de Soporte
- [x] 5.1.1 Extension de Esquema BD: Creacion de tabla notificaciones y campos para recuperacion de password y sesiones.
- [x] 5.1.2 Endpoints de Notificaciones: Rutas para listar y marcar como leidas las alertas.
- [x] 5.1.3 Endpoints de Busqueda y Perfil: Busqueda en tiempo real de medicos/pacientes y consulta/edicion de perfil.
- [x] 5.1.4 Endpoints de Consultas y Recetas: Persistencia de diagnostico clinico y emision de medicamentos.
- [x] 5.1.5 Endpoints de Estadisticas (KPIs): Calculo dinamico de citas activas, recetas emitidas y videollamadas del dia.

### Modulo 5.2: Capa Base del Cliente Frontend
- [x] 5.2.1 Cliente de Comunicacion API: Configuracion de cliente HTTP centralizado con envio automatico de Bearer Token.
- [x] 5.2.2 Contexto Global de Autenticacion (AuthContext): Manejo centralizado de usuario activo, rol, persistencia y estado de sesion.
- [x] 5.2.3 Enrutamiento Protegido (PrivateRoute): Proteccion estricta de rutas autenticadas y redireccion de usuarios no autorizados.

### Modulo 5.3: Funcionalidad Total del Modulo de Autenticacion (Login)
- [x] 5.3.1 Selector de Rol Dinamico: Alternancia y filtrado de autenticacion segun rol (Paciente / Medico).
- [x] 5.3.2 Validacion e Inicio de Sesion Real: Conexion con POST /api/auth/login, gestion de errores y alertas visuales.
- [x] 5.3.3 Persistencia de Sesion: Checkbox "Recordar sesion" funcional diferenciando localStorage y sessionStorage.
- [x] 5.3.4 Flujo de Recuperacion de Password: Modal y proceso funcional para enlace "Olvido su contrasena?".
- [x] 5.3.5 Flujo de Registro de Usuarios: Modal y proceso funcional para enlace "Solicite acceso aqui" (Paciente y Medico).

### Modulo 5.4: Funcionalidad Total del Panel Principal (Dashboard)
- [x] 5.4.1 Control de Cierre de Sesion: Limpieza completa de credenciales y redireccion a Login.
- [x] 5.4.2 Header Interactivo - Buscador: Barra de busqueda funcional en tiempo real para medicos y citas.
- [x] 5.4.3 Header Interactivo - Notificaciones: Campana con contador reactivo y menu desplegable de avisos con marcado de leidas.
- [x] 5.4.4 Header Interactivo - Perfil de Usuario: Avatar interactivo con iniciales reales y modal para ver y actualizar datos personales.
- [x] 5.4.5 Navegacion de Sidebar: Vistas activas para "Panel Principal", "Mis Citas", "Directorio Medico" y "Expedientes".
- [x] 5.4.6 Tarjetas de Metricas (KPIs): Conteo reactivo conectado a BD con navegacion interactiva al hacer clic.
- [x] 5.4.7 Banner de Bienvenida y Proxima Actividad: Carga de nombre del usuario logueado y resumen de la cita mas cercana.
- [x] 5.4.8 Modal de Agendamiento de Citas: Boton "Agendar Nueva Cita" con seleccion de medico, fecha, hora y persistencia en BD.
- [x] 5.4.9 Modal de Detalles de Cita: Boton "Ver Detalles" con informacion completa y boton condicional de acceso a videollamada.

### Modulo 5.5: Funcionalidad Total de la Sala de Videollamada
- [x] 5.5.1 Captura Multimedia Real: Integracion de camara y microfono reales del usuario mediante getUserMedia en el PiP.
- [x] 5.5.2 Controles de Audio y Video: Botones funcionales para silenciar microfono y apagar camara en tiempo real.
- [x] 5.5.3 Compartir Pantalla: Integracion funcional del boton de transmision mediante getDisplayMedia.
- [x] 5.5.4 Cronometro en Vivo: Temporizador activo contabilizando la duracion exacta de la sesion.
- [x] 5.5.5 Boton Colgar: Liberacion de camara/microfono, actualizacion de estado y retorno seguro al Dashboard.
- [x] 5.5.6 Expediente Clinico Dinamico: Carga de datos del paciente y persistencia de notas de diagnostico en BD.
- [x] 5.5.7 Emision de Receta Medica: Agregado dinamico de medicamentos, emision formal en BD y actualizacion de cita a COMPLETADA.

---

## Fase 6: CI/CD y Despliegue en la Nube
Objetivo: Automatizar la entrega del software y ponerlo en producción.

- [ ] 6.1 Pipeline de GitHub Actions: Flujo automatizado de validación y Docker.
- [ ] 6.2 Despliegue (Deploy): Publicación del sistema en la nube o máquina virtual.
