const medicoService = require('../services/medicoService');

const getMedicos = async (req, res) => {
    try {
        const { especialidad } = req.query; // Permite buscar por ?especialidad=Cardiologia
        const medicos = await medicoService.listarMedicos(especialidad);
        res.json(medicos);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getAgenda = async (req, res) => {
    try {
        const { id } = req.params;
        const agenda = await medicoService.obtenerAgenda(id);
        res.json(agenda);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { getMedicos, getAgenda };
