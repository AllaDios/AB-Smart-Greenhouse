import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sensorData = pgTable("sensor_data", {
  id: serial("id").primaryKey(),
  temperature: real("temperature").notNull(),
  humidity: real("humidity").notNull(),
  lightLevel: real("light_level").notNull(),
  soilMoisture: real("soil_moisture").notNull(),
  waterLevel: real("water_level").default(75),
  pumpStatus: boolean("pump_status").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const systemControls = pgTable("system_controls", {
  id: serial("id").primaryKey(),
  irrigation: boolean("irrigation").default(false).notNull(),
  ventilation: boolean("ventilation").default(false).notNull(),
  lighting: boolean("lighting").default(false).notNull(),
  heating: boolean("heating").default(false).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const irrigationSchedules = pgTable("irrigation_schedules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  time: text("time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  isActive: boolean("is_active").default(true).notNull(),
  isAutomatic: boolean("is_automatic").default(false).notNull(),
  conditions: jsonb("conditions"), // for automatic triggers
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'warning', 'error', 'info'
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemActivity = pgTable("system_activity", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  details: text("details"),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertSensorDataSchema = createInsertSchema(sensorData).omit({
  id: true,
  timestamp: true,
});

export const insertSystemControlsSchema = createInsertSchema(systemControls).omit({
  id: true,
  lastUpdated: true,
});

export const insertIrrigationScheduleSchema = createInsertSchema(irrigationSchedules).omit({
  id: true,
  createdAt: true,
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertSystemActivitySchema = createInsertSchema(systemActivity).omit({
  id: true,
  createdAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

// Types
export type SensorData = typeof sensorData.$inferSelect;
export type InsertSensorData = z.infer<typeof insertSensorDataSchema>;

export type SystemControls = typeof systemControls.$inferSelect;
export type InsertSystemControls = z.infer<typeof insertSystemControlsSchema>;

export type IrrigationSchedule = typeof irrigationSchedules.$inferSelect;
export type InsertIrrigationSchedule = z.infer<typeof insertIrrigationScheduleSchema>;

export type SystemAlert = typeof systemAlerts.$inferSelect;
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;

export type SystemActivity = typeof systemActivity.$inferSelect;
export type InsertSystemActivity = z.infer<typeof insertSystemActivitySchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
