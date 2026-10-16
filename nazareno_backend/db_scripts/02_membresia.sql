-- ==========================================
-- MÓDULO: MEMBRESÍA Y HOGARES
-- ==========================================

-- Tabla de Familias
CREATE TABLE familias (
    id_familia SERIAL PRIMARY KEY,
    primer_apellido VARCHAR(50) NOT NULL,
    segundo_apellido VARCHAR(50),
    nombre_familia VARCHAR(100) NOT NULL,
    id_zona INT, 
    calle_avenida VARCHAR(100),
    referencia_casa VARCHAR(200),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_familias_zonas FOREIGN KEY (id_zona) REFERENCES cat_zonas_sectores (id_zona)
);

-- Tabla de Miembros
CREATE TABLE miembros (
    id_miembro SERIAL PRIMARY KEY,
    id_familia INT,
    rol_familiar VARCHAR(50),
    dpi VARCHAR(20),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    id_genero INT,
    fecha_nacimiento DATE,
    id_profesion INT,
    telefono VARCHAR(20),
    correo VARCHAR(100),
    fecha_bautismo DATE,
    fecha_recepcion DATE,
    id_recepcion INT,
    id_estado INT,
    id_motivo_retiro INT,
    fecha_retiro DATE,
    
    -- Relaciones con el núcleo familiar y catálogos
    CONSTRAINT fk_miembros_familias FOREIGN KEY (id_familia) REFERENCES familias (id_familia),
    CONSTRAINT fk_miembros_genero FOREIGN KEY (id_genero) REFERENCES cat_genero (id_genero),
    CONSTRAINT fk_miembros_profesion FOREIGN KEY (id_profesion) REFERENCES cat_profesiones (id_profesion),
    CONSTRAINT fk_miembros_recepcion FOREIGN KEY (id_recepcion) REFERENCES cat_tipo_recepcion (id_recepcion),
    CONSTRAINT fk_miembros_estado FOREIGN KEY (id_estado) REFERENCES cat_estado_miembro (id_estado),
    CONSTRAINT fk_miembros_retiro FOREIGN KEY (id_motivo_retiro) REFERENCES cat_motivo_retiro (id_motivo)
);