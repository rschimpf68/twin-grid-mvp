// services/alertService.js
// Orquesta el ciclo de vida de alertas. Delegado de SQL en AlertDAO.

class AlertService {
   /**
    * @param {import('../dao/alertDAO')} alertDAO
    * @param {object} config
    */
   constructor(alertDAO, config) {
      this.alertDAO = alertDAO;
      this.config = config;
   }

   async raiseTemperatureAlert({ device_id, value, threshold, source }) {
      const message = `Temperature ${value} exceeded threshold ${threshold}`;
      const alert_type = 'temperature_threshold';

      const id = await this.alertDAO.createAlert({
         device_id,
         alert_type,
         message,
         threshold_value: threshold,
      });

      return { id, device_id, message };
   }
   async resolveActiveTemperatureAlert(device_id) {
      const activeAlerts = await this.alertDAO.getActiveAlerts({ deviceId: device_id });
      if (activeAlerts.length > 0) {
         const lastAlert = activeAlerts[0]; // La más reciente por orden en DAO
         await this.alertDAO.resolveAlert(lastAlert.id);
         return { resolved: true, alertId: lastAlert.id };
      }
      return { resolved: false };
   }

   async raiseHumidityAlert({ device_id, value, threshold }) {
      const message = `Humidity ${value}% exceeded threshold ${threshold}%`;
      return this.alertDAO.createAlert({
         device_id,
         alert_type: 'humidity_threshold',
         message,
         threshold_value: threshold
      });
   }

   async resolveActiveHumidityAlert(device_id) {
      const activeAlerts = await this.alertDAO.getActiveAlerts({ deviceId: device_id });
      if (activeAlerts.length > 0) {
         const lastAlert = activeAlerts[0];
         await this.alertDAO.resolveAlert(lastAlert.id);
      }
   }



   async resolveAlert(alertId) {
      return this.alertDAO.resolveAlert(alertId);
   }

   async getActiveAlerts(filter = {}) {
      return this.alertDAO.getActiveAlerts(filter);
   }

   async getAlertHistory(filter = {}) {
      return this.alertDAO.getHistory(filter);
   }

   async getAlertsPaginated({ limit = 50, offset = 0, deviceId } = {}) {
      const [alerts, total] = await Promise.all([
         this.alertDAO.getHistory({ deviceId, limit, offset }),
         this.alertDAO.getTotalCount({ deviceId })
      ]);

      return {
         data: alerts,
         pagination: {
            limit,
            offset,
            total,
            hasMore: offset + alerts.length < total
         }
      };
   }
}

module.exports = AlertService;
