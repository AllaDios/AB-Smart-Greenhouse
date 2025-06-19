import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { SensorData } from "@shared/schema";

export function EnvironmentChart() {
  const [timeRange, setTimeRange] = useState("24");

  const { data: sensorHistory, isLoading } = useQuery<SensorData[]>({
    queryKey: ['/api/sensor-data/history', { hours: parseInt(timeRange) }],
    queryFn: async () => {
      const response = await fetch(`/api/sensor-data/history?hours=${timeRange}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch sensor history');
      return response.json();
    },
  });

  const chartData = sensorHistory?.map(data => ({
    time: new Date(data.timestamp).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    temperature: data.temperature.toFixed(1),
    humidity: data.humidity.toFixed(1),
    light: (data.lightLevel / 10).toFixed(1), // Scale down for better visualization
  })) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Tendencias Ambientales</h3>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">Últimas 24h</SelectItem>
              <SelectItem value="168">Última semana</SelectItem>
              <SelectItem value="720">Último mes</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm">
            <i className="fas fa-download" />
          </Button>
        </div>
      </div>
      
      <div className="h-64">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Cargando datos...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={2}
                dot={{ fill: "hsl(0, 84%, 60%)", r: 3 }}
                name="Temperatura (°C)"
              />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="hsl(207, 90%, 54%)"
                strokeWidth={2}
                dot={{ fill: "hsl(207, 90%, 54%)", r: 3 }}
                name="Humedad (%)"
              />
              <Line
                type="monotone"
                dataKey="light"
                stroke="hsl(45, 93%, 47%)"
                strokeWidth={2}
                dot={{ fill: "hsl(45, 93%, 47%)", r: 3 }}
                name="Luz (lux/10)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-400 rounded-full" />
          <span className="text-sm text-gray-600">Temperatura</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-400 rounded-full" />
          <span className="text-sm text-gray-600">Humedad</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full" />
          <span className="text-sm text-gray-600">Luz</span>
        </div>
      </div>
    </div>
  );
}
