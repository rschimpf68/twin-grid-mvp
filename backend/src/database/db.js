const { Pool } = require('pg');
const config = require('../config/config');

// Pool de conexiones a PostgreSQL/TimescaleDB
const pool = new Pool(config.database);

// Test de conexión al iniciar
pool.on('connect', () => {
   console.log('✅ Conectado a TimescaleDB');
});

pool.on('error', (err) => {
   console.error('❌ Error en la conexión a la base de datos:', err);
   process.exit(-1);
});

module.exports = {
   query: (text, params) => pool.query(text, params),
   pool
};