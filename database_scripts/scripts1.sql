insert into cat_genero (descripcion) values ('Femenino')

insert into cat_tipo_duracion (descripcion, requiere_hora) values ('Horario', TRUE)

insert into cat_lugares_iglesia (nombre) values ('Templo')

insert into cat_tipo_recepcion (descripcion) values ('Traslado')

insert into cat_motivo_retiro (descripcion) values ('Fallecimiento')

select * from miembros;

insert into cat_estado_miembro (descripcion) values ('Asociado');

select * from cat_ministerios;
TRUNCATE TABLE actividades cascade;

select * from auditoria_gen

select * from roles;

insert into roles (id_rol, nombre_rol) values (2, 'membresia'); 

in