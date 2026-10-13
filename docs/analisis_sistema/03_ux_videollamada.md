# Diseño de Experiencia de Usuario (UX) - Sala de Videollamada
**Proyecto:** Sistema de Telemedicina (Variante 8)

Para garantizar que la adición de la videollamada sea intuitiva y no sature la pantalla del médico (evitando el problema de las "ventanas que se estiran horizontalmente"), hemos definido una estructura de diseño dividida (Split-Screen) para la consulta.

---

## 1. Diseño de Pantalla: Consulta Médica en Vivo (Rol: Médico)

El diseño de la pantalla durante la videollamada utilizará el ancho completo del navegador, pero se dividirá lógicamente en dos columnas principales para evitar que el médico cambie de pestañas.

### Columna Izquierda (Área de Comunicación) - 60% del ancho
Dedicada exclusivamente a la interacción visual con el paciente.
* **Cabecera:** Nombre del paciente, edad y un cronómetro con la duración de la llamada.
* **Centro:** Cuadro de video principal (cámara del paciente).
* **Esquina Inferior:** Cuadro de video miniatura (cámara del médico - Picture in Picture).
* **Controles Flotantes (Abajo):** Botones circulares con iconos universales.
  * Silenciar micrófono.
  * Apagar cámara.
  * Compartir pantalla (útil para mostrar resultados de exámenes).
  * **Finalizar Consulta** (Botón rojo destacado que cierra el video y bloquea la sesión).

### Columna Derecha (Área Clínica y Receta) - 40% del ancho
Un panel lateral fijo que acompaña la llamada sin tapar el video. Evitaremos las ventanas modales (pop-ups) intrusivas.
* **Pestaña 1: Notas de Consulta:** 
  * Un cuadro de texto grande para escribir el "Diagnóstico" en tiempo real mientras el paciente habla.
  * Un cuadro de texto para "Observaciones".
* **Pestaña 2: Receta Médica:**
  * Un pequeño buscador de medicamentos.
  * Al hacer clic en un medicamento, se agrega a una lista debajo con campos cortos: `Dosis`, `Frecuencia` y `Duración`.
  * Botón de "Guardar Receta".
* **Pestaña 3: Historial (Solo lectura):**
  * Una lista desplegable rápida para ver a qué es alérgico el paciente o qué se le recetó en su última cita.

---

## 2. Prevención de Errores UX
* **Error de Acción Prematura:** Si el médico intenta hacer clic en "Emitir Receta" antes de haber llenado el "Diagnóstico", el sistema mostrará un texto de ayuda sutil (no un pop-up gigante) indicando: *"Por favor, complete el diagnóstico primero"*.
* **Cierre Accidental:** Si el médico recarga la página por accidente durante la videollamada, el sistema lo reconectará automáticamente a la sala sin generar un nuevo enlace.
