const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'admin_telemedicina',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'password_seguro_123',
  database: process.env.DB_NAME || 'telemedicina_db',
  port: Number(process.env.DB_PORT) || 5433,
});

pool.on('connect', () => {
  console.log('Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Error inesperado en la base de datos', err);
  process.exit(-1);
});

module.exports = pool;
