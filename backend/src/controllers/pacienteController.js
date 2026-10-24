const pacienteService = require('../services/pacienteService');

const getPerfil = async (req, res) => {
    try {
        const { id } = req.params;
        const perfil = await pacienteService.obtenerPerfil(id);
        res.json(perfil);
    } catch (error) {
        if (error.message === 'Paciente no encontrado') return res.status(404).json({ error: error.message });
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getHistorialCitas = async (req, res) => {
    try {
        const { id } = req.params;
        const citas = await pacienteService.obtenerHistorialCitas(id);
        res.json(citas);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getPacientes = async (req, res) => {
    try {
        const pacientes = await pacienteService.listarPacientes();
        res.json(pacientes);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { getPerfil, getHistorialCitas, getPacientes };
