const { z } = require("zod");

class HumidityStrategy {
   constructor({ humidityService, alertService, config }) {
      this.humidityService = humidityService;
      this.config = config;

      this.schema = z.object({
         device_id: z.string(),
         timestamp: z.string().datetime(),
         humidity: z.number()
      });
   }

   async process(payload) {
      const data = this.schema.parse(payload);

      await this.humidityService.saveReadingAndEvaluate({
         device_id: data.device_id,
         timestamp: new Date(data.timestamp),
         humidity: data.humidity
      });



      if (this.config && this.config.logDevices !== 'false') {
         console.log(`💧 Humedad procesada: ${data.device_id} = ${data.humidity}%`);
      }
   }
}

module.exports = HumidityStrategy;
