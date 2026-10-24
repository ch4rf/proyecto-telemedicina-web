const userRepository = require('../repositories/userRepository');

class UsuarioService {
    async obtenerPerfil(id_usuario) {
        if (!id_usuario) {
            throw new Error('ID de usuario no proporcionado');
        }
        const perfil = await userRepository.findUserProfileById(id_usuario);
        if (!perfil) {
            throw new Error('Perfil de usuario no encontrado');
        }
        return perfil;
    }

    async actualizarPerfil(id_usuario, datos) {
        if (!id_usuario) {
            throw new Error('ID de usuario no proporcionado');
        }
        return await userRepository.updateUserProfile(id_usuario, datos);
    }
}

module.exports = new UsuarioService();
