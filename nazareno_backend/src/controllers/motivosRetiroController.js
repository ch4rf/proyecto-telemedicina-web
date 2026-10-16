const motivosRetiroService = require('../services/motivosRetiroService');

// GET: Leer motivos de retiro
const obtenerMotivosRetiro = async (req, res) => {
  try {
    const motivos = await motivosRetiroService.listarMotivosRetiro();
    res.status(200).json(motivos);
  } catch (error) {
    console.error('Error al obtener motivos de retiro:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// POST: Crear motivo de retiro
const crearMotivosRetiro = async (req, res) => {
  try {
    const nuevoMotivo = await motivosRetiroService.registrarMotivoRetiro(req.body);
    res.status(201).json({ mensaje: 'Motivo de retiro creado con éxito', data: nuevoMotivo });
  } catch (error) {
    console.error('Error al crear motivo de retiro:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// PUT: Editar motivo de retiro
const editarMotivosRetiro = async (req, res) => {
  try {
    const { id } = req.params;
    const motivoActualizado = await motivosRetiroService.actualizarMotivoRetiro(id, req.body);
    res.status(200).json({ mensaje: 'Motivo de retiro actualizado', data: motivoActualizado });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno del servidor';

    if (!error.status) {
      console.error('Error al editar motivo de retiro:', error);
    }
    res.status(status).json({ mensaje });
  }
};

// DELETE: Borrar motivo de retiro
const eliminarMotivosRetiro = async (req, res) => {
  try {
    const { id } = req.params;
    await motivosRetiroService.eliminarMotivoRetiro(id);
    res.status(200).json({ mensaje: 'Motivo de retiro eliminado con éxito' });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno del servidor';

    if (!error.status) {
      console.error('Error al eliminar motivo de retiro:', error);
    }
    res.status(status).json({ mensaje });
  }
};

module.exports = {
  obtenerMotivosRetiro,
  crearMotivosRetiro,
  editarMotivosRetiro,
  eliminarMotivosRetiro
};