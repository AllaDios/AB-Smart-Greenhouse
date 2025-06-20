import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import ArduinoSerialReader from "./arduino-serial";
import {
  insertSensorDataSchema,
  insertSystemControlsSchema,
  insertIrrigationScheduleSchema,
  insertSystemAlertSchema,
  insertSystemActivitySchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time data
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients
  const clients = new Set<WebSocket>();

  // Initialize Arduino Serial Reader
  let arduinoReader: ArduinoSerialReader | null = null;
  let isArduinoConnected = false;

  // Attempt to connect to Arduino
  try {
    const availablePorts = await ArduinoSerialReader.findArduinoPorts();
    console.log('[Arduino] Available ports:', availablePorts);
    
    if (availablePorts.length > 0) {
      arduinoReader = new ArduinoSerialReader(availablePorts[0]);
      await arduinoReader.connect();
      isArduinoConnected = true;
      
      // Setup callback for Arduino data
      arduinoReader.onData((data) => {
        console.log('[Arduino] Broadcasting data to WebSocket clients:', data);
        broadcast({ type: 'arduino-data', data });
      });
      
      console.log('[Arduino] Connected successfully, using real sensor data');
    } else {
      console.log('[Arduino] No Arduino ports found, using simulated data');
    }
  } catch (error) {
    console.error('[Arduino] Failed to connect:', error);
    console.log('[Arduino] Continuing with simulated data');
  }

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');
    
    // Send Arduino status to new client
    ws.send(JSON.stringify({ 
      type: 'arduino-status', 
      connected: isArduinoConnected 
    }));

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast to all connected clients
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Sensor data endpoints
  app.get('/api/sensor-data/latest', async (req, res) => {
    try {
      const data = await storage.getLatestSensorData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch sensor data' });
    }
  });

  app.get('/api/sensor-data/history', async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const data = await storage.getSensorDataHistory(hours);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch sensor history' });
    }
  });

  app.post('/api/sensor-data', async (req, res) => {
    try {
      const validatedData = insertSensorDataSchema.parse(req.body);
      const data = await storage.insertSensorData(validatedData);
      
      // Broadcast new sensor data to connected clients
      broadcast({ type: 'sensor-data', data });
      
      // Check for alerts based on new data
      await checkAndCreateAlerts(data);
      
      res.json(data);
    } catch (error) {
      res.status(400).json({ message: 'Invalid sensor data' });
    }
  });

  // System controls endpoints
  app.get('/api/system-controls', async (req, res) => {
    try {
      const controls = await storage.getSystemControls();
      res.json(controls);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch system controls' });
    }
  });

  app.put('/api/system-controls', async (req, res) => {
    try {
      const validatedData = insertSystemControlsSchema.parse(req.body);
      const controls = await storage.updateSystemControls(validatedData);
      
      // Add activity log
      await storage.addSystemActivity({
        description: "Configuración del sistema actualizada",
        details: `Controles modificados: ${Object.keys(validatedData).join(', ')}`,
        icon: "fas fa-cog",
      });
      
      // Broadcast control changes
      broadcast({ type: 'system-controls', data: controls });
      
      res.json(controls);
    } catch (error) {
      res.status(400).json({ message: 'Invalid control data' });
    }
  });

  // Irrigation schedule endpoints
  app.get('/api/irrigation-schedules', async (req, res) => {
    try {
      const schedules = await storage.getIrrigationSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch irrigation schedules' });
    }
  });

  app.post('/api/irrigation-schedules', async (req, res) => {
    try {
      const validatedData = insertIrrigationScheduleSchema.parse(req.body);
      const schedule = await storage.createIrrigationSchedule(validatedData);
      
      await storage.addSystemActivity({
        description: "Nuevo programa de riego creado",
        details: `${schedule.name} programado para las ${schedule.time}`,
        icon: "fas fa-shower",
      });
      
      broadcast({ type: 'irrigation-schedule-created', data: schedule });
      
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: 'Invalid schedule data' });
    }
  });

  app.put('/api/irrigation-schedules/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertIrrigationScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateIrrigationSchedule(id, validatedData);
      
      await storage.addSystemActivity({
        description: "Programa de riego actualizado",
        details: `${schedule.name} modificado`,
        icon: "fas fa-edit",
      });
      
      broadcast({ type: 'irrigation-schedule-updated', data: schedule });
      
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update schedule' });
    }
  });

  app.delete('/api/irrigation-schedules/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteIrrigationSchedule(id);
      
      await storage.addSystemActivity({
        description: "Programa de riego eliminado",
        details: `Programa ID ${id} eliminado`,
        icon: "fas fa-trash",
      });
      
      broadcast({ type: 'irrigation-schedule-deleted', data: { id } });
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: 'Failed to delete schedule' });
    }
  });

  // System alerts endpoints
  app.get('/api/system-alerts', async (req, res) => {
    try {
      const alerts = await storage.getSystemAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });

  app.post('/api/system-alerts', async (req, res) => {
    try {
      const validatedData = insertSystemAlertSchema.parse(req.body);
      const alert = await storage.createSystemAlert(validatedData);
      
      broadcast({ type: 'new-alert', data: alert });
      
      res.json(alert);
    } catch (error) {
      res.status(400).json({ message: 'Invalid alert data' });
    }
  });

  app.put('/api/system-alerts/:id/read', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markAlertAsRead(id);
      
      broadcast({ type: 'alert-read', data: { id } });
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: 'Failed to mark alert as read' });
    }
  });

  app.delete('/api/system-alerts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAlert(id);
      
      broadcast({ type: 'alert-deleted', data: { id } });
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: 'Failed to delete alert' });
    }
  });

  // System activity endpoints
  app.get('/api/system-activity', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch activity' });
    }
  });

  // Manual control actions
  app.post('/api/actions/irrigate', async (req, res) => {
    try {
      const { duration = 5 } = req.body;
      
      // Update irrigation control
      const controls = await storage.getSystemControls();
      if (controls) {
        await storage.updateSystemControls({ ...controls, irrigation: true });
      }
      
      // Add activity
      await storage.addSystemActivity({
        description: "Riego manual activado",
        details: `Duración programada: ${duration} minutos`,
        icon: "fas fa-shower",
      });
      
      // Simulate irrigation duration
      setTimeout(async () => {
        const currentControls = await storage.getSystemControls();
        if (currentControls) {
          await storage.updateSystemControls({ ...currentControls, irrigation: false });
          broadcast({ type: 'system-controls', data: await storage.getSystemControls() });
        }
      }, duration * 60 * 1000);
      
      broadcast({ type: 'system-controls', data: await storage.getSystemControls() });
      
      res.json({ success: true, message: `Irrigation started for ${duration} minutes` });
    } catch (error) {
      res.status(500).json({ message: 'Failed to start irrigation' });
    }
  });

  app.post('/api/actions/emergency-stop', async (req, res) => {
    try {
      // Turn off all systems
      await storage.updateSystemControls({
        irrigation: false,
        ventilation: false,
        lighting: false,
        heating: false,
      });
      
      await storage.addSystemActivity({
        description: "Parada de emergencia activada",
        details: "Todos los sistemas desactivados por seguridad",
        icon: "fas fa-stop-circle",
      });
      
      await storage.createSystemAlert({
        title: "Parada de emergencia",
        message: "Todos los sistemas han sido desactivados. Revise el estado del invernadero.",
        type: "error",
        isRead: false,
      });
      
      broadcast({ type: 'emergency-stop', data: await storage.getSystemControls() });
      
      res.json({ success: true, message: 'Emergency stop activated' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to execute emergency stop' });
    }
  });

  // Helper function to check for alerts based on sensor data
  async function checkAndCreateAlerts(sensorData: any) {
    const alerts = [];
    
    if (sensorData.soilMoisture < 30) {
      alerts.push({
        title: "Humedad del suelo crítica",
        message: `La humedad del suelo es de ${sensorData.soilMoisture.toFixed(1)}%. Se requiere riego inmediato.`,
        type: "error",
        isRead: false,
      });
    } else if (sensorData.soilMoisture < 50) {
      alerts.push({
        title: "Humedad del suelo baja",
        message: `La humedad del suelo es de ${sensorData.soilMoisture.toFixed(1)}%. Considere programar riego.`,
        type: "warning",
        isRead: false,
      });
    }
    
    if (sensorData.temperature > 30) {
      alerts.push({
        title: "Temperatura alta",
        message: `La temperatura es de ${sensorData.temperature.toFixed(1)}°C. Revise la ventilación.`,
        type: "warning",
        isRead: false,
      });
    }
    
    if (sensorData.temperature < 15) {
      alerts.push({
        title: "Temperatura baja",
        message: `La temperatura es de ${sensorData.temperature.toFixed(1)}°C. Considere activar la calefacción.`,
        type: "warning",
        isRead: false,
      });
    }
    
    for (const alert of alerts) {
      const createdAlert = await storage.createSystemAlert(alert);
      broadcast({ type: 'new-alert', data: createdAlert });
    }
  }

  // Arduino status endpoint
  app.get("/api/arduino/status", (req, res) => {
    res.json({
      connected: isArduinoConnected,
      lastUpdate: new Date().toISOString()
    });
  });

  // Manual pump control endpoint
  app.post("/api/arduino/pump", async (req, res) => {
    try {
      const { state } = req.body;
      
      if (!isArduinoConnected || !arduinoReader) {
        return res.status(503).json({ error: 'Arduino no conectado' });
      }

      await arduinoReader.controlPump(Boolean(state));
      
      await storage.addSystemActivity({
        description: `Bomba ${state ? 'activada' : 'desactivada'} manualmente`,
        type: "user",
        details: `Comando enviado directamente al Arduino`
      });

      res.json({ success: true, pumpState: Boolean(state) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Simulate sensor data only if Arduino is not connected
  if (!isArduinoConnected) {
    console.log('[System] Arduino not connected, starting data simulation...');
    setInterval(async () => {
      const latest = await storage.getLatestSensorData();
      if (latest) {
        // Generate new sensor data with slight variations
        const newData = {
          temperature: latest.temperature + (Math.random() - 0.5) * 2,
          humidity: Math.max(0, Math.min(100, latest.humidity + (Math.random() - 0.5) * 5)),
          lightLevel: Math.max(0, latest.lightLevel + (Math.random() - 0.5) * 100),
          soilMoisture: Math.max(0, Math.min(100, latest.soilMoisture + (Math.random() - 0.5) * 3)),
        };
      
      const sensorData = await storage.insertSensorData(newData);
      broadcast({ type: 'sensor-data', data: sensorData });
      
      // Check for automatic irrigation
      const schedules = await storage.getIrrigationSchedules();
      const automaticSchedule = schedules.find(s => s.isAutomatic && s.isActive);
      if (automaticSchedule && automaticSchedule.conditions) {
        const conditions = automaticSchedule.conditions as any;
        if (conditions.soilMoisture && sensorData.soilMoisture < conditions.soilMoisture.min) {
          const controls = await storage.getSystemControls();
          if (controls && !controls.irrigation) {
            await storage.updateSystemControls({ ...controls, irrigation: true });
            
            await storage.addSystemActivity({
              description: "Riego automático activado",
              details: `Trigger: Humedad del suelo ${sensorData.soilMoisture.toFixed(1)}% < ${conditions.soilMoisture.min}%`,
              icon: "fas fa-shower",
            });
            
            // Auto-stop irrigation after schedule duration
            setTimeout(async () => {
              const currentControls = await storage.getSystemControls();
              if (currentControls && currentControls.irrigation) {
                await storage.updateSystemControls({ ...currentControls, irrigation: false });
                broadcast({ type: 'system-controls', data: await storage.getSystemControls() });
              }
            }, automaticSchedule.duration * 60 * 1000);
            
            broadcast({ type: 'system-controls', data: await storage.getSystemControls() });
          }
        }
      }
      
        await checkAndCreateAlerts(sensorData);
      }
    }, 30000);
  } else {
    console.log('[System] Arduino connected, using real sensor data');
  }

  return httpServer;
}
