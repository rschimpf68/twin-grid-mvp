class AlertDAO {
   constructor(db) {
      this.db = db;
   }

   async createAlert({ device_id, alert_type, message, threshold_value }) {
      const sql = `
       INSERT INTO alerts (device_id, alert_type, message, threshold_value, created_at, is_active)
       VALUES ($1, $2, $3, $4, NOW(), TRUE)
       RETURNING id;
     `;
      const params = [device_id, alert_type, message, threshold_value];
      const { rows } = await this.db.query(sql, params);
      return rows[0]?.id;
   }

   async resolveAlert(alertId) {
      const sql = `
       UPDATE alerts
       SET is_active = FALSE, resolved_at = NOW()
       WHERE id = $1
       RETURNING id, is_active, resolved_at;
     `;
      const { rows } = await this.db.query(sql, [alertId]);
      return rows[0];
   }

   async getActiveAlerts({ deviceId } = {}) {
      const params = [];
      let where = `WHERE is_active = TRUE`;

      if (deviceId) {
         params.push(deviceId);
         where += ` AND device_id = $${params.length}`;
      }

      const sql = `
       SELECT id, device_id, alert_type, message, threshold_value, created_at
       FROM alerts
       ${where}
       ORDER BY created_at DESC;
     `;
      const { rows } = await this.db.query(sql, params);
      return rows;
   }

   async getHistory({ deviceId, limit = 100, offset = 0 } = {}) {
      const params = [];
      let where = '';
      let paramIndex = 1;

      if (deviceId) {
         params.push(deviceId);
         where = `WHERE device_id = $${paramIndex}`;
         paramIndex++;
      }

      params.push(limit);
      const limitIndex = paramIndex;
      paramIndex++;

      params.push(offset);
      const offsetIndex = paramIndex;

      const sql = `
       SELECT id, device_id, alert_type, message, threshold_value,
              created_at, resolved_at, is_active
       FROM alerts
       ${where}
       ORDER BY created_at DESC
       LIMIT $${limitIndex}
       OFFSET $${offsetIndex};
     `;
      const { rows } = await this.db.query(sql, params);
      return rows;
   }

   async getTotalCount({ deviceId } = {}) {
      const params = [];
      let where = '';

      if (deviceId) {
         params.push(deviceId);
         where = `WHERE device_id = $1`;
      }

      const sql = `
       SELECT COUNT(*) as total
       FROM alerts
       ${where};
     `;
      const { rows } = await this.db.query(sql, params);
      return parseInt(rows[0]?.total || 0);
   }
}

module.exports = AlertDAO;
