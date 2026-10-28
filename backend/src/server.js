require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const configurarVideollamadaSocket = require('./socket/videollamadaSocket');
const pool = require('./config/db');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Configuración de Socket.io para señalización WebRTC y sala de videollamada (Tarea 8.1.1)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.set('io', io);
configurarVideollamadaSocket(io);

app.use(helmet()); 
app.use(cors()); 
app.use(express.json());

// Middleware de trazabilidad de peticiones HTTP
app.use((req, res, next) => {
  const auth = req.headers['authorization'] ? 'TOKEN PRESENTE' : 'SIN TOKEN';
  console.log(`[HTTP ${req.method}] ${req.url} - ${auth}`);
  next();
});

// Rutas de la aplicación
const authRoutes = require('./routes/authRoutes');
const citaRoutes = require('./routes/citaRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const medicoRoutes = require('./routes/medicoRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const busquedaRoutes = require('./routes/busquedaRoutes');
const consultaRoutes = require('./routes/consultaRoutes');
const statsRoutes = require('./routes/statsRoutes');
require('./repositories/medicamentoRepository');

app.use('/api/auth', authRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/buscar', busquedaRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/dashboard', statsRoutes);

// Ruta de prueba para verificar conexión
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS hora_actual');
    res.json({
      estado: 'OK',
      mensaje: 'Servidor y BD funcionando correctamente',
      hora_db: result.rows[0].hora_actual
    });
  } catch (error) {
    console.error('Detalle del error DB:', error);
    res.status(500).json({ error: 'Error al conectar con la base de datos', detalle: error.message });
  }
});

// Arrancar servidor HTTP + WebSockets
server.listen(PORT, () => {
  console.log(`Servidor HTTP y WebSockets (Socket.io) corriendo en http://localhost:${PORT}`);
});
