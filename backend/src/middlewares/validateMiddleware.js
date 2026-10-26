const { z } = require('zod');

// Limpieza recursiva contra inyección XSS en cadenas de texto (OWASP A03)
const limpiarXSS = (valor) => {
    if (typeof valor === 'string') {
        return valor
            .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
            .replace(/<\s*\/?\s*(script|iframe|object|embed|svg|on\w+)[^>]*>/gi, '')
            .trim();
    }
    if (Array.isArray(valor)) {
        return valor.map(limpiarXSS);
    }
    if (valor !== null && typeof valor === 'object') {
        const limpio = {};
        for (const [k, v] of Object.entries(valor)) {
            limpio[k] = limpiarXSS(v);
        }
        return limpio;
    }
    return valor;
};

// Esquema Zod para Login
const loginSchema = z.object({
    correo: z.string({ error: 'El correo electrónico es obligatorio' })
        .trim()
        .email({ message: 'El formato del correo electrónico no es válido' }),
    password: z.string({ error: 'La contraseña es obligatoria' })
        .min(1, { message: 'La contraseña no puede estar vacía' })
});

// Esquema Zod para Registro de Usuario
const registroSchema = z.object({
    correo: z.string({ error: 'El correo electrónico es obligatorio' })
        .trim()
        .email({ message: 'Ingresa un correo electrónico válido (ej. usuario@correo.com)' }),
    password: z.string({ error: 'La contraseña es obligatoria' })
        .min(3, { message: 'La contraseña debe tener al menos 3 caracteres' }),
    rol: z.enum(['PACIENTE', 'MEDICO', 'ADMIN'], {
        message: 'El rol seleccionado debe ser PACIENTE o MEDICO'
    }),
    nombres: z.string({ error: 'Los nombres son obligatorios' })
        .trim()
        .min(2, { message: 'El nombre debe contener al menos 2 caracteres' }),
    apellidos: z.string({ error: 'Los apellidos son obligatorios' })
        .trim()
        .min(2, { message: 'El apellido debe contener al menos 2 caracteres' }),
    telefono: z.string().optional().nullable(),
    especialidad: z.string().optional().nullable()
});

// Esquema Zod para Agendamiento de Cita
const agendarCitaSchema = z.object({
    idPaciente: z.string().uuid({ message: 'ID de paciente con formato UUID inválido' }).optional(),
    idMedico: z.string({ error: 'El médico especialista es obligatorio' })
        .uuid({ message: 'ID de médico con formato UUID inválido' }),
    fechaHora: z.string({ error: 'La fecha y hora son obligatorias' })
        .min(10, { message: 'Formato de fecha y hora inválido' })
});

const crearValidador = (schema) => (req, res, next) => {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = limpiarXSS(req.body);
        }
        const resultado = schema.safeParse(req.body);
        if (!resultado.success) {
            const primerError = resultado.error.issues?.[0]?.message || 'Datos de entrada inválidos (Validación OWASP)';
            return res.status(400).json({
                ok: false,
                error: primerError
            });
        }
        next();
    } catch (err) {
        return res.status(400).json({
            ok: false,
            error: 'Error al validar los datos enviados'
        });
    }
};

// Registro en memoria para protección contra Fuerza Bruta con Bloqueo Exponencial (OWASP A07)
// Cada vez que acumula 5 intentos fallidos, el tiempo de espera se duplica (60s -> 120s -> 240s...)
// hasta que inicie sesión exitosamente.
const intentosPorIP = new Map();
const MAX_INTENTOS_FALLIDOS = 5;
const VENTANA_BASE_MS = 60 * 1000; // Base: 60 segundos (1 minuto)

const limitarIntentosAuth = (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'local';
    const ahora = Date.now();
    const registro = intentosPorIP.get(ip);

    if (registro && registro.bloqueadoHasta) {
        if (ahora < registro.bloqueadoHasta) {
            const segundosRestantes = Math.ceil((registro.bloqueadoHasta - ahora) / 1000);
            return res.status(429).json({
                ok: false,
                error: `Seguridad OWASP (Nivel ${registro.nivelBloqueo}): Demasiados intentos fallidos. Intenta de nuevo en ${segundosRestantes} segundos.`
            });
        } else {
            // Ya cumplió el tiempo de espera de esta ronda: se le dan 5 nuevos intentos,
            // pero conservando el nivelBloqueo por si vuelve a fallar los 5 intentos.
            registro.fallos = 0;
            registro.bloqueadoHasta = null;
            intentosPorIP.set(ip, registro);
        }
    }

    // Interceptar el código de estado de la respuesta para contar solo intentos fallidos
    res.on('finish', () => {
        if (res.statusCode >= 400 && res.statusCode !== 429) {
            const actual = intentosPorIP.get(ip) || { fallos: 0, nivelBloqueo: 0, bloqueadoHasta: null };
            const nuevosFallos = actual.fallos + 1;

            if (nuevosFallos >= MAX_INTENTOS_FALLIDOS) {
                const nuevoNivel = actual.nivelBloqueo + 1;
                // Duplicar tiempo en cada ronda fallida: 60s * 2^(nivel - 1) -> 60s, 120s, 240s, 480s...
                const duracionBloqueoMs = VENTANA_BASE_MS * Math.pow(2, nuevoNivel - 1);
                intentosPorIP.set(ip, {
                    fallos: nuevosFallos,
                    nivelBloqueo: nuevoNivel,
                    bloqueadoHasta: Date.now() + duracionBloqueoMs
                });
            } else {
                intentosPorIP.set(ip, {
                    ...actual,
                    fallos: nuevosFallos
                });
            }
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
            // Al iniciar sesión correctamente se limpia todo el historial de bloqueos
            intentosPorIP.delete(ip);
        }
    });

    next();
};

module.exports = {
    limpiarXSS,
    limitarIntentosAuth,
    validarLogin: crearValidador(loginSchema),
    validarRegistro: crearValidador(registroSchema),
    validarAgendarCita: crearValidador(agendarCitaSchema)
};
