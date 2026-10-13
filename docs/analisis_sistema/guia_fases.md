# Guía Explicativa del Análisis de Sistemas

Este documento está diseñado para que cualquier persona (técnica o no técnica) pueda entender qué estamos haciendo en cada etapa del diseño de nuestro Sistema de Telemedicina, antes de escribir el código final.

## Fase 1: Ingeniería de Requisitos (El "Qué")
**¿De qué trata?** Es el momento de escribir la carta a Santa Claus, pero con reglas. Aquí definimos exactamente **qué** va a hacer el sistema (Requisitos Funcionales) y **cómo** debe comportarse internamente (Requisitos No Funcionales, como la seguridad o rapidez). No nos importa qué lenguaje de programación usaremos, sino qué problemas vamos a resolver (ej. "El sistema debe permitir hacer videollamadas").

## Fase 2: Casos de Uso y Actores (El "Quién")
**¿De qué trata?** Aquí identificamos quiénes van a usar el sistema (Paciente, Médico, Administrador) y hacemos un mapa de sus acciones. Sirve para responder preguntas como: "¿Puede un paciente borrar una receta?" (Respuesta: No, eso solo lo hace el médico). 

## Fase 3: Flujos de Negocio (El "Viaje")
**¿De qué trata?** Es contar la historia paso a paso. Si un paciente quiere una consulta, escribimos el viaje completo: 1. Inicia sesión -> 2. Busca médico -> 3. Selecciona horario -> 4. Se genera la sala de videollamada -> 5. Se conectan -> 6. Recibe receta. Esto nos ayuda a no olvidar pantallas o botones intermedios.

## Fase 4: Arquitectura Técnica y Despliegue (El "Cómo")
**¿De qué trata?** Aquí los ingenieros deciden las herramientas. Definimos cómo conectaremos las videollamadas (qué proveedor usaremos), cómo protegeremos los datos médicos contra hackers, y cómo haremos que el sistema se publique en internet automáticamente cada vez que los programadores hagan una mejora (CI/CD).

## Fase 5: Refinamiento del Modelo de Datos (El "Almacén")
**¿De qué trata?** Diseñamos los planos del archivero digital (Base de Datos). Definimos en qué "cajón" se guardan los datos de los usuarios, en cuál las citas, y cómo se relacionan entre sí para que la información se encuentre rápido y no se duplique.
