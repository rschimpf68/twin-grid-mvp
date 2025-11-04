// index.js (fragmento con DI agregado)
const express = require('express');
const http = require('http');
const cors = require('cors');

// Config & DB (Singletons)
const config = require('./config/config');
const db = require('./database/db');
const socketServer = require('./websocket/socketServer');

// DAOs
const TemperatureDAO = require('./dao/temperatureDAO');
const AlertDAO = require('./dao/alertDAO');
const HumidityDAO = require('./dao/humidityDAO');

// Services (reciben DAOs)
const TemperatureService = require('./services/temperatureService');
const HumidityService = require('./services/humidityService');
const AlertService = require('./services/alertService');

// MQTT Client (exportado como objeto sin auto-conectar)
const StrategyFactory = require('./strategies/StrategyFactory');
const mqttClient = require('./mqtt/mqttClient');


// API Routes (convertimos en función que recibe services)
const createApiRoutes = require('./routes/api');


// Instancias DAO
const temperatureDAO = new TemperatureDAO(db);
const alertDAO = new AlertDAO(db);
const humidityDAO = new HumidityDAO(db);

//  Instancias Services con DI
const alertService = new AlertService(alertDAO, config);
const temperatureService = new TemperatureService(temperatureDAO, alertService, config, socketServer);
const humidityService = new HumidityService(humidityDAO, alertService, config, socketServer);
//  Crear Express App
const app = express();
const httpServer = http.createServer(app);
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
   next();
});



// Routes
app.use('/api', createApiRoutes({ temperatureService, humidityService, alertService }));

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

      socketServer.initialize(httpServer);

      // 2. Conectar al broker MQTT
      console.log('🔍 Iniciando cliente MQTT...');

      const strategyFactory = new StrategyFactory({
         temperatureService,
         humidityService,
         alertService,
         config,
      });
      mqttClient.initialize(strategyFactory);
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
         console.log(`   - Umbrales críticos: ${config.thresholds.humidity.high}% y ${config.thresholds.humidity.low}%`);
         console.log(`   - Umbrales críticos: ${config.thresholds.temperature.high}°C y ${config.thresholds.temperature.low}°C`);
         console.log(`\n✨ Sistema listo. Esperando eventos IoT...\n`);
         console.log(`🔌 WS habilitado en ws://localhost:${config.api.port}`);
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