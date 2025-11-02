import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime
import os

# Configuración MQTT
MQTT_BROKER = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))

# Configuración de sensores
INTERVAL_SECONDS = 5

SENSORS = {
    "sensor_001_temp": {
        "device_id": "sensor_001",
        "topic": "twingrid/temperatura/sucursal01",
        "min": 20.0,
        "max": 45.0,
        "type": "temperature"
    },
    "sensor_002_humidity": {
        "device_id": "sensor_002",
        "topic": "twingrid/humidity/sucursal01",
        "min": 30.0,
        "max": 90.0,
        "type": "humidity"
    }
}

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ Conectado al broker MQTT en {MQTT_BROKER}:{MQTT_PORT}")
    else:
        print(f"❌ Error de conexión: {rc}")

def on_publish(client, userdata, mid):
    print(f"📤 Mensaje publicado (mid: {mid})")

def generate_value(sensor_cfg):
    """Genera valores aleatorios para temperatura o humedad"""
    value = random.uniform(sensor_cfg["min"], sensor_cfg["max"])

    if sensor_cfg["type"] == "temperature" and random.random() < 0.1:
        # 10% de probabilidad de valor crítico de temperatura
        return round(random.uniform(40.0, 45.0), 2)

    return round(value, 2)

def create_payload(sensor_cfg, value):
    return {
        "device_id": sensor_cfg["device_id"],
        "timestamp": datetime.utcnow().isoformat() + "Z",
        sensor_cfg["type"]: value
    }

def main():
    client = mqtt.Client(client_id="simulator_combined")
    client.on_connect = on_connect
    client.on_publish = on_publish

    try:
        print(f"🔌 Conectando a {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()

        print(f"🤖 Simulador iniciado. Publicando cada {INTERVAL_SECONDS}s\n")
        print("Presiona Ctrl+C para detener\n")

        while True:
            for sensor_name, cfg in SENSORS.items():
                value = generate_value(cfg)
                payload = create_payload(cfg, value)

                result = client.publish(
                    cfg["topic"],
                    json.dumps(payload),
                    qos=1
                )

                timestamp = datetime.now().strftime("%H:%M:%S")

                icon = "🔥" if (cfg["type"] == "temperature" and value > 40) else "💧" if cfg["type"] == "humidity" else "✅"

                print(f"[{timestamp}] {icon} {cfg['type'].upper()} {value} → {cfg['topic']}")

            time.sleep(INTERVAL_SECONDS)

    except KeyboardInterrupt:
        print("\n⏹️  Simulador detenido por el usuario")

    except Exception as e:
        print(f"❌ Error: {e}")

    finally:
        client.loop_stop()
        client.disconnect()
        print("👋 Desconectado del broker")

if __name__ == "__main__":
    main()
