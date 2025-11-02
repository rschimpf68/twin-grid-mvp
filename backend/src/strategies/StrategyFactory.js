// StrategyFactory.js ✅ PR#3: mejora completa
const TemperatureStrategy = require("./TemperatureStrategy");
const HumidityStrategy = require("./HumidityStrategy");

class StrategyFactory {
   constructor({ temperatureService, humidityService, alertService, config }) {
      /**
       * Cache de estrategias por tipo
       */
      this.strategies = {
         temperature: new TemperatureStrategy({ temperatureService, alertService, config }),
         humidity: new HumidityStrategy({ humidityService, alertService, config }),
      };

      console.log(
         "✅ StrategyFactory inicializada con estrategias:",
         Object.keys(this.strategies).join(", ")
      );
   }

   /**
    * Deducción del tipo de estrategia desde el tópico MQTT
    */
   getSensorTypeFromTopic(topic) {
      if (topic.includes("temperatura")) return "temperature";
      if (topic.includes("humidity")) return "humidity";
      return "unknown";
   }

   /**
    * Retorna la strategy adecuada sin reinstanciar cada vez
    */
   getStrategy(topic) {
      const sensorType = this.getSensorTypeFromTopic(topic);

      if (!this.strategies[sensorType]) {
         console.warn(`⚠ No hay strategy registrada para tipo: ${sensorType} (topic: ${topic})`);
         return null;
      }

      return this.strategies[sensorType];
   }
}

module.exports = StrategyFactory;
