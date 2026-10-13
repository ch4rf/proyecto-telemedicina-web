const citaService = require('../services/citaService');

const crearCita = async (req, res) => {
    try {
        const nuevaCita = await citaService.agendarCita(req.body);
        res.status(201).json({ mensaje: 'Cita agendada con éxito', cita: nuevaCita });
    } catch (error) {
        console.error('Error al agendar cita:', error.message);
        
        // Manejar errores conocidos de Reglas de Negocio
        if (error.message.includes('pasadas') || error.message.includes('programada')) {
            return res.status(400).json({ error: error.message });
        }
        
        // Manejar error de base de datos (Ej. UUID inválido)
// ... (código existente) ...
        if (error.message.includes('invalid input syntax for type uuid')) {
            return res.status(400).json({ error: 'ID de paciente o médico con formato inválido' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const accederVideollamada = async (req, res) => {
    try {
        const result = await citaService.obtenerAccesoVideollamada(req.params.id);
        res.json(result);
    } catch (error) {
        if (error.message.includes('aún no está abierta')) return res.status(403).json({ error: error.message });
        if (error.message.includes('no encontrada') || error.message.includes('no está activa')) return res.status(404).json({ error: error.message });
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { crearCita, accederVideollamada };
