require('dotenv').config();

module.exports = {
   database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
   },
   mqtt: {
      broker: process.env.MQTT_BROKER,
      port: parseInt(process.env.MQTT_PORT),
      topic: process.env.MQTT_TOPIC
   },
   api: {
      port: parseInt(process.env.PORT)
   },
   thresholds: {
      high: parseFloat(process.env.TEMP_THRESHOLD_HIGH),
      low: parseFloat(process.env.TEMP_THRESHOLD_LOW)
   }
};