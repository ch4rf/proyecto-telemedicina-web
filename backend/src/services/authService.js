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
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    return { token, rol: user.rol };
};

module.exports = { registerUser, loginUser };
