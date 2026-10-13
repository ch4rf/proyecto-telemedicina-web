# Especificación de Requisitos del Sistema (SRS)
**Proyecto:** Sistema de Telemedicina (Variante 8)

---

## 1. Requisitos Funcionales (RF)

### Módulo 1: Autenticación y Seguridad
* **RF-01:** El sistema debe permitir el registro de usuarios asignándoles un rol específico (Paciente o Médico).
* **RF-02:** El sistema debe permitir el inicio de sesión mediante correo electrónico y contraseña.
* **RF-03:** El sistema debe cerrar la sesión automáticamente tras un periodo de inactividad o expiración del token de seguridad.

### Módulo 2: Perfiles y Gestión de Usuarios
* **RF-04:** El Paciente debe poder completar y actualizar sus datos clínicos básicos (alergias, tipo de sangre, antecedentes).
* **RF-05:** El Médico debe poder configurar su especialidad y registrar su disponibilidad semanal (días y horas de atención).

### Módulo 3: Agendamiento de Citas
* **RF-06:** El Paciente debe poder buscar médicos filtrando por especialidad.
* **RF-07:** El Paciente debe poder visualizar la disponibilidad de un médico y agendar una cita en un horario libre.
* **RF-08:** El Médico debe poder visualizar una agenda diaria con las citas programadas, pendientes y canceladas.
* **RF-09:** El sistema debe cambiar el estado de la cita a "Completada" o "Cancelada" según corresponda.

### Módulo 4: Telemedicina (Videollamadas) 
* **RF-10:** El sistema debe generar un enlace de videollamada único y seguro asociado a cada cita agendada.
* **RF-11:** El Paciente y el Médico deben poder ingresar a una "Sala de Espera Virtual" antes de iniciar la consulta.
* **RF-12:** El sistema debe soportar transmisión de audio y video en tiempo real durante la consulta.

### Módulo 5: Expediente Clínico y Recetas
* **RF-13:** El Médico debe tener acceso en modo lectura al historial clínico del paciente *solo si* tiene una cita asignada con él.
* **RF-14:** Al finalizar la videollamada, el Médico debe poder registrar un diagnóstico y notas clínicas de la consulta.
* **RF-15:** El Médico debe poder generar una receta médica digital añadiendo medicamentos, dosis e indicaciones.
* **RF-16:** El Paciente debe poder visualizar e imprimir/descargar sus recetas médicas desde su panel.

---

## 2. Requisitos No Funcionales (RNF)

### Arquitectura y Despliegue
* **RNF-01 (CI/CD):** El proyecto debe contar con un pipeline automatizado que compile, construya contenedores y despliegue el código tras cada actualización en la rama principal.
* **RNF-02 (Cloud/On-Premise):** El sistema debe ser compatible con un despliegue contenerizado (Docker) para ejecutarse en servidores virtuales o en la nube.

### Seguridad y Privacidad (Cumplimiento OWASP)
* **RNF-03 (Protección de Datos):** Las contraseñas deben estar fuertemente encriptadas (algoritmo bcrypt o similar) antes de guardarse en la base de datos.
* **RNF-04 (Autenticación):** Toda la comunicación entre el cliente web y el servidor debe estar protegida por tokens de sesión sin estado (JWT).
* **RNF-05 (Prevención Inyecciones):** Todas las entradas de datos en los formularios deben ser sanitizadas tanto en el cliente como en el servidor para evitar ataques XSS y SQL Injection.

### Rendimiento e Interfaz
* **RNF-06 (Diseño Responsivo):** La interfaz de usuario debe adaptarse perfectamente a computadoras de escritorio, tablets y dispositivos móviles.
* **RNF-07 (Tiempos de Respuesta):** Las operaciones de base de datos y respuesta de la API no deben superar los 2 segundos bajo carga normal.


---

## 3. Reglas de Negocio (Business Rules)
*(Restricciones lógicas inquebrantables que el sistema debe validar para evitar errores operativos o legales)*

* **RN-01 (Límites de Agendamiento):** No se pueden agendar citas en fechas u horas que ya hayan pasado, ni fuera del horario de disponibilidad configurado por el médico.
* **RN-02 (Prevención de Solapamiento):** El sistema rechazará cualquier intento de agendar una cita si el médico ya tiene otra cita en estado "Programada" en ese mismo bloque de tiempo.
* **RN-03 (Política de Cancelación):** Un paciente solo puede cancelar una cita si faltan más de 2 horas para la hora programada. Las cancelaciones tardías deben ser manejadas directamente por el administrador o el médico.
* **RN-04 (Acceso a la Videollamada):** El enlace o botón para unirse a la sala de videollamada virtual solo se habilitará para el paciente y el médico 10 minutos antes de la hora programada.
* **RN-05 (Privacidad de Expedientes):** Un médico **solo** tiene autorización para visualizar el expediente clínico de un paciente si existe una cita vinculada entre ambos (sea "Programada" o "Completada").
* **RN-06 (Emisión de Recetas):** El sistema bloqueará la emisión de cualquier receta médica si la consulta no ha sido finalizada y marcada en el sistema con el estado "Completada". No se pueden emitir recetas para citas "Canceladas" o futuras.
