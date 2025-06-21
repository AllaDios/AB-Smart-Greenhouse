import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { storage } from "./storage.js";

export interface ArduinoSensorData {
  soilMoisture: number;
  lightLevel: number;
  waterLevel: number;
  pumpStatus: boolean;
  emergencyMode?: boolean;
  temperature?: number;
  humidity?: number;
}

class ArduinoSerialReader {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private isConnected = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private onDataCallback: ((data: ArduinoSensorData) => void) | null = null;

  constructor(
    private portPath: string = "COM5",
    private baudRate: number = 9600,
  ) {}

  async connect(): Promise<void> {
    try {
      console.log(
        `[Arduino] Attempting to connect to ${this.portPath} at ${this.baudRate} baud...`,
      );

      this.port = new SerialPort({
        path: this.portPath,
        baudRate: this.baudRate,
        autoOpen: false,
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));

      await new Promise<void>((resolve, reject) => {
        this.port!.open((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      this.isConnected = true;
      console.log(`[Arduino] Successfully connected to ${this.portPath}`);

      this.setupDataListener();
      this.setupErrorHandlers();
    } catch (error) {
      console.error("[Arduino] Connection failed:", error);
      this.scheduleReconnect();
      throw error;
    }
  }

  private setupDataListener(): void {
    if (!this.parser) return;

    this.parser.on("data", (line: string) => {
      try {
        const data = this.parseArduinoData(line.trim());
        if (data) {
          console.log("[Arduino] Received data:", data);
          this.handleSensorData(data);
        }
      } catch (error) {
        console.error("[Arduino] Error parsing data:", error, "Raw:", line);
      }
    });
  }

  private setupErrorHandlers(): void {
    if (!this.port) return;

    this.port.on("error", (err) => {
      console.error("[Arduino] Port error:", err);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.port.on("close", () => {
      console.log("[Arduino] Port closed");
      this.isConnected = false;
      this.scheduleReconnect();
    });
  }

  private parseArduinoData(line: string): ArduinoSensorData | null {
    try {
      // Formato esperado del Arduino: "SOIL:45,LIGHT:850,WATER:75,PUMP:1"
      // O formato JSON: {"soil":45,"light":850,"water":75,"pump":1}

      if (line.startsWith("{")) {
        // Formato JSON
        const jsonData = JSON.parse(line);
        return {
          soilMoisture: jsonData.soil || jsonData.soilMoisture || 0,
          lightLevel: jsonData.light || jsonData.lightLevel || 0,
          waterLevel: jsonData.water || jsonData.waterLevel || 0,
          pumpStatus: Boolean(jsonData.pump || jsonData.pumpStatus),
          emergencyMode: Boolean(jsonData.emergency || jsonData.emergencyMode),
          temperature: jsonData.temp || jsonData.temperature,
          humidity: jsonData.humid || jsonData.humidity,
        };
      } else {
        // Formato de texto simple
        const parts = line.split(",");
        const data: Partial<ArduinoSensorData> = {};

        parts.forEach((part) => {
          const [key, value] = part.split(":");
          if (key && value !== undefined) {
            switch (key.toUpperCase()) {
              case "SOIL":
              case "SOILMOISTURE":
                data.soilMoisture = parseFloat(value);
                break;
              case "LIGHT":
              case "LIGHTLEVEL":
                data.lightLevel = parseFloat(value);
                break;
              case "WATER":
              case "WATERLEVEL":
                data.waterLevel = parseFloat(value);
                break;
              case "PUMP":
              case "PUMPSTATUS":
                data.pumpStatus =
                  value === "1" || value.toLowerCase() === "true";
                break;
              case "EMERGENCY":
              case "EMERGENCYMODE":
                data.emergencyMode =
                  value === "1" || value.toLowerCase() === "true";
                break;
              case "TEMP":
              case "TEMPERATURE":
                data.temperature = parseFloat(value);
                break;
              case "HUMID":
              case "HUMIDITY":
                data.humidity = parseFloat(value);
                break;
            }
          }
        });

        if (
          data.soilMoisture !== undefined &&
          data.lightLevel !== undefined &&
          data.waterLevel !== undefined &&
          data.pumpStatus !== undefined
        ) {
          return {
            ...data,
            emergencyMode: data.emergencyMode || false
          } as ArduinoSensorData;
        }
      }
    } catch (error) {
      console.error("[Arduino] Parse error:", error);
    }

    return null;
  }

  private async handleSensorData(data: ArduinoSensorData): Promise<void> {
    try {
      // Almacenar datos de sensores en la base de datos
      await storage.insertSensorData({
        temperature: data.temperature || 20 + Math.random() * 10, // Fallback si no hay sensor de temperatura
        humidity: data.humidity || 60 + Math.random() * 20, // Fallback si no hay sensor de humedad
        lightLevel: data.lightLevel,
        soilMoisture: data.soilMoisture,
        waterLevel: data.waterLevel,
      });

      // Actualizar estado de la bomba en los controles del sistema
      const currentControls = await storage.getSystemControls();
      if (currentControls) {
        await storage.updateSystemControls({
          irrigation: data.pumpStatus,
          ventilation: currentControls.ventilation,
          lighting: currentControls.lighting,
          heating: currentControls.heating,
        });
      }

      // Registrar actividad del sistema
      if (data.pumpStatus) {
        await storage.addSystemActivity({
          description: `Bomba de agua ${data.pumpStatus ? "activada" : "desactivada"} automáticamente`,
          details: `Humedad del suelo: ${data.soilMoisture}%`,
          icon: "fas fa-tint",
        });
      }

      // Llamar callback si está configurado
      if (this.onDataCallback) {
        this.onDataCallback(data);
      }
    } catch (error) {
      console.error("[Arduino] Error handling sensor data:", error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    this.reconnectInterval = setTimeout(() => {
      if (!this.isConnected) {
        console.log("[Arduino] Attempting to reconnect...");
        this.connect().catch(() => {
          // Error ya logueado en connect()
        });
      }
    }, 5000); // Intentar reconectar cada 5 segundos
  }

  onData(callback: (data: ArduinoSensorData) => void): void {
    this.onDataCallback = callback;
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.port || !this.isConnected) {
      throw new Error("Arduino not connected");
    }

    return new Promise((resolve, reject) => {
      this.port!.write(command + "\n", (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`[Arduino] Sent command: ${command}`);
          resolve();
        }
      });
    });
  }

  async controlPump(state: boolean): Promise<void> {
    const command = state ? "PUMP_ON" : "PUMP_OFF";
    await this.sendCommand(command);
  }

  async emergencyStop(): Promise<void> {
    await this.sendCommand("EMERGENCY_STOP");
  }

  async clearEmergency(): Promise<void> {
    await this.sendCommand("CLEAR_EMERGENCY");
  }

  isConnectedToArduino(): boolean {
    return this.isConnected;
  }

  async disconnect(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.port && this.isConnected) {
      await new Promise<void>((resolve) => {
        this.port!.close(() => {
          this.isConnected = false;
          console.log("[Arduino] Disconnected");
          resolve();
        });
      });
    }
  }

  // Método para detectar automáticamente puertos disponibles
  static async findArduinoPorts(): Promise<string[]> {
    try {
      const { SerialPort } = await import("serialport");
      const ports = await SerialPort.list();

      // Filtrar puertos que probablemente sean Arduino
      const arduinoPorts = ports.filter(
        (port) =>
          (port.manufacturer && port.manufacturer.toLowerCase().includes("arduino")) ||
          (port.manufacturer && port.manufacturer.toLowerCase().includes("ch340")) ||
          (port.manufacturer && port.manufacturer.toLowerCase().includes("ftdi")) ||
          (port.friendlyName && port.friendlyName.toLowerCase().includes("usb-serial ch340")) ||
          port.path.includes("ttyUSB") ||
          port.path.includes("ttyACM")
      );

      return arduinoPorts.map((port) => port.path);
    } catch (error) {
      console.error("[Arduino] Error listing ports:", error);
      return [];
    }
  }
}

export default ArduinoSerialReader;
