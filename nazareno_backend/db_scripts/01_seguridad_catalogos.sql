-- ==========================================
-- MÓDULO: SEGURIDAD Y AUDITORÍA
-- ==========================================

CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    id_rol INT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol) REFERENCES roles (id_rol)
);

CREATE TABLE auditoria_general (
    id_auditoria SERIAL PRIMARY KEY,
    nombre_tabla VARCHAR(100) NOT NULL,
    id_registro INT NOT NULL,
    accion VARCHAR(20) NOT NULL,
    usuario_accion VARCHAR(50) NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- MÓDULO: CATÁLOGOS LOCALES
-- ==========================================

CREATE TABLE cat_zonas_sectores (
    id_zona SERIAL PRIMARY KEY,
    nombre_zona VARCHAR(100) NOT NULL
);

CREATE TABLE cat_estado_miembro (
    id_estado SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

CREATE TABLE cat_genero (
    id_genero SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

CREATE TABLE cat_lugares_iglesia (
    id_lugar SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    requiere_anfitrion BOOLEAN DEFAULT FALSE
);

CREATE TABLE cat_ministerios (
    id_ministerio SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE cat_motivo_retiro (
    id_motivo SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

CREATE TABLE cat_profesiones (
    id_profesion SERIAL PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE cat_tipo_actividad (
    id_tipo SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

CREATE TABLE cat_tipo_duracion (
    id_tipo_duracion SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL,
    requiere_hora BOOLEAN DEFAULT FALSE
);

CREATE TABLE cat_tipo_recepcion (
    id_recepcion SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);