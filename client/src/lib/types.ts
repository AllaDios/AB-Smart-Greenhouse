export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface ChartDataPoint {
  time: string;
  temperature: number;
  humidity: number;
  light: number;
}

export interface AlertSummary {
  total: number;
  unread: number;
  critical: number;
}

export interface SystemStatus {
  isOnline: boolean;
  lastUpdate: Date;
  uptime: number;
}
