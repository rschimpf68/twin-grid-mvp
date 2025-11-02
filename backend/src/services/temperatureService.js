// services/temperatureService.js
// Orquestación de casos de uso de temperatura.
// NO hace SQL directo: delega en TemperatureDAO y AlertService.

class TemperatureService {
  /**
   * @param {import('../dao/temperatureDAO')} temperatureDAO
   * @param {import('./alertService')} alertService
   * @param {object} config
   */
  constructor(temperatureDAO, alertService, config) {
    this.temperatureDAO = temperatureDAO;
    this.alertService = alertService;
    this.config = config;
  }

  async saveReadingAndEvaluate({ device_id, timestamp, temperature }) {
    await this.temperatureDAO.insertReading({ device_id, timestamp, temperature });

    const thresholdHigh = this.config.thresholds?.temperature?.high;
    const thresholdLow = this.config.thresholds?.temperature?.low;

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

}

module.exports = TemperatureService;
