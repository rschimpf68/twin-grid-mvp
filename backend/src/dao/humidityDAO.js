class HumidityDAO {
   constructor(db) {
      this.db = db;
   }

   async insertReading({ device_id, timestamp, humidity }) {
      await this.db.query(
         `INSERT INTO humidity_readings (device_id, time, humidity)
        VALUES ($1, $2, $3);`,
         [device_id, timestamp, humidity]
      );
   }

   async getLatestByDevice(deviceId, limit = 50) {
      const { rows } = await this.db.query(
         `SELECT device_id, time, humidity
        FROM humidity_readings
        WHERE device_id = $1
        ORDER BY time DESC
        LIMIT $2`,
         [deviceId, limit]
      );
      return rows;
   }

   async getDevicesLatestOnePerDevice(limit = 100) {
      const { rows } = await this.db.query(
         `SELECT DISTINCT ON (device_id)
               device_id, time, humidity
        FROM humidity_readings
        ORDER BY device_id, time DESC
        LIMIT $1`,
         [limit]
      );
      return rows;
   }

   async getLastReadingsPerDevice() {
      const sql = `
         SELECT DISTINCT ON (device_id)
            device_id,
            humidity AS value,
            time AS updated_at
         FROM humidity_readings
         ORDER BY device_id, time DESC;
      `;
      const { rows } = await this.db.query(sql);
      return rows;
   }

   async getDeviceStats(deviceId) {
      const sql = `
         SELECT 
            COUNT(*) as total_count,
            MIN(humidity) as min_humidity,
            MAX(humidity) as max_humidity,
            AVG(humidity) as avg_humidity
         FROM humidity_readings
         WHERE device_id = $1;
      `;
      const { rows } = await this.db.query(sql, [deviceId]);
      return rows[0];
   }

   async getLatestReading(deviceId) {
      const sql = `
         SELECT device_id, time, humidity
         FROM humidity_readings
         WHERE device_id = $1
         ORDER BY time DESC
         LIMIT 1;
      `;
      const { rows } = await this.db.query(sql, [deviceId]);
      return rows[0] || null;
   }

}

module.exports = HumidityDAO;
