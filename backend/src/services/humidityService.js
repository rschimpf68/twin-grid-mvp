class HumidityService {
  constructor(humidityDAO, alertService, config, socketServer) {
    this.humidityDAO = humidityDAO;
    this.alertService = alertService;
    this.config = config;
    this.socketServer = socketServer;
  }

  async saveReadingAndEvaluate({ device_id, timestamp, humidity }) {
    await this.humidityDAO.insertReading({ device_id, timestamp, humidity });

    const threshold = this.config.thresholds?.humidity?.high;
    // Emitir actualización realtime al frontend
    this.socketServer.emitDeviceUpdated({
      device_id,
      humidity,
      timestamp
    });

    if (humidity > threshold) {
      await this.alertService.raiseHumidityAlert({
        device_id,
        value: humidity,
        threshold,
      });

      return { status: "HIGH_HUMIDITY", humidity };
    }
    else if (humidity < this.config.thresholds?.humidity?.low) {
      await this.alertService.raiseHumidityAlert({
        device_id,
        value: humidity,
        threshold: this.config.thresholds?.humidity?.low,
      });
      return { status: "LOW_HUMIDITY", humidity };
    }
    else {
      await this.alertService.resolveActiveHumidityAlert(device_id);
      return { status: "NORMAL", humidity };
    }
  }


  async getLatestByDevice(deviceId, limit) {
    return this.humidityDAO.getLatestByDevice(deviceId, limit);
  }

  async getDevicesLatestOnePerDevice(limit) {
    return this.humidityDAO.getDevicesLatestOnePerDevice(limit);
  }
  async getDevicesLatestOnePerDevice() {
    return this.humidityDAO.getLastReadingsPerDevice();
  }

  async getDeviceInfo(deviceId) {
    const [history, stats, current] = await Promise.all([
      this.humidityDAO.getLatestByDevice(deviceId, 50),
      this.humidityDAO.getDeviceStats(deviceId),
      this.humidityDAO.getLatestReading(deviceId)
    ]);

    // Calcular estadísticas de los últimos 50
    const last50Stats = history.length > 0 ? {
      min: Math.min(...history.map(r => r.humidity)),
      max: Math.max(...history.map(r => r.humidity)),
      avg: history.reduce((sum, r) => sum + r.humidity, 0) / history.length
    } : { min: null, max: null, avg: null };

    return {
      history: history.reverse(), // Orden cronológico para gráfico
      last50Stats,
      totalCount: stats ? parseInt(stats.total_count) : 0,
      current: current ? {
        humidity: current.humidity,
        timestamp: current.time
      } : null
    };
  }

}

module.exports = HumidityService;
