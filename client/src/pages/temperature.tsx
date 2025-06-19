import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import type { SensorData } from "@shared/schema";

export default function Temperature() {
  const [timeRange, setTimeRange] = useState("24");

  const { data: currentSensor } = useQuery<SensorData>({
    queryKey: ['/api/sensor-data/latest'],
    refetchInterval: 30000,
  });

  const { data: sensorHistory } = useQuery<SensorData[]>({
    queryKey: ['/api/sensor-data/history', { hours: parseInt(timeRange) }],
    queryFn: async () => {
      const response = await fetch(`/api/sensor-data/history?hours=${timeRange}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch sensor history');
      return response.json();
    },
  });

  const temperatureData = sensorHistory?.map(data => ({
    time: new Date(data.timestamp).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: timeRange === "168" || timeRange === "720" ? '2-digit' : undefined,
      month: timeRange === "720" ? 'short' : undefined
    }),
    temperature: data.temperature.toFixed(1),
    timestamp: data.timestamp
  })) || [];

  const getTemperatureStatus = (temp: number) => {
    if (temp < 15) return { status: "Muy Baja", color: "bg-blue-100 text-blue-800", icon: "fas fa-snowflake" };
    if (temp < 22) return { status: "Baja", color: "bg-cyan-100 text-cyan-800", icon: "fas fa-thermometer-quarter" };
    if (temp <= 26) return { status: "Óptima", color: "bg-green-100 text-green-800", icon: "fas fa-thermometer-half" };
    if (temp <= 30) return { status: "Alta", color: "bg-yellow-100 text-yellow-800", icon: "fas fa-thermometer-three-quarters" };
    return { status: "Muy Alta", color: "bg-red-100 text-red-800", icon: "fas fa-thermometer-full" };
  };

  const currentTemp = currentSensor?.temperature || 0;
  const tempStatus = getTemperatureStatus(currentTemp);

  // Calculate statistics
  const temperatures = temperatureData.map(d => parseFloat(d.temperature));
  const minTemp = Math.min(...temperatures);
  const maxTemp = Math.max(...temperatures);
  const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header />
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Control de Temperatura</h1>
              <p className="text-gray-600 mt-2">Monitoreo detallado de la temperatura del invernadero</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={tempStatus.color}>
                <i className={`${tempStatus.icon} mr-2`} />
                {tempStatus.status}
              </Badge>
            </div>
          </div>

          {/* Current Temperature Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-thermometer-half text-red-500" />
                <span>Temperatura Actual</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-500">{currentTemp.toFixed(1)}°C</div>
                  <p className="text-sm text-gray-500 mt-1">Temperatura Actual</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">{isNaN(minTemp) ? '--' : minTemp.toFixed(1)}°C</div>
                  <p className="text-sm text-gray-500 mt-1">Mínima del Período</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">{isNaN(maxTemp) ? '--' : maxTemp.toFixed(1)}°C</div>
                  <p className="text-sm text-gray-500 mt-1">Máxima del Período</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">{isNaN(avgTemp) ? '--' : avgTemp.toFixed(1)}°C</div>
                  <p className="text-sm text-gray-500 mt-1">Promedio del Período</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Temperatura</CardTitle>
                  <CardDescription>Tendencia de temperatura a lo largo del tiempo</CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">Últimas 24h</SelectItem>
                    <SelectItem value="168">Última semana</SelectItem>
                    <SelectItem value="720">Último mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={temperatureData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    {/* Reference lines for optimal range */}
                    <ReferenceLine y={22} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Mín Óptimo (22°C)", position: "left" }} />
                    <ReferenceLine y={26} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Máx Óptimo (26°C)", position: "left" }} />
                    <ReferenceLine y={15} stroke="#3b82f6" strokeDasharray="5 5" label={{ value: "Mínimo Crítico (15°C)", position: "left" }} />
                    <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Máximo Crítico (30°C)", position: "left" }} />
                    
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="hsl(0, 84%, 60%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(0, 84%, 60%)", r: 4 }}
                      name="Temperatura (°C)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Zones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-snowflake text-blue-500 text-2xl mb-2" />
                <h3 className="font-semibold text-blue-800">Zona Fría</h3>
                <p className="text-sm text-blue-600">&lt; 15°C</p>
                <p className="text-xs text-blue-500 mt-1">Activar calefacción</p>
              </CardContent>
            </Card>
            
            <Card className="border-cyan-200 bg-cyan-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-thermometer-quarter text-cyan-500 text-2xl mb-2" />
                <h3 className="font-semibold text-cyan-800">Zona Baja</h3>
                <p className="text-sm text-cyan-600">15°C - 22°C</p>
                <p className="text-xs text-cyan-500 mt-1">Monitoreo regular</p>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-thermometer-half text-green-500 text-2xl mb-2" />
                <h3 className="font-semibold text-green-800">Zona Óptima</h3>
                <p className="text-sm text-green-600">22°C - 26°C</p>
                <p className="text-xs text-green-500 mt-1">Condiciones ideales</p>
              </CardContent>
            </Card>
            
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-thermometer-full text-red-500 text-2xl mb-2" />
                <h3 className="font-semibold text-red-800">Zona Caliente</h3>
                <p className="text-sm text-red-600">&gt; 26°C</p>
                <p className="text-xs text-red-500 mt-1">Activar ventilación</p>
              </CardContent>
            </Card>
          </div>

          {/* Temperature Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-lightbulb text-yellow-500" />
                <span>Análisis y Recomendaciones</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentTemp < 15 && (
                  <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <i className="fas fa-exclamation-triangle text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium text-blue-800">Temperatura Crítica Baja</p>
                      <p className="text-sm text-blue-600">Se recomienda activar inmediatamente el sistema de calefacción para proteger las plantas.</p>
                    </div>
                  </div>
                )}
                
                {currentTemp > 30 && (
                  <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <i className="fas fa-exclamation-triangle text-red-500 mt-1" />
                    <div>
                      <p className="font-medium text-red-800">Temperatura Crítica Alta</p>
                      <p className="text-sm text-red-600">Se recomienda activar inmediatamente el sistema de ventilación y considerar sombrado adicional.</p>
                    </div>
                  </div>
                )}
                
                {currentTemp >= 22 && currentTemp <= 26 && (
                  <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <i className="fas fa-check-circle text-green-500 mt-1" />
                    <div>
                      <p className="font-medium text-green-800">Temperatura Óptima</p>
                      <p className="text-sm text-green-600">Las condiciones actuales son ideales para el crecimiento de las plantas.</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Consejos para Días Calurosos</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Aumentar ventilación durante las horas más calurosas</li>
                      <li>• Considerar riego por aspersión para refrescar el ambiente</li>
                      <li>• Utilizar mallas de sombrado en ventanas sur</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Consejos para Días Fríos</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Activar calefacción durante la madrugada</li>
                      <li>• Reducir ventilación al mínimo necesario</li>
                      <li>• Considerar aislamiento adicional en las noches</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}