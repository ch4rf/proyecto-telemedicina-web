const actividadesService = require('../services/actividadesService');

// GET: Cargar todo lo necesario para el formulario
const cargarDatosFormulario = async (req, res) => {
  try {
    const catalogos = await actividadesService.obtenerDatosFormulario();
    res.status(200).json(catalogos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al cargar catálogos de actividades' });
  }
};

// GET: Listar actividades
const listarActividades = async (req, res) => {
  try {
    const actividades = await actividadesService.obtenerActividades();
    res.status(200).json(actividades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al listar actividades' });
  }
};

// POST: Guardar una nueva actividad
const guardarActividad = async (req, res) => {
  try {
    await actividadesService.crearActividad(req.body);
    res.status(201).json({ mensaje: 'Actividad programada con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al guardar la actividad' });
  }
};

// DELETE: Eliminar actividad
const eliminarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    await actividadesService.eliminarActividad(id);
    res.status(200).json({ mensaje: 'Actividad eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar' });
  }
};

// PUT: Actualizar actividad
const actualizarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const actividadActualizada = await actividadesService.actualizarActividad(id, req.body);
    
    if (!actividadActualizada) {
      return res.status(404).json({ mensaje: 'Actividad no encontrada para actualizar' });
    }

    res.status(200).json({ mensaje: 'Actividad actualizada con éxito', data: actividadActualizada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar la actividad' });
  }
};

module.exports = { 
  cargarDatosFormulario, 
  listarActividades, 
  guardarActividad, 
  eliminarActividad,
  actualizarActividad
};