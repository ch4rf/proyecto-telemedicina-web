const usuarioService = require('../services/usuarioService');

class UsuarioController {
    async getPerfil(req, res) {
        try {
            const id_usuario = req.usuario.id;
            const perfil = await usuarioService.obtenerPerfil(id_usuario);
            return res.status(200).json({
                ok: true,
                data: perfil
            });
        } catch (error) {
            return res.status(400).json({
                ok: false,
                error: error.message
            });
        }
    }

    async updatePerfil(req, res) {
        try {
            const id_usuario = req.usuario.id;
            const datos = req.body;
            const perfilActualizado = await usuarioService.actualizarPerfil(id_usuario, datos);
            return res.status(200).json({
                ok: true,
                mensaje: 'Perfil actualizado correctamente',
                data: perfilActualizado
            });
        } catch (error) {
            return res.status(400).json({
                ok: false,
                error: error.message
            });
        }
    }
}

module.exports = new UsuarioController();
