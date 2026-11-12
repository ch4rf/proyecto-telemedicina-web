# Sistema de Telemedicina NovaSalud - Variante 8

Plataforma web integral de telemedicina e historia clínica digital desarrollada para la **Universidad Mariano Gálvez de Guatemala (Ingeniería en Sistemas - Desarrollo Web y Arquitectura de Computadoras)**.

El sistema conecta en tiempo real a pacientes y médicos especialistas mediante videoconsultas P2P (**WebRTC + Socket.io**), gestión inteligente de agendas según disponibilidad horaria real, expediente clínico inmutable en **PostgreSQL**, prescripción de recetas médicas con descarga directa en **PDF**, vademécum sincronizado con la API oficial **OpenFDA** y autenticación física sin contacto mediante tarjetas **RFID (ESP32 + RC522)** en modo híbrido (**Wi-Fi y Cable USB Web Serial**).

---

## Integrantes del Equipo
1. **Josué Estuardo Caal Tzub**
2. **Daniel Esaú Mejia Garcia**
3. **Luis Enrique Cab Caal**
4. **Adami Ramiro Oliva Martínez**

---

## Arquitectura y Características Principales

* **`/frontend` (React 19 + Vite + Tailwind CSS):**
  * Portales diferenciados para **Paciente** y **Médico** con diseño responsivo clínico (`slate` / `teal`).
  * **Sala de Videollamada en Tiempo Real (`WebRTC` + `Socket.io`):** Transmisión P2P de cámara y micrófono, compartición de pantalla en vivo (`replaceTrack`), chat clínico en tiempo real e indicador de presencia en sala (*"🟢 Esperando en sala"*).
  * **Recetas Médicas en PDF (`RF-16`):** Generación y descarga directa de archivo `.pdf` con notificación automática.
  * **Control de Acceso RFID Híbrido:** Inicio de sesión con tarjeta inteligente y panel de vinculación/bitácora compatible tanto por red **Wi-Fi** como por **Cable USB directo (Web Serial API)**.
* **`/backend` (Node.js + Express + Socket.io):**
  * **Arquitectura en 3 Capas:** Separación estricta en `Controllers`, `Services` y `Repositories`.
  * **Seguridad OWASP Top 10:** Autenticación `JWT`, cifrado `bcrypt`, cabeceras `Helmet`, validación de esquemas y sanitización anti-XSS con `Zod`, y limitador exponencial contra ataques de fuerza bruta.
  * **Integración con API Externa (`OpenFDA`):** Consulta, procesamiento y almacenamiento persistente en PostgreSQL de medicamentos oficiales para autocompletado clínico.
* **`/database` (PostgreSQL 15 en Docker):**
  * Esquema relacional con soporte para tipos `UUID`, `JSONB` (antecedentes clínicos, disponibilidad horaria del médico y detalle de medicamentos), `tarjetas_rfid` y bitácora `accesos_rfid` configurada en zona horaria `America/Guatemala`.
* **`/esp32` (MicroPython para ESP32 + Lector RFID-RC522):**
  * Firmware embebido con soporte dual: transmisión por **Cable USB (Serial)** hacia cualquier navegador Chrome/Edge y envío HTTP por **Wi-Fi** hacia el Backend.

---

## Organización de Ramas de Git y Flujo de Trabajo

El desarrollo se estructuró de forma modular mediante ramas `feature/*` y revisiones por *Pull Request* hacia `main`:

| Rama | Módulo / Funcionalidad Implementada | Requisitos / Reglas |
| :--- | :--- | :--- |
| `main` | Rama principal estable de producción e integración continua. | Base + Merges |
| `feature/cancelacion-citas` | Cancelación de citas médicas con validación de anticipación y registro de autoría. | `RF-09`, `RN-03` |
| `feature/horarios-medicos` | Configuración de días y horarios de atención del médico y validación de agendamiento. | `RF-05`, `RN-01` |
| `feature/seguridad-owasp` | Blindaje **OWASP Top 10**: validadores `Zod`, sanitización XSS, `Helmet` y bloqueo anti-fuerza bruta. | `RNF-03`, `RNF-04`, `RNF-05` |
| `feature/recetas-pdf` | Generador clínico y descarga de recetas médicas digitales en formato PDF. | `RF-15`, `RF-16` |
| `feature/historial-clinico` | Consulta del historial clínico previo del paciente dentro de la sala de videollamada. | `RF-13`, `RN-05` |
| `feature/catalogo-medicamentos` | Vademécum en PostgreSQL sincronizado con API externa **OpenFDA** y autocompletado. | Catálogo Externo + BD |
| `feature/mejoras-equipo` | Descarga directa `.pdf` sin ventana emergente, módulo exclusivo de Catálogo Médico y filtros de agenda. | Mejoras UX |
| `feature/videollamada-realtime` | Videollamada WebRTC P2P en vivo, compartir pantalla, chat clínico y presencia en tiempo real. | `RF-10`, `RF-11`, `RF-12`, `RN-04` |
| `feature/rfid-esp32` | Autenticación y bitácora de acceso con tarjetas **RFID (ESP32 + RC522)** en modo híbrido Wi-Fi + USB. | Arquitectura de Computadoras |
| `feature/ci-cd-azure` | Parametrización de entornos, `Dockerfile`s de producción y pipeline CI/CD con **GitHub Actions**. | `RNF-01`, `RNF-02` |

---

## Instrucciones de Instalación y Ejecución Local

### Prerrequisitos
* **Node.js** (v18 o superior)
* **Docker Desktop** (para levantar PostgreSQL y pgAdmin)

### Paso 1: Levantar la Base de Datos con Docker
Desde la raíz del repositorio, ejecuta:
```bash
docker compose up -d
```
* **`telemedicina_db` (PostgreSQL 15):** Escucha en el puerto `5433` e inicializa automáticamente `database/init.sql`.
* **`telemedicina_pgadmin`:** Disponible en `http://localhost:5050` (Usuario: `admin@telemedicina.com` / Clave: `admin`).

### Paso 2: Configuración y Arranque del Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```
El servidor HTTP + WebSockets (`Socket.io`) iniciará en `http://localhost:4000`.

### Paso 3: Configuración y Arranque del Frontend
```bash
cd frontend
npm install
npm run dev
```
La aplicación web estará disponible en `http://localhost:5173`.

---

## Configuración del Lector Físico RFID (ESP32 + RC522)

El módulo RFID soporta **dos modos de operación simultáneos**:

1. **Modo Cable USB Directo (Sin configurar Wi-Fi ni IPs — Funciona en cualquier PC y en la nube):**
   * Conecta el ESP32 por cable USB a tu computadora.
   * En la pantalla de **Login** o en **Acceso con Tarjeta**, haz clic en el botón **`🔌 Conectar USB`** desde Google Chrome o Microsoft Edge y selecciona el puerto `USB Serial (COM...)`.
   * Al acercar una tarjeta o llavero al lector RC522, el navegador lee el UID directamente por USB e inicia sesión o vincula la tarjeta.
2. **Modo Inalámbrico Wi-Fi:**
   * Edita `esp32/config.py` con el nombre/clave de tu red Wi-Fi (2.4 GHz) y la IP local de tu PC (`ipconfig`).
   * Sube los archivos al ESP32 con MicroPython:
     ```bash
     py -m pip install esptool mpremote
     cd esp32
     py -m mpremote connect auto cp mfrc522.py config.py main.py :
     py -m mpremote connect auto reset
     ```

---

## Cuentas de Acceso Preconfiguradas (Demo)

| Rol | Correo Electrónico | Contraseña | Nombre |
| :--- | :--- | :--- | :--- |
| **Médico** | `estuardo@email.com` | `123` | Dr. Estuardo Caal |
| **Paciente** | `paciente@test.com` | `123` | Juan Pérez |
| **Administrador** | `admin@telemedicina.com` | `admin123` | Administrador Sistema |
