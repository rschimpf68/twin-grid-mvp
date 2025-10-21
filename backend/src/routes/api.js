const express = require('express');
const router = express.Router();
const temperatureService = require('../services/temperatureService');
const alertService = require('../services/alertService');

/**
 * GET /api/health
 * Health check del backend
 */
router.get('/health', (req, res) => {
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
      const devices = await temperatureService.getAllDevicesStatus();
      res.json({
         success: true,
         data: devices,
         count: devices.length
      });
   } catch (error) {
      console.error('Error obteniendo dispositivos:', error);
      res.status(500).json({
         success: false,
         error: 'Error obteniendo dispositivos'
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
});

/**
 * GET /api/devices/:deviceId/latest
 * Obtiene la última lectura de un dispositivo
 */
router.get('/devices/:deviceId/latest', async (req, res) => {
   try {
      const { deviceId } = req.params;
      const reading = await temperatureService.getLastReading(deviceId);

      if (!reading) {
         return res.status(404).json({
            success: false,
            error: 'No se encontraron lecturas para este dispositivo'
         });
      }

      res.json({
         success: true,
         data: reading
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
         alerts = await alertService.getActiveAlerts(deviceId || null);
      } else {
         const alertLimit = limit ? parseInt(limit) : 50;
         alerts = await alertService.getAlertHistory(deviceId || null, alertLimit);
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
      const alerts = await alertService.getActiveAlerts();
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

      const query = `
      UPDATE alerts
      SET is_active = FALSE, resolved_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

      const db = require('../database/db');
      const result = await db.query(query, [alertId]);

      if (result.rowCount === 0) {
         return res.status(404).json({
            success: false,
            error: 'Alerta no encontrada'
         });
      }

      res.json({
         success: true,
         data: result.rows[0],
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

module.exports = router;