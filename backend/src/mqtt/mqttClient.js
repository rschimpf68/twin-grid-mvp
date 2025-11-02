const mqtt = require('mqtt');
const config = require('../config/config');


class MQTTClient {
   constructor() {
      if (MQTTClient.instance) {
         return MQTTClient.instance;
      }

      this.client = null;
      this.isConnected = false;
      this.strategyFactory = null;

      MQTTClient.instance = this;
      return this;
   }

   initialize(strategyFactory) {
      this.strategyFactory = strategyFactory;
      console.log('🧠 StrategyFactory configurada en MQTTClient');
   }

   /**
    * Conecta al broker MQTT y se suscribe a los topics
    */
   connect() {
      if (this.isConnected && this.client) {
         console.log('⚠️ Ya existe una conexión activa MQTT, ignorando connect()...');
         return;
      }
      const brokerUrl = `${config.mqtt.broker}:${config.mqtt.port}`;

      console.log(`🔌 Conectando a broker MQTT: ${brokerUrl}`);

      this.client = mqtt.connect(brokerUrl, {
         clientId: `twingrid_backend_${Math.random().toString(16).slice(3)}`,
         clean: true,
         reconnectPeriod: 1000,
      });

      // Evento: Conexión exitosa
      this.client.on('connect', () => {
         console.log('✅ Conectado al broker MQTT');
         this.isConnected = true;

         // Suscribirse a los topics
         this.client.subscribe(config.mqtt.topic, (err) => {
            if (err) {
               console.error('❌ Error suscribiéndose al topic:', err);
            } else {
               console.log(`📡 Suscrito a: ${config.mqtt.topic}`);
            }
         });
      });

      // Evento: Mensaje recibido
      this.client.on('message', async (topic, message) => {
         try {
            await this.handleMessage(topic, message);
         } catch (error) {
            console.error('❌ Error procesando mensaje:', error);
         }
      });

      // Evento: Error
      this.client.on('error', (error) => {
         console.error('❌ Error MQTT:', error);
      });

      // Evento: Desconexión
      this.client.on('close', () => {
         console.log('⚠️  Desconectado del broker MQTT');
         this.isConnected = false;
      });

      // Evento: Reconexión
      this.client.on('reconnect', () => {
         console.log('🔄 Reconectando al broker MQTT...');
      });
   }

   /**
    * Procesa un mensaje recibido del broker
    */
   async handleMessage(topic, message) {
      try {
         const payload = JSON.parse(message.toString());

         if (!this.strategyFactory) {
            console.error("❌ mqttClient no inicializado con StrategyFactory");
            return;
         }

         const strategy = this.strategyFactory.getStrategy(topic);
         if (!strategy) return;

         await strategy.process(payload);

      } catch (err) {
         console.error("❌ Error al procesar MQTT:", err);
         console.log("Mensaje bruto:", message.toString());
      }
   }


   /**
    * Publica un mensaje
    */
   publish(topic, message) {
      if (!this.isConnected) {
         console.error('❌ No conectado al broker');
         return;
      }
      this.client.publish(topic, JSON.stringify(message), { qos: 1 });
   }

   /**
    * Desconecta del broker
    */
   disconnect() {
      if (this.client) {
         this.client.end();
         this.isConnected = false;
         console.log('👋 Desconectado del broker MQTT');
      }
   }

   static getInstance() {
      if (!MQTTClient.instance) {
         MQTTClient.instance = new MQTTClient();
      }
      return MQTTClient.instance;
   }
}

module.exports = MQTTClient.getInstance();