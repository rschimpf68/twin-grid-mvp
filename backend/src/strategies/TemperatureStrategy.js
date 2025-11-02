// src/strategies/TemperatureStrategy.js
const { z } = require("zod");

class TemperatureStrategy {
   constructor({ temperatureService, alertService, config }) {
      this.temperatureService = temperatureService;
      this.alertService = alertService;
      this.config = config;


      this.schema = z.object({
         device_id: z.string(),
         timestamp: z.string().datetime(), // ISO8601
         temperature: z.number(),
      });
   }

   async process(payload) {
      const data = this.schema.parse(payload);

      await this.temperatureService.saveReadingAndEvaluate({
         device_id: data.device_id,
         timestamp: new Date(data.timestamp),
         temperature: data.temperature,
      });
      if (this.config && this.config.logDevices !== 'false') {
         console.log(`🌡 Procesado: ${data.device_id} = ${data.temperature}°C`);
      }
   }
}

module.exports = TemperatureStrategy;
