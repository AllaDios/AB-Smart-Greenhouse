# Guía de Integración Arduino - Sistema de Invernadero

## Resumen
Esta guía explica cómo conectar tu Arduino con sensores físicos al dashboard web del invernadero para obtener datos reales en tiempo real.

## Hardware Requerido
- Arduino Uno/Nano/ESP32
- Sensor de humedad de suelo (ej: capacitivo o resistivo)
- Sensor de luz (LDR o sensor digital)
- Sensor de nivel de agua (ultrasónico o float switch)
- Bomba de agua o válvula solenoide
- Relé para controlar la bomba
- Cables y resistencias según sea necesario

## Conexiones Sugeridas
```
Arduino Pin -> Componente
A0          -> Sensor humedad suelo (analógico)
A1          -> Sensor de luz LDR (analógico)
A2          -> Sensor nivel agua (analógico)
D2          -> Relé bomba (digital output)
D3          -> LED indicador estado (opcional)
5V/3.3V     -> Alimentación sensores
GND         -> Tierra común
```

## Código Arduino Ejemplo

```cpp
// Sistema de Monitoreo de Invernadero
// Envía datos por Serial al sistema web

// Pines de sensores
const int SOIL_MOISTURE_PIN = A0;
const int LIGHT_SENSOR_PIN = A1;
const int WATER_LEVEL_PIN = A2;
const int PUMP_RELAY_PIN = 2;
const int STATUS_LED_PIN = 3;

// Variables de estado
bool pumpStatus = false;
unsigned long lastSensorRead = 0;
unsigned long lastDataSend = 0;
const unsigned long SENSOR_INTERVAL = 2000;  // Leer sensores cada 2 segundos
const unsigned long SEND_INTERVAL = 10000;   // Enviar datos cada 10 segundos

void setup() {
  Serial.begin(9600);
  
  // Configurar pines
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  
  // Estado inicial
  digitalWrite(PUMP_RELAY_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, HIGH);
  
  Serial.println("Arduino Greenhouse System Ready");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Leer comandos desde la PC
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    processCommand(command);
  }
  
  // Leer sensores periódicamente
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readSensors();
    lastSensorRead = currentTime;
  }
  
  // Enviar datos periódicamente
  if (currentTime - lastDataSend >= SEND_INTERVAL) {
    sendSensorData();
    lastDataSend = currentTime;
  }
}

void readSensors() {
  // No hacer nada aquí, solo leer cuando se necesite
}

void sendSensorData() {
  // Leer sensores
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  int lightRaw = analogRead(LIGHT_SENSOR_PIN);
  int waterRaw = analogRead(WATER_LEVEL_PIN);
  
  // Convertir a porcentajes y valores útiles
  int soilMoisture = map(soilRaw, 0, 1023, 0, 100);        // 0-100%
  int lightLevel = map(lightRaw, 0, 1023, 0, 1000);        // 0-1000 lux aprox
  int waterLevel = map(waterRaw, 0, 1023, 0, 100);         // 0-100%
  
  // Invertir humedad si es necesario (depende del sensor)
  soilMoisture = constrain(100 - soilMoisture, 0, 100);
  
  // Formato JSON (recomendado)
  Serial.print("{\"soil\":");
  Serial.print(soilMoisture);
  Serial.print(",\"light\":");
  Serial.print(lightLevel);
  Serial.print(",\"water\":");
  Serial.print(waterLevel);
  Serial.print(",\"pump\":");
  Serial.print(pumpStatus ? 1 : 0);
  Serial.println("}");
  
  // Alternativamente, formato texto simple:
  /*
  Serial.print("SOIL:");
  Serial.print(soilMoisture);
  Serial.print(",LIGHT:");
  Serial.print(lightLevel);
  Serial.print(",WATER:");
  Serial.print(waterLevel);
  Serial.print(",PUMP:");
  Serial.println(pumpStatus ? 1 : 0);
  */
}

void processCommand(String command) {
  if (command == "PUMP_ON") {
    activatePump(true);
  } else if (command == "PUMP_OFF") {
    activatePump(false);
  } else if (command == "STATUS") {
    sendSensorData();
  }
}

void activatePump(bool state) {
  pumpStatus = state;
  digitalWrite(PUMP_RELAY_PIN, state ? HIGH : LOW);
  digitalWrite(STATUS_LED_PIN, state ? LOW : HIGH); // Invertir LED cuando bomba activa
  
  Serial.print("PUMP_");
  Serial.println(state ? "ACTIVATED" : "DEACTIVATED");
}
```

## Formatos de Datos Soportados

### Formato JSON (Recomendado)
```json
{"soil":45,"light":850,"water":75,"pump":1}
```

### Formato Texto Simple
```
SOIL:45,LIGHT:850,WATER:75,PUMP:1
```

### Campos Opcionales
Si tienes sensores adicionales, puedes agregar:
```json
{"soil":45,"light":850,"water":75,"pump":1,"temp":24.5,"humid":65}
```

## Configuración del Sistema

1. **Conectar Arduino**: Conecta tu Arduino al puerto USB de la PC
2. **Verificar Puerto**: El sistema busca automáticamente puertos Arduino
3. **Puertos Comunes**:
   - Linux: `/dev/ttyUSB0`, `/dev/ttyACM0`
   - Windows: `COM3`, `COM4`, etc.
   - macOS: `/dev/tty.usbmodem*`

## Calibración de Sensores

### Sensor de Humedad de Suelo
- **Aire libre**: ~0% humedad
- **Agua pura**: ~100% humedad
- **Ajustar**: Modifica el mapeo en el código según tu sensor

### Sensor de Luz (LDR)
- **Oscuridad**: ~0 lux
- **Luz brillante**: ~1000+ lux
- **Ajustar**: Calibra según las condiciones de tu invernadero

### Sensor de Nivel de Agua
- **Tanque vacío**: 0%
- **Tanque lleno**: 100%
- **Ajustar**: Mide distancias reales para mapeo preciso

## Resolución de Problemas

### Arduino No Detectado
1. Verifica conexión USB
2. Instala drivers CH340/FTDI si es necesario
3. Revisa permisos de puerto en Linux: `sudo usermod -a -G dialout $USER`

### Datos Inconsistentes
1. Verifica calibración de sensores
2. Revisa conexiones eléctricas
3. Añade filtrado de ruido en el código

### Bomba No Responde
1. Verifica conexión del relé
2. Revisa alimentación de la bomba
3. Confirma que el relé maneja la corriente necesaria

## Monitoreo y Debug

El sistema registra información en la consola:
```
[Arduino] Available ports: ['/dev/ttyUSB0']
[Arduino] Successfully connected to /dev/ttyUSB0
[Arduino] Received data: {soil: 45, light: 850, water: 75, pump: false}
[Arduino] Pump activated via web interface
```

## Seguridad y Consideraciones

- **Protección eléctrica**: Usa fusibles y protecciones adecuadas
- **Aislamiento**: Mantén electrónicos alejados del agua
- **Respaldo**: El sistema continúa con datos simulados si Arduino se desconecta
- **Monitoreo**: Revisa logs para detectar problemas de comunicación

## Próximos Pasos

Una vez conectado el Arduino:
1. El dashboard mostrará "Conectado" en el estado Arduino
2. Los datos serán reales en lugar de simulados
3. Los controles de la bomba funcionarán directamente
4. Las alertas se basarán en sensores reales