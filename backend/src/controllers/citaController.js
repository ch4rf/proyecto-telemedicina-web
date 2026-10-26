const citaService = require('../services/citaService');

const crearCita = async (req, res) => {
    try {
        const idPaciente = req.usuario?.rol === 'PACIENTE' ? req.usuario.id : req.body.idPaciente;
        const { idMedico, fechaHora } = req.body;
        if (!idPaciente || !idMedico || !fechaHora) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: paciente, médico o fecha y hora' });
        }
        const nuevaCita = await citaService.agendarCita({ ...req.body, idPaciente });
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

const getMisCitas = async (req, res) => {
    try {
        const id_usuario = req.usuario.id;
        const rol = req.usuario.rol;
        console.log(`[citaController.getMisCitas] User: ${id_usuario}, Rol: ${rol}`);
        const citas = await citaService.obtenerMisCitas(id_usuario, rol);
        console.log(`[citaController.getMisCitas] Retornando ${citas.length} citas`);
        res.status(200).json({ ok: true, total: citas.length, data: citas });
    } catch (error) {
        console.error('Error al obtener citas:', error.message);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
};

const getDetalleCita = async (req, res) => {
    try {
        const { id } = req.params;
        const id_usuario = req.usuario.id;
        const rol = req.usuario.rol;
        const detalle = await citaService.obtenerDetalleCita(id, id_usuario, rol);
        res.status(200).json({ ok: true, data: detalle });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            return res.status(404).json({ ok: false, error: error.message });
        }
        if (error.message.includes('autorización')) {
            return res.status(403).json({ ok: false, error: error.message });
        }
        console.error('Error al obtener detalle de cita:', error.message);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
};

const cancelarCita = async (req, res) => {
    try {
        const { id } = req.params;
        const id_usuario = req.usuario.id;
        const rol = req.usuario.rol;
        const citaCancelada = await citaService.cancelarCita(id, id_usuario, rol);
        res.status(200).json({
            ok: true,
            mensaje: 'Cita cancelada correctamente',
            data: citaCancelada
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            return res.status(404).json({ ok: false, error: error.message });
        }
        if (error.message.includes('autorización')) {
            return res.status(403).json({ ok: false, error: error.message });
        }
        if (error.message.includes('RN-03') || error.message.includes('estado')) {
            return res.status(400).json({ ok: false, error: error.message });
        }
        console.error('Error al cancelar cita:', error.message);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
};

module.exports = { crearCita, accederVideollamada, getMisCitas, getDetalleCita, cancelarCita };
