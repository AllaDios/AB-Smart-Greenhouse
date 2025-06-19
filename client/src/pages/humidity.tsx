import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import type { SensorData } from "@shared/schema";

export default function Humidity() {
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

  const humidityData = sensorHistory?.map(data => ({
    time: new Date(data.timestamp).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: timeRange === "168" || timeRange === "720" ? '2-digit' : undefined,
      month: timeRange === "720" ? 'short' : undefined
    }),
    humidity: data.humidity.toFixed(1),
    timestamp: data.timestamp
  })) || [];

  const getHumidityStatus = (humidity: number) => {
    if (humidity < 40) return { status: "Muy Baja", color: "bg-red-100 text-red-800", icon: "fas fa-exclamation-triangle" };
    if (humidity < 60) return { status: "Baja", color: "bg-orange-100 text-orange-800", icon: "fas fa-tint-slash" };
    if (humidity <= 80) return { status: "Óptima", color: "bg-green-100 text-green-800", icon: "fas fa-tint" };
    if (humidity <= 90) return { status: "Alta", color: "bg-yellow-100 text-yellow-800", icon: "fas fa-cloud-rain" };
    return { status: "Muy Alta", color: "bg-blue-100 text-blue-800", icon: "fas fa-cloud-showers-heavy" };
  };

  const currentHumidity = currentSensor?.humidity || 0;
  const humidityStatus = getHumidityStatus(currentHumidity);

  // Calculate statistics
  const humidities = humidityData.map(d => parseFloat(d.humidity));
  const minHumidity = Math.min(...humidities);
  const maxHumidity = Math.max(...humidities);
  const avgHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header />
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Control de Humedad</h1>
              <p className="text-gray-600 mt-2">Monitoreo detallado de la humedad relativa del invernadero</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={humidityStatus.color}>
                <i className={`${humidityStatus.icon} mr-2`} />
                {humidityStatus.status}
              </Badge>
            </div>
          </div>

          {/* Current Humidity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-tint text-blue-500" />
                <span>Humedad Actual</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-500">{currentHumidity.toFixed(1)}%</div>
                  <p className="text-sm text-gray-500 mt-1">Humedad Actual</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">{isNaN(minHumidity) ? '--' : minHumidity.toFixed(1)}%</div>
                  <p className="text-sm text-gray-500 mt-1">Mínima del Período</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">{isNaN(maxHumidity) ? '--' : maxHumidity.toFixed(1)}%</div>
                  <p className="text-sm text-gray-500 mt-1">Máxima del Período</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">{isNaN(avgHumidity) ? '--' : avgHumidity.toFixed(1)}%</div>
                  <p className="text-sm text-gray-500 mt-1">Promedio del Período</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Humidity Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Humedad</CardTitle>
                  <CardDescription>Tendencia de humedad relativa a lo largo del tiempo</CardDescription>
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
                  <LineChart data={humidityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    {/* Reference lines for optimal range */}
                    <ReferenceLine y={60} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Mín Óptimo (60%)", position: "left" }} />
                    <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Máx Óptimo (80%)", position: "left" }} />
                    <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Mínimo Crítico (40%)", position: "left" }} />
                    <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Máximo Crítico (90%)", position: "left" }} />
                    
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="hsl(207, 90%, 54%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(207, 90%, 54%)", r: 4 }}
                      name="Humedad (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Humidity Zones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-exclamation-triangle text-red-500 text-2xl mb-2" />
                <h3 className="font-semibold text-red-800">Zona Seca</h3>
                <p className="text-sm text-red-600">&lt; 40%</p>
                <p className="text-xs text-red-500 mt-1">Aumentar humidificación</p>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-tint-slash text-orange-500 text-2xl mb-2" />
                <h3 className="font-semibold text-orange-800">Zona Baja</h3>
                <p className="text-sm text-orange-600">40% - 60%</p>
                <p className="text-xs text-orange-500 mt-1">Monitoreo activo</p>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-tint text-green-500 text-2xl mb-2" />
                <h3 className="font-semibold text-green-800">Zona Óptima</h3>
                <p className="text-sm text-green-600">60% - 80%</p>
                <p className="text-xs text-green-500 mt-1">Condiciones ideales</p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-cloud-showers-heavy text-blue-500 text-2xl mb-2" />
                <h3 className="font-semibold text-blue-800">Zona Húmeda</h3>
                <p className="text-sm text-blue-600">&gt; 80%</p>
                <p className="text-xs text-blue-500 mt-1">Aumentar ventilación</p>
              </CardContent>
            </Card>
          </div>

          {/* Humidity and Plant Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-leaf text-green-500" />
                  <span>Impacto en las Plantas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <i className="fas fa-check-circle text-green-500 mt-1" />
                    <div>
                      <p className="font-medium text-green-800">Humedad Óptima (60-80%)</p>
                      <p className="text-sm text-green-600">Favorece la fotosíntesis y el crecimiento saludable de las plantas.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <i className="fas fa-exclamation-triangle text-orange-500 mt-1" />
                    <div>
                      <p className="font-medium text-orange-800">Humedad Baja (&lt; 60%)</p>
                      <p className="text-sm text-orange-600">Puede causar estrés hídrico y reducir la tasa de crecimiento.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <i className="fas fa-exclamation-triangle text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium text-blue-800">Humedad Alta (&gt; 80%)</p>
                      <p className="text-sm text-blue-600">Aumenta el riesgo de enfermedades fúngicas y bacterianas.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-lightbulb text-yellow-500" />
                  <span>Recomendaciones de Control</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentHumidity < 40 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-red-800">Acción Inmediata Requerida</p>
                      <ul className="text-sm text-red-600 mt-2 space-y-1">
                        <li>• Activar sistemas de nebulización</li>
                        <li>• Reducir ventilación al mínimo</li>
                        <li>• Aumentar riego por aspersión</li>
                      </ul>
                    </div>
                  )}
                  
                  {currentHumidity > 90 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-800">Reducir Humedad Urgente</p>
                      <ul className="text-sm text-blue-600 mt-2 space-y-1">
                        <li>• Aumentar ventilación al máximo</li>
                        <li>• Activar deshumidificadores</li>
                        <li>• Reducir riego temporalmente</li>
                      </ul>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Para Aumentar Humedad</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Sistemas de nebulización</li>
                        <li>• Riego por aspersión</li>
                        <li>• Recipientes con agua</li>
                        <li>• Reducir ventilación</li>
                      </ul>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Para Reducir Humedad</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Aumentar ventilación</li>
                        <li>• Deshumidificadores</li>
                        <li>• Calefacción moderada</li>
                        <li>• Reducir riego</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}