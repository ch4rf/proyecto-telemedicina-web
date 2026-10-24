const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const registerUser = async (userData) => {
    // 1. Regla: Validar que el correo no exista
    const existingUser = await userRepository.findUserByEmail(userData.correo);
    if (existingUser) {
        throw new Error('El correo ya está en uso');
    }

    // 2. Regla: Encriptar la contraseña (OWASP)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // 3. Mandar a guardar al repositorio
    await userRepository.createUserAndRole({
        ...userData,
        passwordHash
    });

    return { mensaje: 'Usuario registrado con éxito', rol: userData.rol };
};

const loginUser = async (correo, password) => {
    // 1. Regla: Buscar al usuario
    const user = await userRepository.findUserByEmail(correo);
    if (!user) {
        throw new Error('Credenciales inválidas o usuario inactivo');
    }

    // 2. Regla: Comparar hashes
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
        throw new Error('Credenciales inválidas');
    }

    // 3. Regla: Generar el JWT
    const token = jwt.sign(
        { id: user.id_usuario, rol: user.rol },
        process.env.JWT_SECRET || 'super_secreto_para_jwt_123!',
        { expiresIn: '8h' }
    );

    // 4. Obtener datos del perfil según el rol
    const perfil = await userRepository.findUserProfileById(user.id_usuario);

    return { token, rol: user.rol, usuario: perfil };
};

const solicitarRecuperacion = async (correo) => {
    if (!correo) {
        throw new Error('El correo electrónico es requerido');
    }

    const user = await userRepository.findUserByEmail(correo);
    if (!user) {
        throw new Error('No existe una cuenta activa asociada a este correo electrónico');
    }

    // Generar código de verificación de 6 dígitos con vigencia de 15 minutos en PostgreSQL
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    await userRepository.guardarTokenRecuperacion(correo, codigo);

    return {
        ok: true,
        mensaje: 'Código de verificación generado y enviado.',
        codigo_simulado: codigo // Permite validación directa en entorno de pruebas
    };
};

const restablecerPassword = async (correo, codigo, nuevoPassword) => {
    if (!correo || !codigo || !nuevoPassword) {
        throw new Error('Todos los campos son requeridos para restablecer la contraseña');
    }

    if (nuevoPassword.length < 3) {
        throw new Error('La contraseña debe contener al menos 3 caracteres');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(nuevoPassword, salt);

    const actualizado = await userRepository.actualizarPasswordPorToken(correo, codigo, passwordHash);
    if (!actualizado) {
        throw new Error('El código de verificación es inválido o ha expirado');
    }

    return {
        ok: true,
        mensaje: 'Su contraseña ha sido actualizada exitosamente. Ya puede iniciar sesión.'
    };
};

module.exports = { registerUser, loginUser, solicitarRecuperacion, restablecerPassword };
