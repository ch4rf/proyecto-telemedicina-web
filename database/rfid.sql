-- Tablas del lector RFID (ESP32 + RC522)
-- NO es obligatorio correr este archivo: el backend las crea solo la primera vez.
-- Se deja como referencia. No modifica ninguna tabla existente.

CREATE TABLE IF NOT EXISTS tarjetas_rfid (
    uid_tarjeta VARCHAR(20) PRIMARY KEY,
    id_usuario UUID NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accesos_rfid (
    id_acceso SERIAL PRIMARY KEY,
    uid_tarjeta VARCHAR(20) NOT NULL,
    id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    resultado VARCHAR(20) NOT NULL, -- PERMITIDO, DENEGADO o REGISTRO
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
