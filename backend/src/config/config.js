require('dotenv').config();

module.exports = {
   database: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
   },
   mqtt: {
      broker: process.env.MQTT_BROKER || "localhost",
      port: Number(process.env.MQTT_PORT) || 1883,
      topic: process.env.MQTT_TOPIC
   },
   api: {
      port: parseInt(process.env.PORT)
   },
   thresholds: {
      temperature: {
         high: parseFloat(process.env.TEMP_THRESHOLD_HIGH),
         low: parseFloat(process.env.TEMP_THRESHOLD_LOW)
      },
      humidity: {
         high: parseFloat(process.env.HUMIDITY_THRESHOLD_HIGH),
         low: parseFloat(process.env.HUMIDITY_THRESHOLD_LOW)
      }
   },
   logDevices: process.env.LOG_DEVICES || false

};