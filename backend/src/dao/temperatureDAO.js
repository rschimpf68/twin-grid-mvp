// dao/temperatureDAO.js
class TemperatureDAO {
   constructor(db) {
      this.db = db;
   }

   async insertReading({ device_id, timestamp, temperature }) {
      const sql = `
        INSERT INTO temperature_readings (device_id, time, temperature)
        VALUES ($1, $2, $3);
      `;
      const params = [device_id, timestamp, temperature];
      await this.db.query(sql, params);
      return true; // ✅ confirmación mínima
   }

   async getLatestByDevice(deviceId, limit = 50) {
      const sql = `
       SELECT device_id, time, temperature
       FROM temperature_readings
       WHERE device_id = $1
       ORDER BY time DESC
       LIMIT $2;
     `;
      const { rows } = await this.db.query(sql, [deviceId, limit]);
      return rows;
   }

   async getDevicesLatestOnePerDevice(limit = 100) {
      const sql = `
       SELECT DISTINCT ON (device_id)
              device_id, time, temperature
       FROM temperature_readings
       ORDER BY device_id, time DESC
       LIMIT $1;
     `;
      const { rows } = await this.db.query(sql, [limit]);
      return rows;
   }


   async getLastReadingsPerDevice() {
      const sql = `
         SELECT DISTINCT ON (device_id)
            device_id,
            temperature AS value,
            time AS updated_at
         FROM temperature_readings
         ORDER BY device_id, time DESC;
      `;
      const { rows } = await this.db.query(sql);
      return rows;
   }

}

module.exports = TemperatureDAO;
