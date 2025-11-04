// services/temperatureService.js
// Orquestación de casos de uso de temperatura.
// NO hace SQL directo: delega en TemperatureDAO y AlertService.

class TemperatureService {
  /**
   * @param {import('../dao/temperatureDAO')} temperatureDAO
   * @param {import('./alertService')} alertService
   * @param {object} config
   * @param {import('../websocket/socketServer')} socketServer
   */
  constructor(temperatureDAO, alertService, config, socketServer) {
    this.temperatureDAO = temperatureDAO;
    this.alertService = alertService;
    this.config = config;
    this.socketServer = socketServer;
  }

  async saveReadingAndEvaluate({ device_id, timestamp, temperature }) {
    await this.temperatureDAO.insertReading({ device_id, timestamp, temperature });

    const thresholdHigh = this.config.thresholds?.temperature?.high;
    const thresholdLow = this.config.thresholds?.temperature?.low;

    // Emitir actualización realtime al frontend
    this.socketServer.emitDeviceUpdated({
      device_id,
      temperature,
      timestamp
    });

    if (temperature > thresholdHigh) {
      // Supera el Umbral => Alerta Activa
      await this.alertService.raiseTemperatureAlert({
        device_id,
        value: temperature,
        threshold: thresholdHigh,
        source: 'ingest/temperature',
      });
      return { status: "HIGH_TEMPERATURE", temperature };


    }
    else if (temperature < thresholdLow) {
      await this.alertService.raiseTemperatureAlert({
        device_id,
        value: temperature,
        threshold: thresholdLow,
        source: 'ingest/temperature',
      });
      return { status: "LOW_TEMPERATURE", temperature };
    }
    else {
      // Vuelve a la normalidad => Cerrar alerta activa
      await this.alertService.resolveActiveTemperatureAlert(device_id);
      return { status: "NORMAL", temperature };
    }
  }


  async getLatestByDevice(deviceId, limit) {
    return this.temperatureDAO.getLatestByDevice(deviceId, limit);
  }

  async getLatestOnePerDevice(limit) {
    return this.temperatureDAO.getDevicesLatestOnePerDevice(limit);
  }
  async getDevicesLatestOnePerDevice() {
    return this.temperatureDAO.getLastReadingsPerDevice();
  }

  async getDeviceInfo(deviceId) {
    const [history, stats, current] = await Promise.all([
      this.temperatureDAO.getLatestByDevice(deviceId, 50),
      this.temperatureDAO.getDeviceStats(deviceId),
      this.temperatureDAO.getLatestReading(deviceId)
    ]);

    // Calcular estadísticas de los últimos 50
    const last50Stats = history.length > 0 ? {
      min: Math.min(...history.map(r => r.temperature)),
      max: Math.max(...history.map(r => r.temperature)),
      avg: history.reduce((sum, r) => sum + r.temperature, 0) / history.length
    } : { min: null, max: null, avg: null };

    return {
      history: history.reverse(), // Orden cronológico para gráfico
      last50Stats,
      totalCount: stats ? parseInt(stats.total_count) : 0,
      current: current ? {
        temperature: current.temperature,
        timestamp: current.time
      } : null
    };
  }

}

module.exports = TemperatureService;
