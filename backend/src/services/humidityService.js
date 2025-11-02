class HumidityService {
  constructor(humidityDAO, alertService, config) {
    this.humidityDAO = humidityDAO;
    this.alertService = alertService;
    this.config = config;
  }

  async saveReadingAndEvaluate({ device_id, timestamp, humidity }) {
    await this.humidityDAO.insertReading({ device_id, timestamp, humidity });

    const threshold = this.config.thresholds?.humidity?.high;

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

}

module.exports = HumidityService;
