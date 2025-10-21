const db = require('../database/db');
const config = require('../config/config');

class AlertService {
   /**
    * Crea una nueva alerta
    */
   async createAlert(deviceId, alertType, message, thresholdValue, currentValue) {
      const query = `
      INSERT INTO alerts (
        device_id, 
        alert_type, 
        message, 
        threshold_value, 
        current_value,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, TRUE)
      RETURNING *
    `;

      try {
         const result = await db.query(query, [
            deviceId,
            alertType,
            message,
            thresholdValue,
            currentValue
         ]);

         console.log(`⚠️  ALERTA CREADA: ${message}`);
         return result.rows[0];
      } catch (error) {
         console.error('Error creando alerta:', error);
         throw error;
      }
   }

   /**
    * Resuelve (cierra) alertas activas de un dispositivo
    */
   async resolveAlerts(deviceId, alertType) {
      const query = `
      UPDATE alerts
      SET is_active = FALSE, resolved_at = NOW()
      WHERE device_id = $1 
        AND alert_type = $2 
        AND is_active = TRUE
      RETURNING *
    `;

      const result = await db.query(query, [deviceId, alertType]);

      if (result.rowCount > 0) {
         console.log(`✅ Alertas resueltas para ${deviceId} (${alertType})`);
      }

      return result.rows;
   }

   /**
    * Obtiene alertas activas
    */
   async getActiveAlerts(deviceId = null) {
      let query = `
      SELECT * FROM alerts
      WHERE is_active = TRUE
    `;

      const params = [];

      if (deviceId) {
         query += ` AND device_id = $1`;
         params.push(deviceId);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await db.query(query, params);
      return result.rows;
   }

   /**
    * Verifica si una temperatura excede los umbrales y gestiona alertas
    */
   async checkThresholds(deviceId, temperature) {
      const { high, low } = config.thresholds;

      // Temperatura alta
      if (temperature > high) {
         // Verificar si ya existe una alerta activa
         const activeAlerts = await this.getActiveAlerts(deviceId);
         const hasActiveHighAlert = activeAlerts.some(
            alert => alert.alert_type === 'HIGH_TEMPERATURE'
         );

         if (!hasActiveHighAlert) {
            await this.createAlert(
               deviceId,
               'HIGH_TEMPERATURE',
               `Temperatura crítica detectada: ${temperature}°C excede el umbral de ${high}°C`,
               high,
               temperature
            );
         }
      } else {
         // Si la temperatura volvió a la normalidad, resolver alertas
         await this.resolveAlerts(deviceId, 'HIGH_TEMPERATURE');
      }

      // Temperatura baja (opcional, por si quieres detectar congelamiento)
      if (temperature < low) {
         const activeAlerts = await this.getActiveAlerts(deviceId);
         const hasActiveLowAlert = activeAlerts.some(
            alert => alert.alert_type === 'LOW_TEMPERATURE'
         );

         if (!hasActiveLowAlert) {
            await this.createAlert(
               deviceId,
               'LOW_TEMPERATURE',
               `Temperatura muy baja detectada: ${temperature}°C por debajo de ${low}°C`,
               low,
               temperature
            );
         }
      } else {
         await this.resolveAlerts(deviceId, 'LOW_TEMPERATURE');
      }
   }

   /**
    * Obtiene historial de alertas
    */
   async getAlertHistory(deviceId = null, limit = 50) {
      let query = `
      SELECT * FROM alerts
    `;

      const params = [];

      if (deviceId) {
         query += ` WHERE device_id = $1`;
         params.push(deviceId);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await db.query(query, params);
      return result.rows;
   }
}

module.exports = new AlertService();