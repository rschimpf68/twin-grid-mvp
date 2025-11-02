const express = require('express');
const { Router } = express;

/**
 * Crea las rutas de la API con inyección de dependencias
 * @param {Object} dependencies - Dependencias inyectadas
 * @param {Object} dependencies.temperatureService - Servicio de temperatura
 * @param {Object} dependencies.alertService - Servicio de alertas
 */
module.exports = ({ temperatureService, humidityService, alertService }) => {
   const router = Router();

   /**
    * GET /api/health
    * Health check del backend
    */
   router.get('/health', (req, res) => {
      console.log('Health check');
      res.json({
         status: 'ok',
         timestamp: new Date().toISOString(),
         service: 'TwinGrid Backend'
      });
   });

   /**
    * GET /api/devices
    * Lista todos los dispositivos con su última lectura
    */

   router.get('/devices', async (req, res) => {


      try {
         console.log('🧪 Before temp query');
         const temps = await temperatureService.getDevicesLatestOnePerDevice();


         const hums = await humidityService.getDevicesLatestOnePerDevice();


         const map = new Map();

         temps.forEach(d => {
            map.set(d.device_id, {
               device_id: d.device_id,
               temperature: Number(d.value),
               updated_at: d.updated_at,
            });
         });

         hums.forEach(d => {
            if (!map.has(d.device_id)) {
               map.set(d.device_id, {
                  device_id: d.device_id,
                  updated_at: d.updated_at,
               });
            }
            map.get(d.device_id).humidity = Number(d.value);
         });

         const devices = Array.from(map.values());

         res.json({
            success: true,
            data: devices,
            count: devices.length
         });

      } catch (e) {
         console.error("Error /devices:", e);
         res.status(500).json({
            success: false,
            error: "Error obteniendo ja dispositivos",
            errorDetails: e.message
         });
      }
   });


   /**
    * GET /api/devices/:deviceId/readings
    * Obtiene las lecturas de un dispositivo específico
    * Query params:
    *   - limit: número de lecturas (default 100)
    *   - startTime: fecha inicio (ISO 8601)
    *   - endTime: fecha fin (ISO 8601)
    */
   router.get('/devices/:deviceId/readings', async (req, res) => {
      try {
         const { deviceId } = req.params;
         const { limit, startTime, endTime } = req.query;

         let readings;

         if (startTime && endTime) {
            // Rango de tiempo específico
            readings = await temperatureService.getReadingsByTimeRange(
               deviceId,
               new Date(startTime),
               new Date(endTime)
            );
         } else {
            // Últimas N lecturas
            const readingLimit = limit ? parseInt(limit) : 100;
            readings = await temperatureService.getLatestReadings(deviceId, readingLimit);
         }

         res.json({
            success: true,
            data: readings,
            count: readings.length
         });
      } catch (error) {
         console.error('Error obteniendo lecturas:', error);
         res.status(500).json({
            success: false,
            error: 'Error obteniendo lecturas'
         });
      }
   });/**
   * GET /api/devices/:deviceId/temperature/readings
   */
   router.get('/devices/:deviceId/temperature/readings', async (req, res) => {
      try {
         const { deviceId } = req.params;
         const limit = req.query.limit ? parseInt(req.query.limit) : 100;

         const readings = await temperatureService.getLatestReadings(deviceId, limit);

         return res.json({
            success: true,
            data: readings,
            count: readings.length
         });

      } catch (error) {
         console.error('Error obteniendo lecturas de temperatura:', error);
         res.status(500).json({
            success: false,
            error: 'Error obteniendo lecturas de temperatura'
         });
      }
   });


   /**
    * GET /api/devices/:deviceId/humidity/readings
    */
   router.get('/devices/:deviceId/humidity/readings', async (req, res) => {
      try {
         const { deviceId } = req.params;
         const limit = req.query.limit ? parseInt(req.query.limit) : 100;

         const readings = await humidityService.getLatestByDevice(deviceId, limit);

         return res.json({
            success: true,
            data: readings,
            count: readings.length
         });

      } catch (error) {
         console.error('Error obteniendo lecturas de humedad:', error);
         res.status(500).json({
            success: false,
            error: 'Error obteniendo lecturas de humedad'
         });
      }
   });


   /**
    * GET /api/devices/:deviceId/latest
    * Obtiene la última lectura de un dispositivo
    */
   router.get('/devices/:deviceId/latest', async (req, res) => {
      try {
         const { deviceId } = req.params;

         const temp = await temperatureService.getLastReading(deviceId);
         const hum = await humidityService.getLatestByDevice(deviceId, 1);

         if (!temp && (!hum || hum.length === 0)) {
            return res.status(404).json({
               success: false,
               error: 'No se encontraron lecturas para este dispositivo'
            });
         }

         res.json({
            success: true,
            data: {
               device_id: deviceId,
               temperature: temp?.temperature,
               humidity: hum?.[0]?.humidity,
               timestamp: temp?.time ?? hum?.[0]?.time
            }
         });

      } catch (error) {
         console.error('Error obteniendo última lectura:', error);
         res.status(500).json({
            success: false,
            error: 'Error obteniendo última lectura'
         });
      }
   });


   /**
    * GET /api/devices/:deviceId/statistics
    * Obtiene estadísticas de temperatura
    * Query params:
    *   - hours: intervalo en horas (default 24)
    */
   router.get('/devices/:deviceId/statistics', async (req, res) => {
      try {
         const { deviceId } = req.params;
         const hours = req.query.hours ? parseInt(req.query.hours) : 24;

         const stats = await temperatureService.getStatistics(deviceId, hours);

         if (!stats) {
            return res.status(404).json({
               success: false,
               error: 'No hay datos suficientes para calcular estadísticas'
            });
         }

         res.json({
            success: true,
            data: {
               ...stats,
               interval_hours: hours
            }
         });
      } catch (error) {
         console.error('Error obteniendo estadísticas:', error);
         res.status(500).json({
            success: false,
            error: 'Error obteniendo estadísticas'
         });
      }
   });

   /**
    * GET /api/alerts
    * Obtiene alertas
    * Query params:
    *   - deviceId: filtrar por dispositivo
    *   - active: true/false para filtrar solo activas
    *   - limit: número de alertas (default 50)
    */
   router.get('/alerts', async (req, res) => {
      try {
         const { deviceId, active, limit } = req.query;

         let alerts;

         if (active === 'true') {
            alerts = await alertService.getActiveAlerts(
               deviceId ? { deviceId } : {}
            );
         } else {
            const alertLimit = limit ? parseInt(limit) : 50;
            alerts = await alertService.getAlertHistory({
               deviceId: deviceId || undefined,
               limit: alertLimit
            });
         }

         res.json({
            success: true,
            data: alerts,
            count: alerts.length
         });
      } catch (error) {
         console.error('Error obteniendo alertas:', error);
         res.status(500).json({
            success: false,
            error: 'Error obteniendo alertas'
         });
      }
   });

   /**
    * GET /api/alerts/active
    * Obtiene solo las alertas activas (atajo)
    */
   router.get('/alerts/active', async (req, res) => {
      try {
         const alerts = await alertService.getActiveAlerts({});
         res.json({
            success: true,
            data: alerts,
            count: alerts.length
         });
      } catch (error) {
         console.error('Error obteniendo alertas activas:', error);
         res.status(500).json({
            success: false,
            error: 'Error obteniendo alertas activas'
         });
      }
   });

   /**
    * POST /api/alerts/:alertId/resolve
    * Marca una alerta como resuelta manualmente
    */
   router.post('/alerts/:alertId/resolve', async (req, res) => {
      try {
         const { alertId } = req.params;
         const resolvedAlert = await alertService.resolveAlert(alertId);

         if (!resolvedAlert) {
            return res.status(404).json({
               success: false,
               error: 'Alerta no encontrada'
            });
         }

         res.json({
            success: true,
            data: resolvedAlert,
            message: 'Alerta resuelta exitosamente'
         });
      } catch (error) {
         console.error('Error resolviendo alerta:', error);
         res.status(500).json({
            success: false,
            error: 'Error resolviendo alerta'
         });
      }
   });

   return router;
};