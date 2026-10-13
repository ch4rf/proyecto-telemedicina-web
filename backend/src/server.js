require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet()); 
app.use(cors()); 
app.use(express.json());

// Rutas de la aplicación
const authRoutes = require('./routes/authRoutes');
const citaRoutes = require('./routes/citaRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const medicoRoutes = require('./routes/medicoRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/medicos', medicoRoutes);

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

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
