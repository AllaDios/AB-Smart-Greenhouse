const int relayPin = 3;        // Pin para el relé
const int sensorHumPin = A1;   // Pin para el sensor de humedad (higrómetro)
const int waterLevelPin = A0;  // Pin para el sensor de nivel de agua
const int sensorLuzPin = A2;   // Pin para el sensor de luz (LDR)

// --- CALIBRACIÓN DE SENSORES ---
// Nivel de agua: ajusta estos valores según tu sensor
const int WATER_LEVEL_EMPTY = 0;    // Valor analógico con tanque vacío
const int WATER_LEVEL_FULL = 600;   // Valor analógico con tanque lleno (estimado)

// Humedad del suelo: los valores se invierten, más alto es MÁS SECO.
const int SOIL_MOISTURE_DRY = 950;  // Valor analógico con tierra seca
const int SOIL_MOISTURE_WET = 400;  // Valor analógico con tierra húmeda

// Número de muestras a promediar para estabilizar la lectura
const int NUM_SAMPLES = 15;

int sensorHumValue = 0;         // Variable para el valor del higrómetro
int waterLevelValue = 0;        // Variable para el valor del nivel de agua
int sensorLuzValue = 0;         // Variable para el valor del sensor de luz
int thresholdHumidity = 40;     // UMBRAL EN PORCENTAJE (%): Regar si la humedad es MENOR a este valor.
int thresholdWaterLevel = 300;  // Umbral para el nivel de agua (valor crudo)

bool pumpStatus = false;        // Estado de la bomba
bool manualControl = false;     // Control manual desde la web
bool emergencyMode = false;     // Modo de emergencia activo

void setup() {
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW);  // Apagar la bomba por defecto

  Serial.begin(9600);  // Iniciar la comunicación serial
  Serial.println("Arduino Greenhouse System Ready");
}

// Función para obtener una lectura estabilizada de un sensor
int getSmoothedReading(int pin) {
  long total = 0;
  for (int i = 0; i < NUM_SAMPLES; i++) {
    total += analogRead(pin);
    delay(10); // Pequeña pausa entre lecturas
  }
  return total / NUM_SAMPLES;
}

void loop() {
  // Leer comandos desde la PC
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    processCommand(command);
  }

  // Leer sensores usando el filtro de suavizado
  sensorHumValue = getSmoothedReading(sensorHumPin);
  waterLevelValue = getSmoothedReading(waterLevelPin);
  sensorLuzValue = getSmoothedReading(sensorLuzPin);

  // Mapear la humedad a un porcentaje (0-100)
  long soilPercent = map(sensorHumValue, SOIL_MOISTURE_DRY, SOIL_MOISTURE_WET, 0, 100);
  soilPercent = constrain(soilPercent, 0, 100);

  // Control automático SOLO si NO está en emergencia y NO hay control manual
  if (!emergencyMode && !manualControl) {
    // Control de la bomba basado en el nivel de agua y humedad
    if (waterLevelValue > thresholdWaterLevel) {
      if (soilPercent < thresholdHumidity) { // Ahora se compara con el umbral en %
        pumpStatus = true;  // Enciende la bomba
      } else {
        pumpStatus = false;  // Apaga la bomba si el suelo está húmedo
      }
    } else {
      pumpStatus = false;  // Apaga la bomba si el nivel de agua es bajo
    }
  }
  
  // En modo de emergencia, FORZAR bomba apagada
  if (emergencyMode) {
    pumpStatus = false;
    digitalWrite(relayPin, LOW);  // Forzar apagado físico
  } else {
    // Aplicar el estado de la bomba solo si NO está en emergencia
    digitalWrite(relayPin, pumpStatus ? HIGH : LOW);
  }

  // Enviar los datos en el formato esperado por el backend
  Serial.print("SOIL:");
  Serial.print(soilPercent);  // Humedad del suelo como porcentaje
  Serial.print(",LIGHT:");
  Serial.print(sensorLuzValue);  // Valor de luz
  
  // Mapear el valor del agua a un porcentaje y restringirlo entre 0 y 100
  long waterPercent = map(waterLevelValue, WATER_LEVEL_EMPTY, WATER_LEVEL_FULL, 0, 100);
  waterPercent = constrain(waterPercent, 0, 100); // Forzar a que esté entre 0 y 100
  
  Serial.print(",WATER:");
  Serial.print(waterPercent);  // Nivel de agua como porcentaje
  Serial.print(",PUMP:");
  Serial.print(pumpStatus ? 1 : 0);  // Estado de la bomba (1=ON, 0=OFF)
  Serial.print(",EMERGENCY:");
  Serial.print(emergencyMode ? 1 : 0);  // Estado de emergencia
  Serial.println();  // Nueva línea para terminar la transmisión de datos

  delay(2000);  // Espera 2 segundos antes de la siguiente lectura
}

void processCommand(String command) {
  if (command == "PUMP_ON") {
    if (!emergencyMode) {
      pumpStatus = true;
      manualControl = true;  // Activar control manual
      Serial.println("PUMP_ACTIVATED");
    } else {
      Serial.println("PUMP_BLOCKED_EMERGENCY_MODE");
    }
  } 
  else if (command == "PUMP_OFF") {
    pumpStatus = false;
    manualControl = true;  // Activar control manual
    Serial.println("PUMP_DEACTIVATED");
  }
  else if (command == "EMERGENCY_STOP") {
    emergencyMode = true;
    pumpStatus = false;
    manualControl = true;  // Mantener control manual
    digitalWrite(relayPin, LOW);  // Forzar apagado inmediato
    Serial.println("EMERGENCY_STOP_ACTIVATED");
  }
  else if (command == "CLEAR_EMERGENCY") {
    emergencyMode = false;
    manualControl = false;  // Volver al control automático
    pumpStatus = false;     // Asegurar que la bomba esté apagada al salir de emergencia
    Serial.println("EMERGENCY_MODE_CLEARED");
  }
  else if (command == "AUTO_MODE") {
    if (!emergencyMode) {
      manualControl = false;  // Volver al control automático
      Serial.println("AUTO_MODE_ACTIVATED");
    } else {
      Serial.println("AUTO_MODE_BLOCKED_EMERGENCY");
    }
  }
  else if (command == "STATUS") {
    // Enviar estado actual inmediatamente
    long currentSoilPercent = map(sensorHumValue, SOIL_MOISTURE_DRY, SOIL_MOISTURE_WET, 0, 100);
    currentSoilPercent = constrain(currentSoilPercent, 0, 100);
    Serial.print("SOIL:");
    Serial.print(currentSoilPercent);
    Serial.print(",LIGHT:");
    Serial.print(sensorLuzValue);
    Serial.print(",WATER:");
    long currentWaterPercent = map(waterLevelValue, WATER_LEVEL_EMPTY, WATER_LEVEL_FULL, 0, 100);
    currentWaterPercent = constrain(currentWaterPercent, 0, 100);
    Serial.print(currentWaterPercent);
    Serial.print(",PUMP:");
    Serial.print(pumpStatus ? 1 : 0);
    Serial.print(",EMERGENCY:");
    Serial.println(emergencyMode ? 1 : 0);
  }
} 