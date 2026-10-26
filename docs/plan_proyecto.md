# Plan Maestro Integral: Sistema de Telemedicina (Variante 8)

Esta planificación integra el diseño de arquitectura, backend seguro, interfaces de usuario, nuevas funcionalidades avanzadas (cancelación, horarios, historial clínico, recetas en PDF, catálogo de medicamentos, seguridad OWASP, videollamadas en tiempo real) y el despliegue final en Azure con CI/CD.

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

## Fase 6: Gestión Avanzada de Citas, Horarios Médicos y Blindaje OWASP (Planificación Atómica)
Objetivo: Implementar cancelación de citas con reglas de negocio (RN-03), configuración de horarios de disponibilidad médica (RF-05) y blindaje de seguridad OWASP Top 10 en las rutas y entradas del sistema.

### Módulo 6.1: Cancelación de Citas Médicas (Regla RN-03)
*Rama de Git asignada:* `feature/cancelacion-citas`

- [x] **6.1.1 Método en Repositorio para Cancelar Cita:** Agregar la función `cancelarCitaPorId(idCita)` en `backend/src/repositories/citaRepository.js` que actualice el estado a `'CANCELADA'` y actualice `updated_at`.
  - *Prueba de verificación:* Verificar que el servidor backend (`npm run dev`) reinicie sin errores de sintaxis en consola.
- [x] **6.1.2 Lógica de Negocio RN-03 y Notificación en Servicio:** Agregar `cancelarCita(idCita, idUsuario, rol)` en `backend/src/services/citaService.js` validando que el usuario sea el paciente o médico de la cita, que esté `'PROGRAMADA'`, que si es paciente falten más de 2 horas para la cita (RN-03), y creando notificación automática para la contraparte.
  - *Prueba de verificación:* Probar invocación interna o verificar que `citaService.js` exporte correctamente `cancelarCita` sin errores.
- [x] **6.1.3 Controlador y Ruta Protegida de Cancelación:** Agregar el controlador `cancelarCita` en `backend/src/controllers/citaController.js` y registrar la ruta `PATCH /api/citas/:id/cancelar` con middleware `verificarToken` en `backend/src/routes/citaRoutes.js`.
  - *Prueba de verificación:* Hacer una petición `PATCH` de prueba (desde navegador/consola o terminal) a `/api/citas/:id/cancelar` y comprobar que responde con JSON exitoso o mensaje de validación RN-03.
- [x] **6.1.4 Botón y Confirmación de Cancelar Cita en Frontend:** Agregar en `frontend/src/components/ModalDetalleCita.jsx` el botón `"Cancelar Cita"` (visible solo cuando `cita.estado === 'PROGRAMADA'`), con confirmación visual, estado de carga y recarga automática de la lista de citas y notificaciones en el Dashboard.
  - *Prueba de verificación:* Entrar al Dashboard, abrir los detalles de una cita programada a futuro, hacer clic en "Cancelar Cita" y verificar que cambia su insignia a `CANCELADA` (roja) y aparece la notificación en la campana.

### Módulo 6.2: Disponibilidad Horaria del Médico (RF-05 y RN-01)
*Rama de Git asignada:* `feature/horarios-medicos`

- [x] **6.2.1 Retornar y Actualizar Disponibilidad en Backend:** Modificar `backend/src/repositories/medicoRepository.js` y `backend/src/repositories/userRepository.js` para que `getAllMedicos` y el perfil del médico incluyan el campo JSONB `disponibilidad`, y que `PUT /api/usuarios/perfil` permita al médico guardar su arreglo de días y horas de atención.
  - *Prueba de verificación:* Consultar `GET /api/medicos` en el navegador (`http://localhost:4000/api/medicos`) y comprobar que cada médico incluye la propiedad `disponibilidad` en el JSON.
- [x] **6.2.2 Interfaz de Configuración de Horario en ModalPerfil:** Agregar en `frontend/src/components/ModalPerfil.jsx` (cuando el usuario es `MEDICO`) un selector interactivo sencillo de días de atención (Lunes a Sábado) y rango de horas (ej. `08:00` a `17:00`) que se guarde al pulsar "Guardar Cambios".
  - *Prueba de verificación:* Iniciar sesión como médico (`estuardo@email.com`), abrir "Mi Perfil", marcar días/horas de atención, guardar, volver a abrir el perfil y verificar que los horarios quedaron guardados en PostgreSQL.
- [x] **6.2.3 Visualización de Horario del Médico al Agendar Cita:** Mostrar en `frontend/src/components/ModalAgendarCita.jsx` y en la vista "Directorio Médico" de `Dashboard.jsx` los días y horarios en que atiende el médico seleccionado, advirtiendo al paciente si elige un día u hora fuera del horario del especialista.
  - *Prueba de verificación:* Iniciar sesión como paciente (`paciente@test.com`), abrir "Agendar Nueva Cita", seleccionar al médico y comprobar que se muestra su horario disponible en pantalla antes de confirmar.

### Módulo 6.3: Blindaje de Seguridad OWASP Top 10
*Rama de Git asignada:* `feature/seguridad-owasp`

- [x] **6.3.1 Protección de Rutas de Citas (Broken Access Control - A01):** Agregar el middleware `verificarToken` a las rutas `POST /api/citas/agendar` y `GET /api/citas/:id/videollamada` en `backend/src/routes/citaRoutes.js`, asegurando que el `idPaciente` se valide contra el token o cuerpo autenticado.
  - *Prueba de verificación:* Intentar llamar a `POST /api/citas/agendar` sin token y verificar que devuelve `401 Acceso denegado`; luego agendar una cita desde el Dashboard logueado y verificar que funciona normal.
- [x] **6.3.2 Validación de Esquemas de Entrada con Zod (Injection/XSS - A03):** Crear un validador en `backend/src/middlewares/validateMiddleware.js` usando `zod` (que ya está instalado en `package.json`) para validar y limpiar los datos de entrada en login, registro y agendamiento de citas.
  - *Prueba de verificación:* Intentar enviar en el formulario de registro o login un correo mal formado o campos vacíos y verificar que el backend responde con un mensaje claro de validación.
- [x] **6.3.3 Cabeceras de Seguridad y Límite de Peticiones (Security Misconfiguration / Brute Force - A05/A07):** Configurar un limitador de intentos por IP en las rutas de `/api/auth/login` y `/api/auth/recuperar` en `backend/src/routes/authRoutes.js` para mitigar ataques de fuerza bruta, sin requerir librerías pesadas.
  - *Prueba de verificación:* Hacer 6 intentos fallidos seguidos de login y verificar que al 6.º intento el servidor bloquea temporalmente con mensaje de seguridad por exceso de intentos.

---

## Fase 7: Expediente Clínico Completo, Recetas en PDF y Catálogo de Medicamentos (Planificación Atómica)
Objetivo: Permitir la impresión/descarga de recetas médicas en formato clínico (RF-16), consultar el historial de atenciones previas de cada paciente (RF-13) e integrar un catálogo/API externa de medicamentos almacenado en base de datos (Apartado 4 de la rúbrica).

### Módulo 7.1: Descarga e Impresión de Recetas Médicas en PDF (RF-16)
*Rama de Git asignada:* `feature/recetas-pdf`

- [x] **7.1.1 Componente de Vista Imprimible de Receta Médica:** Crear un generador de documento clínico limpio en `frontend/src/utils/generarRecetaPDF.js` que estructure una receta médica profesional (Membrete de NovaSalud, datos del médico y especialidad, datos del paciente, fecha, diagnóstico, tabla de medicamentos con dosis/frecuencia/duración, indicaciones generales y firma digital) y dispare el motor de impresión/guardado en PDF del navegador.
  - *Prueba de verificación:* Importar la función e invocarla con datos de prueba para verificar que se abre la vista previa de PDF con diseño limpio en una hoja tamaño carta.
- [x] **7.1.2 Botón "Descargar / Imprimir PDF" en Mis Recetas y Detalle de Cita:** Conectar `generarRecetaPDF` en un botón `"Descargar Receta PDF"` dentro de cada tarjeta de receta en la vista `"Mis Recetas / Expedientes"` de `frontend/src/pages/Dashboard.jsx` y dentro de `frontend/src/components/ModalDetalleCita.jsx` (cuando la cita está `COMPLETADA`).
  - *Prueba de verificación:* Entrar como paciente o médico a la pestaña "Mis Recetas", hacer clic en "Descargar Receta PDF" y comprobar que se genera el documento listo para guardar como PDF.

### Módulo 7.2: Historial Clínico Completo por Paciente para el Médico (RF-13 y RN-05)
*Rama de Git asignada:* `feature/historial-clinico`

- [x] **7.2.1 Endpoint de Historial Clínico del Paciente (Backend):** Agregar en `backend/src/repositories/consultaRepository.js`, `consultaService.js`, `consultaController.js` y `consultaRoutes.js` la ruta protegida `GET /api/consultas/paciente/:idPaciente/historial`, verificando la regla RN-05 (que el médico tenga al menos una cita vinculada con ese paciente) y devolviendo todas sus consultas y recetas previas ordenadas por fecha.
  - *Prueba de verificación:* Consultar el endpoint con el token del médico para el paciente de prueba y verificar que retorna el arreglo JSON de consultas anteriores; probar con un usuario no autorizado y verificar que bloquea el acceso.
- [x] **7.2.2 Pestaña de "Historial previo del Paciente" en Sala de Videollamada:** Agregar en el panel derecho de `frontend/src/pages/Videollamada.jsx` una sección desplegable `"Ver Historial de Consultas Previas"` para que el médico, mientras atiende al paciente, pueda consultar qué diagnósticos y medicamentos se le recetaron en citas pasadas.
  - *Prueba de verificación:* Entrar como médico a una sala de consulta, abrir "Historial de Consultas Previas" y verificar que se listan los diagnósticos y recetas anteriores de ese paciente.

### Módulo 7.3: Consumo de Fuente Externa / Catálogo de Medicamentos en BD (Punto 4 de la Guía)
*Rama de Git asignada:* `feature/catalogo-medicamentos`

- [ ] **7.3.1 Tabla y Semilla de Catálogo de Medicamentos en BD:** Agregar la tabla `catalogo_medicamentos` en `database/init.sql` (y creación automática segura desde el backend si no existe) para almacenar medicamentos procesados desde fuente externa (OpenFDA API / dataset oficial con nombre comercial, principio activo, presentación y dosis habitual).
  - *Prueba de verificación:* Reiniciar el backend y verificar que la tabla `catalogo_medicamentos` existe en PostgreSQL sin afectar los datos actuales.
- [ ] **7.3.2 Servicio Backend de Sincronización con API Externa (OpenFDA) y Búsqueda Local:** Crear el endpoint `GET /api/consultas/medicamentos/catalogo?q=...` que busque medicamentos en la base de datos local y, si el médico busca un término nuevo, consulte la API pública externa de medicamentos (con fallback seguro local), lo procese, lo guarde en PostgreSQL y lo devuelva al frontend (cumpliendo la regla: *"los datos obtenidos deberán ser procesados por el backend y almacenados en la base de datos antes de ser mostrados al usuario"*).
  - *Prueba de verificación:* Abrir en el navegador `http://localhost:4000/api/consultas/medicamentos/catalogo?q=paracetamol` (con sesión activa) y verificar que devuelve sugerencias de medicamentos con dosis recomendadas y las guarda en la tabla de PostgreSQL.
- [ ] **7.3.3 Autocompletado de Medicamentos al Emitir Receta en Videollamada:** Conectar el campo `"Nombre del medicamento"` en `frontend/src/pages/Videollamada.jsx` al catálogo del backend para que, cuando el médico escriba las primeras letras de un medicamento, aparezcan sugerencias que autocompleten la dosis y frecuencia recomendada con un clic.
  - *Prueba de verificación:* Entrar como médico a la sala de videollamada, escribir `"Ibu"` o `"Para"` en la sección de Receta Médica, hacer clic en una sugerencia de la lista desplegable y comprobar que se llenan automáticamente el nombre y la dosis sugerida.

---

## Fase 8: Videollamada Funcional en Tiempo Real entre Médico y Paciente (Planificación Atómica)
Objetivo: Lograr que el Médico y el Paciente conectados desde distintos navegadores o dispositivos se vean y escuchen en tiempo real, compartan pantalla y tengan chat en vivo durante la consulta.

### Módulo 8.1: Señalización en Tiempo Real en el Servidor (Socket.io / WebRTC)
*Rama de Git asignada:* `feature/videollamada-realtime`

- [ ] **8.1.1 Integración de Socket.io en el Servidor Backend:** Instalar `socket.io` en `backend/` e integrarlo sobre el servidor HTTP de `backend/src/server.js`, manteniendo intactas todas las rutas Express actuales.
  - *Prueba de verificación:* Iniciar `npm run dev` en `backend/` y verificar que el servidor arranca en el puerto `4000` indicando que el servidor HTTP + WebSockets está activo.
- [ ] **8.1.2 Eventos de Sala Virtual (Unirse, Oferta/Respuesta WebRTC, Candidatos ICE y Chat):** Crear el manejador `backend/src/socket/videollamadaSocket.js` que gestione cuando el Médico y el Paciente entran a la misma sala (`roomId`), reenvíe las señales WebRTC (`offer`, `answer`, `ice-candidate`), avise cuando el otro participante apaga su cámara/micrófono y transmita mensajes de chat clínico en vivo.
  - *Prueba de verificación:* Verificar en los logs de la terminal del backend que al abrir la sala `/sala/:id` se registra `[Socket] Usuario conectado a la sala`.

### Módulo 8.2: Conexión de Video/Audio Remoto y Chat Clínico en Frontend
*Rama de Git asignada:* `feature/videollamada-realtime`

- [ ] **8.2.1 Conexión P2P de Video y Audio Remoto en `Videollamada.jsx`:** Instalar `socket.io-client` en `frontend/` y agregar el elemento `<video ref={remoteVideoRef}>` y la conexión `RTCPeerConnection` (con servidores STUN públicos gratuitos de Google/Cloudflare) en `frontend/src/pages/Videollamada.jsx`, de modo que cuando el segundo participante entra a la sala, el texto *"Esperando conexión de cámara remota..."* sea reemplazado automáticamente por el video y audio en vivo de la otra persona.
  - *Prueba de verificación:* Abrir una ventana normal con el Médico y una ventana de incógnito (o segundo navegador) con el Paciente en la misma cita, entrar ambos a la sala y comprobar que ambos se ven y se escuchan en el recuadro principal.
- [ ] **8.2.2 Sincronización de Compartir Pantalla y Chat en Vivo dentro de la Sala:** Hacer que al pulsar el botón `"Compartir pantalla"` la pista de video enviada al otro participante cambie en vivo a la pantalla compartida (`replaceTrack`), y añadir una pestaña/botón de **Chat en Vivo** en la sala para enviar mensajes rápidos durante la videollamada.
  - *Prueba de verificación:* Desde la ventana del Médico compartir pantalla y enviar un mensaje en el chat de la sala; verificar en la ventana del Paciente que se ve la pantalla del médico y llega el mensaje instantáneamente.

---

## Fase 9: Preparación para Producción, CI/CD con GitHub Actions y Despliegue en Azure (Al Final)
Objetivo: Parametrizar las URLs para producción, crear el pipeline automatizado de GitHub Actions y desplegar la aplicación completa en la nube (Azure for Students).

### Módulo 9.1: Parametrización de Entornos y Contenedores Docker
*Rama de Git asignada:* `feature/ci-cd-azure`

- [ ] **9.1.1 URL Dinámica en Frontend y CORS en Backend:** Modificar `frontend/src/services/api.js` para usar `import.meta.env.VITE_API_URL || 'http://localhost:4000/api'` (y la misma base para el Socket de videollamada), de forma que funcione tanto en `localhost` como en Azure sin tocar código.
  - *Prueba de verificación:* Ejecutar `npm run build` en `frontend/` y `npm run dev` en local comprobando que todo sigue conectando a `localhost:4000` por defecto.
- [ ] **9.1.2 Creación de `Dockerfile` para Backend y Frontend:** Crear `backend/Dockerfile` y `frontend/Dockerfile` optimizados para producción y actualizar `docker-compose.yml` para validar el levantamiento completo.
  - *Prueba de verificación:* Verificar que el build de ambos proyectos finaliza con código `0` sin errores ni dependencias faltantes.

### Módulo 9.2: Pipeline CI/CD en GitHub Actions y Despliegue en Azure
*Rama de Git asignada:* `feature/ci-cd-azure`

- [ ] **9.2.1 Creación del Pipeline `.github/workflows/ci-cd.yml`:** Crear el flujo automatizado de GitHub Actions que se dispare en cada `push` y `pull_request` hacia `main`, instale dependencias de Backend y Frontend, verifique la sintaxis, ejecute el `build` de producción de React y genere el artefacto publicable.
  - *Prueba de verificación:* Subir la rama a GitHub, abrir el Pull Request y comprobar en la pestaña **"Actions"** de GitHub que aparece el check verde (`✓`) de compilación exitosa.
- [ ] **9.2.2 Despliegue en la Nube (Azure App Service / Container Apps + PostgreSQL):** Configurar la base de datos en la nube con el script `database/init.sql`, conectar las variables de entorno (`DB_HOST`, `JWT_SECRET`, `VITE_API_URL`) y conectar el paso de despliegue continuo en GitHub Actions hacia Azure.
  - *Prueba de verificación:* Abrir la URL pública `https://...` generada en Azure desde cualquier navegador o teléfono móvil, iniciar sesión con las cuentas demo y realizar una cita con videollamada completa.
