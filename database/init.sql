-- ==============================================================================
-- Script de inicialización de Base de Datos - Sistema de Telemedicina
-- Motor: PostgreSQL
-- ==============================================================================

-- Habilitar la extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: Usuarios
CREATE TABLE usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correo VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('PACIENTE', 'MEDICO', 'ADMIN')),
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    token_recuperacion VARCHAR(255),
    expiracion_token TIMESTAMP
);

-- 2. Tabla: Pacientes
CREATE TABLE pacientes (
    id_paciente UUID PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    -- datos_clinicos expected JSON format: {"alergias": ["Penicilina"], "tipo_sangre": "O+", "antecedentes": "Hipertensión"}
    datos_clinicos JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla: Medicos
CREATE TABLE medicos (
    id_medico UUID PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    -- disponibilidad expected JSON format: [{"dia": "Lunes", "hora_inicio": "08:00", "hora_fin": "12:00"}]
    disponibilidad JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla: Citas
CREATE TABLE citas (
    id_cita UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_paciente UUID NOT NULL REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    id_medico UUID NOT NULL REFERENCES medicos(id_medico) ON DELETE CASCADE,
    fecha_hora TIMESTAMP NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA' CHECK (estado IN ('PROGRAMADA', 'COMPLETADA', 'CANCELADA')),
    cancelado_por VARCHAR(20),
    url_videollamada VARCHAR(255),
    enlace_generado_en TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla: Consultas
CREATE TABLE consultas (
    id_consulta UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cita UUID UNIQUE NOT NULL REFERENCES citas(id_cita) ON DELETE RESTRICT,
    diagnostico TEXT NOT NULL,
    notas_clinicas TEXT,
    duracion_minutos INT,
    fecha_atencion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla: Recetas
CREATE TABLE recetas (
    id_receta UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_consulta UUID NOT NULL REFERENCES consultas(id_consulta) ON DELETE CASCADE,
    -- medicamentos expected JSON format: [{"nombre": "Paracetamol 500mg", "dosis": "1 pastilla", "frecuencia": "Cada 8 horas", "duracion": "3 días"}]
    medicamentos JSONB NOT NULL DEFAULT '[]'::JSONB,
    indicaciones_generales TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla: Notificaciones
CREATE TABLE notificaciones (
    id_notificacion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'INFO' CHECK (tipo IN ('INFO', 'RECORDATORIO', 'RECETA', 'CITA', 'ALERTA')),
    leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla: Catalogo de Medicamentos (Fuente Externa / OpenFDA)
CREATE TABLE IF NOT EXISTS catalogo_medicamentos (
    id_medicamento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_comercial VARCHAR(200) UNIQUE NOT NULL,
    principio_activo VARCHAR(200) NOT NULL,
    presentacion VARCHAR(150),
    dosis_recomendada VARCHAR(150),
    frecuencia_recomendada VARCHAR(150),
    duracion_recomendada VARCHAR(100),
    fuente VARCHAR(50) DEFAULT 'OpenFDA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
