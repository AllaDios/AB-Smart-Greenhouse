import {
  sensorData,
  systemControls,
  irrigationSchedules,
  systemAlerts,
  systemActivity,
  systemConfig,
  type SensorData,
  type SystemControls,
  type IrrigationSchedule,
  type SystemAlert,
  type SystemActivity,
  type SystemConfig,
  type InsertSensorData,
  type InsertSystemControls,
  type InsertIrrigationSchedule,
  type InsertSystemAlert,
  type InsertSystemActivity,
  type InsertSystemConfig,
} from "@shared/schema";

export interface IStorage {
  // Sensor data
  getLatestSensorData(): Promise<SensorData | undefined>;
  getSensorDataHistory(hours: number): Promise<SensorData[]>;
  insertSensorData(data: InsertSensorData): Promise<SensorData>;

  // System controls
  getSystemControls(): Promise<SystemControls | undefined>;
  updateSystemControls(controls: InsertSystemControls): Promise<SystemControls>;

  // Irrigation schedules
  getIrrigationSchedules(): Promise<IrrigationSchedule[]>;
  createIrrigationSchedule(schedule: InsertIrrigationSchedule): Promise<IrrigationSchedule>;
  updateIrrigationSchedule(id: number, schedule: Partial<InsertIrrigationSchedule>): Promise<IrrigationSchedule>;
  deleteIrrigationSchedule(id: number): Promise<void>;

  // System alerts
  getSystemAlerts(): Promise<SystemAlert[]>;
  createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert>;
  markAlertAsRead(id: number): Promise<void>;
  deleteAlert(id: number): Promise<void>;

  // System activity
  getRecentActivity(limit: number): Promise<SystemActivity[]>;
  addSystemActivity(activity: InsertSystemActivity): Promise<SystemActivity>;

  // System config
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
}

export class MemStorage implements IStorage {
  private sensorDataStore: Map<number, SensorData>;
  private systemControlsStore: Map<number, SystemControls>;
  private irrigationSchedulesStore: Map<number, IrrigationSchedule>;
  private systemAlertsStore: Map<number, SystemAlert>;
  private systemActivityStore: Map<number, SystemActivity>;
  private systemConfigStore: Map<string, SystemConfig>;
  private currentId: number;

  constructor() {
    this.sensorDataStore = new Map();
    this.systemControlsStore = new Map();
    this.irrigationSchedulesStore = new Map();
    this.systemAlertsStore = new Map();
    this.systemActivityStore = new Map();
    this.systemConfigStore = new Map();
    this.currentId = 1;

    // Initialize with default system controls
    const defaultControls: SystemControls = {
      id: 1,
      irrigation: false,
      ventilation: true,
      lighting: false,
      heating: false,
      lastUpdated: new Date(),
    };
    this.systemControlsStore.set(1, defaultControls);

    // Initialize with sample data for demonstration
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample sensor data
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      const sensorReading: SensorData = {
        id: this.currentId++,
        temperature: 20 + Math.random() * 8,
        humidity: 60 + Math.random() * 20,
        lightLevel: i > 6 && i < 19 ? 400 + Math.random() * 600 : Math.random() * 100,
        soilMoisture: 40 + Math.random() * 30,
        timestamp,
      };
      this.sensorDataStore.set(sensorReading.id, sensorReading);
    }

    // Sample irrigation schedules
    const schedules: IrrigationSchedule[] = [
      {
        id: this.currentId++,
        name: "Riego Principal",
        time: "06:00",
        duration: 15,
        isActive: true,
        isAutomatic: false,
        conditions: null,
        createdAt: new Date(),
      },
      {
        id: this.currentId++,
        name: "Riego Vespertino",
        time: "18:00",
        duration: 10,
        isActive: true,
        isAutomatic: false,
        conditions: null,
        createdAt: new Date(),
      },
      {
        id: this.currentId++,
        name: "Riego de Emergencia",
        time: "00:00",
        duration: 5,
        isActive: true,
        isAutomatic: true,
        conditions: { soilMoisture: { min: 30 } },
        createdAt: new Date(),
      },
    ];
    schedules.forEach(schedule => this.irrigationSchedulesStore.set(schedule.id, schedule));

    // Sample alerts
    const alerts: SystemAlert[] = [
      {
        id: this.currentId++,
        title: "Humedad del suelo baja",
        message: "La humedad del suelo está por debajo del 50%. Se recomienda activar el riego.",
        type: "warning",
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: this.currentId++,
        title: "Mantenimiento programado",
        message: "Limpieza de sensores programada para mañana a las 08:00 AM.",
        type: "info",
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ];
    alerts.forEach(alert => this.systemAlertsStore.set(alert.id, alert));

    // Sample activity
    const activities: SystemActivity[] = [
      {
        id: this.currentId++,
        description: "Sistema de riego activado automáticamente",
        details: "Duración: 15 minutos • Trigger: Humedad del suelo < 45%",
        icon: "fas fa-shower",
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        id: this.currentId++,
        description: "Temperatura máxima registrada",
        details: "26.8°C a las 13:45 • Dentro del rango óptimo",
        icon: "fas fa-thermometer-half",
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
      },
      {
        id: this.currentId++,
        description: "Sistema de ventilación activado",
        details: "Temperatura superior a 25°C • Ventilación automática",
        icon: "fas fa-fan",
        createdAt: new Date(Date.now() - 90 * 60 * 1000),
      },
      {
        id: this.currentId++,
        description: "Configuración actualizada",
        details: "Umbrales de humedad modificados por el usuario admin",
        icon: "fas fa-cog",
        createdAt: new Date(Date.now() - 105 * 60 * 1000),
      },
    ];
    activities.forEach(activity => this.systemActivityStore.set(activity.id, activity));
  }

  async getLatestSensorData(): Promise<SensorData | undefined> {
    const values = Array.from(this.sensorDataStore.values());
    return values.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  async getSensorDataHistory(hours: number): Promise<SensorData[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.sensorDataStore.values())
      .filter(data => data.timestamp >= cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async insertSensorData(data: InsertSensorData): Promise<SensorData> {
    const id = this.currentId++;
    const sensorReading: SensorData = {
      ...data,
      id,
      timestamp: new Date(),
    };
    this.sensorDataStore.set(id, sensorReading);
    return sensorReading;
  }

  async getSystemControls(): Promise<SystemControls | undefined> {
    return this.systemControlsStore.get(1);
  }

  async updateSystemControls(controls: InsertSystemControls): Promise<SystemControls> {
    const updated: SystemControls = {
      id: 1,
      ...controls,
      lastUpdated: new Date(),
    };
    this.systemControlsStore.set(1, updated);
    return updated;
  }

  async getIrrigationSchedules(): Promise<IrrigationSchedule[]> {
    return Array.from(this.irrigationSchedulesStore.values())
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  async createIrrigationSchedule(schedule: InsertIrrigationSchedule): Promise<IrrigationSchedule> {
    const id = this.currentId++;
    const newSchedule: IrrigationSchedule = {
      ...schedule,
      id,
      createdAt: new Date(),
    };
    this.irrigationSchedulesStore.set(id, newSchedule);
    return newSchedule;
  }

  async updateIrrigationSchedule(id: number, schedule: Partial<InsertIrrigationSchedule>): Promise<IrrigationSchedule> {
    const existing = this.irrigationSchedulesStore.get(id);
    if (!existing) {
      throw new Error('Schedule not found');
    }
    const updated: IrrigationSchedule = {
      ...existing,
      ...schedule,
    };
    this.irrigationSchedulesStore.set(id, updated);
    return updated;
  }

  async deleteIrrigationSchedule(id: number): Promise<void> {
    this.irrigationSchedulesStore.delete(id);
  }

  async getSystemAlerts(): Promise<SystemAlert[]> {
    return Array.from(this.systemAlertsStore.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert> {
    const id = this.currentId++;
    const newAlert: SystemAlert = {
      ...alert,
      id,
      createdAt: new Date(),
    };
    this.systemAlertsStore.set(id, newAlert);
    return newAlert;
  }

  async markAlertAsRead(id: number): Promise<void> {
    const alert = this.systemAlertsStore.get(id);
    if (alert) {
      alert.isRead = true;
      this.systemAlertsStore.set(id, alert);
    }
  }

  async deleteAlert(id: number): Promise<void> {
    this.systemAlertsStore.delete(id);
  }

  async getRecentActivity(limit: number): Promise<SystemActivity[]> {
    return Array.from(this.systemActivityStore.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async addSystemActivity(activity: InsertSystemActivity): Promise<SystemActivity> {
    const id = this.currentId++;
    const newActivity: SystemActivity = {
      ...activity,
      id,
      createdAt: new Date(),
    };
    this.systemActivityStore.set(id, newActivity);
    return newActivity;
  }

  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    return this.systemConfigStore.get(key);
  }

  async setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const updated: SystemConfig = {
      id: this.currentId++,
      ...config,
      updatedAt: new Date(),
    };
    this.systemConfigStore.set(config.key, updated);
    return updated;
  }
}

export const storage = new MemStorage();
