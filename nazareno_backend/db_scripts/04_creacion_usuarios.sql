INSERT INTO roles (id_rol, nombre_rol) VALUES (1, 'Administrador') ON CONFLICT (id_rol) DO NOTHING;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO usuarios (nombre_usuario, id_rol, password_hash) 
VALUES (
    'admin', 
    1, -- rol
    crypt('admin123', gen_salt('bf'))
);

