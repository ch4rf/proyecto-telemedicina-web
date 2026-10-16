-- ==========================================
-- MÓDULO: MINISTERIOS
-- ==========================================

CREATE TABLE miembros_ministerios_historial (
    id_historial SERIAL PRIMARY KEY,
    id_miembro INT NOT NULL,
    id_ministerio INT NOT NULL,
    cargo VARCHAR(50),
    fecha_inicio DATE,
    fecha_fin DATE,
    estado_activo BOOLEAN DEFAULT TRUE,
    
    -- Relaciones
    CONSTRAINT fk_mmh_miembros FOREIGN KEY (id_miembro) REFERENCES miembros (id_miembro),
    CONSTRAINT fk_mmh_ministerios FOREIGN KEY (id_ministerio) REFERENCES cat_ministerios (id_ministerio)
);

-- ==========================================
-- MÓDULO: ACTIVIDADES
-- ==========================================

CREATE TABLE actividades (
    id_actividad SERIAL PRIMARY KEY,
    id_ministerio INT,
    id_tipo INT,
    fecha DATE,
    id_tipo_duracion INT,
    hora_inicio TIME,
    hora_fin TIME,
    id_lugar INT,
    id_miembro_anfitrion INT,
    
    -- Relaciones
    CONSTRAINT fk_actividades_ministerios FOREIGN KEY (id_ministerio) REFERENCES cat_ministerios (id_ministerio),
    CONSTRAINT fk_actividades_tipo FOREIGN KEY (id_tipo) REFERENCES cat_tipo_actividad (id_tipo),
    CONSTRAINT fk_actividades_duracion FOREIGN KEY (id_tipo_duracion) REFERENCES cat_tipo_duracion (id_tipo_duracion),
    CONSTRAINT fk_actividades_lugar FOREIGN KEY (id_lugar) REFERENCES cat_lugares_iglesia (id_lugar),
    CONSTRAINT fk_actividades_anfitrion FOREIGN KEY (id_miembro_anfitrion) REFERENCES miembros (id_miembro)
);