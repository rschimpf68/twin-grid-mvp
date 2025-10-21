const mqtt = require('mqtt');
const config = require('../config/config');
const temperatureService = require('../services/temperatureService');
const alertService = require('../services/alertService');

class MQTTClient {
   constructor() {
      this.client = null;
      this.isConnected = false;
   }

   /**
    * Conecta al broker MQTT y se suscribe a los topics
    */
   connect() {
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
      console.log(`\n📩 Mensaje recibido en ${topic}`);

      try {
         // Parsear el JSON
         const payload = JSON.parse(message.toString());
         console.log('📦 Payload:', JSON.stringify(payload, null, 2));

         // Validar estructura del mensaje
         if (!this.validatePayload(payload)) {
            console.error('❌ Payload inválido, ignorando mensaje');
            return;
         }

         const { device_id, timestamp, temperature } = payload;

         // 1. Guardar la lectura en la base de datos
         await temperatureService.saveReading(
            device_id,
            temperature,
            new Date(timestamp)
         );

         // 2. Verificar umbrales y gestionar alertas
         await alertService.checkThresholds(device_id, temperature);

         // 3. Log del procesamiento
         const status = temperature > config.thresholds.high ? '🔥 CRÍTICO' : '✅ Normal';
         console.log(`${status} - ${device_id}: ${temperature}°C\n`);

      } catch (error) {
         if (error instanceof SyntaxError) {
            console.error('❌ Error parseando JSON:', message.toString());
         } else {
            console.error('❌ Error procesando mensaje:', error);
         }
      }
   }

   /**
    * Valida que el payload tenga la estructura esperada
    */
   validatePayload(payload) {
      return (
         payload &&
         typeof payload.device_id === 'string' &&
         typeof payload.timestamp === 'string' &&
         typeof payload.temperature === 'number' &&
         !isNaN(payload.temperature)
      );
   }

   /**
    * Publica un mensaje (útil para comandos futuros)
    */
   publish(topic, message) {
      if (!this.isConnected) {
         console.error('❌ No conectado al broker');
         return;
      }

      this.client.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
         if (err) {
            console.error('❌ Error publicando mensaje:', err);
         } else {
            console.log(`📤 Mensaje publicado en ${topic}`);
         }
      });
   }

   /**
    * Desconecta del broker
    */
   disconnect() {
      if (this.client) {
         this.client.end();
         console.log('👋 Desconectado del broker MQTT');
      }
   }
}

module.exports = new MQTTClient();