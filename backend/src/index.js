const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const mqttClient = require('./mqtt/mqttClient');
const apiRoutes = require('./routes/api');
const db = require('./database/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
   next();
});

// Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
   res.json({
      service: 'TwinGrid Backend',
      version: '1.0.0',
      status: 'running',
      endpoints: {
         health: '/api/health',
         devices: '/api/devices',
         readings: '/api/devices/:deviceId/readings',
         latest: '/api/devices/:deviceId/latest',
         statistics: '/api/devices/:deviceId/statistics',
         alerts: '/api/alerts',
         activeAlerts: '/api/alerts/active'
      }
   });
});

// 404 handler
app.use((req, res) => {
   res.status(404).json({
      success: false,
      error: 'Endpoint no encontrado'
   });
});

// Error handler
app.use((err, req, res, next) => {
   console.error('Error:', err);
   res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
   });
});

// Iniciar servidor
async function startServer() {
   try {
      // 1. Verificar conexión a la base de datos
      console.log('🔍 Verificando conexión a la base de datos...');
      await db.query('SELECT NOW()');
      console.log('✅ Base de datos conectada\n');

      // 2. Conectar al broker MQTT
      console.log('🔍 Iniciando cliente MQTT...');
      mqttClient.connect();

      // 3. Iniciar servidor Express
      app.listen(config.api.port, () => {
         console.log(`\n🚀 TwinGrid Backend ejecutándose`);
         console.log(`📡 API disponible en: http://localhost:${config.api.port}`);
         console.log(`📊 Dashboard: http://localhost:${config.api.port}`);
         console.log(`\n⚙️  Configuración:`);
         console.log(`   - Base de datos: ${config.database.host}:${config.database.port}/${config.database.database}`);
         console.log(`   - MQTT Broker: ${config.mqtt.broker}:${config.mqtt.port}`);
         console.log(`   - Topic: ${config.mqtt.topic}`);
         console.log(`   - Umbral crítico: ${config.thresholds.high}°C`);
         console.log(`\n✨ Sistema listo. Esperando eventos IoT...\n`);
      });

   } catch (error) {
      console.error('❌ Error iniciando el servidor:', error);
      process.exit(1);
   }
}

// Graceful shutdown
process.on('SIGINT', () => {
   console.log('\n⏹️  Deteniendo servidor...');
   mqttClient.disconnect();
   db.pool.end();
   process.exit(0);
});

// Iniciar
startServer();