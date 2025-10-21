const db = require('../database/db');

class TemperatureService {
   /**
    * Guarda una lectura de temperatura en la base de datos
    */
   async saveReading(deviceId, temperature, timestamp) {
      const query = `
      INSERT INTO temperature_readings (time, device_id, temperature)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

      try {
         const result = await db.query(query, [timestamp, deviceId, temperature]);
         console.log(`💾 Lectura guardada: ${deviceId} = ${temperature}°C`);
         return result.rows[0];
      } catch (error) {
         console.error('Error guardando lectura:', error);
         throw error;
      }
   }

   /**
    * Obtiene las últimas N lecturas de un dispositivo
    */
   async getLatestReadings(deviceId, limit = 100) {
      const query = `
      SELECT time, device_id, temperature
      FROM temperature_readings
      WHERE device_id = $1
      ORDER BY time DESC
      LIMIT $2
    `;

      const result = await db.query(query, [deviceId, limit]);
      return result.rows;
   }

   /**
    * Obtiene todas las lecturas en un rango de tiempo
    */
   async getReadingsByTimeRange(deviceId, startTime, endTime) {
      const query = `
      SELECT time, device_id, temperature
      FROM temperature_readings
      WHERE device_id = $1 
        AND time >= $2 
        AND time <= $3
      ORDER BY time ASC
    `;

      const result = await db.query(query, [deviceId, startTime, endTime]);
      return result.rows;
   }

   /**
    * Obtiene estadísticas de temperatura
    */
   async getStatistics(deviceId, intervalHours = 24) {
      const query = `
      SELECT 
        device_id,
        COUNT(*) as total_readings,
        AVG(temperature) as avg_temperature,
        MAX(temperature) as max_temperature,
        MIN(temperature) as min_temperature,
        STDDEV(temperature) as std_deviation
      FROM temperature_readings
      WHERE device_id = $1 
        AND time > NOW() - INTERVAL '${intervalHours} hours'
      GROUP BY device_id
    `;

      const result = await db.query(query, [deviceId]);
      return result.rows[0] || null;
   }

   /**
    * Obtiene la última lectura de un dispositivo
    */
   async getLastReading(deviceId) {
      const query = `
      SELECT time, device_id, temperature
      FROM temperature_readings
      WHERE device_id = $1
      ORDER BY time DESC
      LIMIT 1
    `;

      const result = await db.query(query, [deviceId]);
      return result.rows[0] || null;
   }

   /**
    * Lista todos los dispositivos con su última lectura
    */
   async getAllDevicesStatus() {
      const query = `
      SELECT DISTINCT ON (device_id)
        device_id,
        time as last_update,
        temperature as last_temperature
      FROM temperature_readings
      ORDER BY device_id, time DESC
    `;

      const result = await db.query(query);
      return result.rows;
   }
}

module.exports = new TemperatureService();