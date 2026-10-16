CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO usuarios (nombre_usuario, id_rol, password_hash) 
VALUES (
    'joesct', 
    2, -- rol
    crypt('jos123', gen_salt('bf'))
);

select * from auditoria_general;