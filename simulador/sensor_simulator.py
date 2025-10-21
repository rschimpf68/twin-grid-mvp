import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

# Configuración MQTT
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "twingrid/temperatura/sucursal01"

# Configuración del sensor
DEVICE_ID = "sensor_001"
INTERVAL_SECONDS = 5

# Rango de temperatura simulada (puedes ajustarlo)
TEMP_MIN = 20.0
TEMP_MAX = 45.0

def on_connect(client, userdata, flags, rc):
    """Callback cuando se conecta al broker"""
    if rc == 0:
        print(f"✅ Conectado al broker MQTT en {MQTT_BROKER}:{MQTT_PORT}")
    else:
        print(f"❌ Error de conexión: {rc}")

def on_publish(client, userdata, mid):
    """Callback cuando se publica un mensaje"""
    print(f"📤 Mensaje publicado (mid: {mid})")

def generate_temperature():
    """
    Genera una temperatura simulada con variación realista.
    Simula cambios graduales y ocasionalmente picos.
    """
    base_temp = random.uniform(TEMP_MIN, TEMP_MAX)
    
    # 10% de probabilidad de generar un valor crítico (>40°C)
    if random.random() < 0.1:
        return round(random.uniform(40.0, 45.0), 2)
    
    return round(base_temp, 2)

def create_payload(temperature):
    """Crea el payload JSON según el formato del documento"""
    return {
        "device_id": DEVICE_ID,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "temperature": temperature
    }

def main():
    # Crear cliente MQTT
    client = mqtt.Client(client_id=f"simulator_{DEVICE_ID}")
    
    # Configurar callbacks
    client.on_connect = on_connect
    client.on_publish = on_publish
    
    try:
        # Conectar al broker
        print(f"🔌 Conectando a {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        
        # Iniciar loop en segundo plano
        client.loop_start()
        
        print(f"🌡️  Simulador iniciado. Publicando cada {INTERVAL_SECONDS}s")
        print(f"📡 Topic: {MQTT_TOPIC}")
        print("Presiona Ctrl+C para detener\n")
        
        # Loop principal
        while True:
            # Generar lectura
            temperature = generate_temperature()
            payload = create_payload(temperature)
            
            # Publicar al broker
            result = client.publish(
                MQTT_TOPIC,
                json.dumps(payload),
                qos=1  # Quality of Service nivel 1 (al menos una vez)
            )
            
            # Mostrar en consola
            timestamp = datetime.now().strftime("%H:%M:%S")
            status = "🔥" if temperature > 40 else "✅"
            print(f"[{timestamp}] {status} {temperature}°C → {MQTT_TOPIC}")
            
            # Esperar antes de la siguiente lectura
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