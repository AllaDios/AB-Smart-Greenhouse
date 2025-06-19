import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import type { SensorData } from "@shared/schema";

export default function Lighting() {
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

  const lightData = sensorHistory?.map(data => ({
    time: new Date(data.timestamp).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: timeRange === "168" || timeRange === "720" ? '2-digit' : undefined,
      month: timeRange === "720" ? 'short' : undefined
    }),
    light: data.lightLevel.toFixed(0),
    timestamp: data.timestamp
  })) || [];

  const getLightStatus = (light: number) => {
    if (light < 200) return { status: "Muy Baja", color: "bg-gray-100 text-gray-800", icon: "fas fa-moon" };
    if (light < 800) return { status: "Baja", color: "bg-orange-100 text-orange-800", icon: "fas fa-cloud" };
    if (light <= 1200) return { status: "Óptima", color: "bg-green-100 text-green-800", icon: "fas fa-sun" };
    if (light <= 1500) return { status: "Alta", color: "bg-yellow-100 text-yellow-800", icon: "fas fa-sun" };
    return { status: "Muy Alta", color: "bg-red-100 text-red-800", icon: "fas fa-fire" };
  };

  const currentLight = currentSensor?.lightLevel || 0;
  const lightStatus = getLightStatus(currentLight);

  // Calculate statistics
  const lightLevels = lightData.map(d => parseFloat(d.light));
  const minLight = Math.min(...lightLevels);
  const maxLight = Math.max(...lightLevels);
  const avgLight = lightLevels.reduce((a, b) => a + b, 0) / lightLevels.length;

  // Get current hour to determine if it's day/night
  const currentHour = new Date().getHours();
  const isDayTime = currentHour >= 6 && currentHour <= 19;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header />
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Control de Iluminación</h1>
              <p className="text-gray-600 mt-2">Monitoreo de luz natural y control de iluminación artificial</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={lightStatus.color}>
                <i className={`${lightStatus.icon} mr-2`} />
                {lightStatus.status}
              </Badge>
              <Badge variant={isDayTime ? "default" : "secondary"}>
                <i className={`fas ${isDayTime ? 'fa-sun' : 'fa-moon'} mr-2`} />
                {isDayTime ? 'Día' : 'Noche'}
              </Badge>
            </div>
          </div>

          {/* Current Light Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-sun text-yellow-500" />
                <span>Intensidad Lumínica Actual</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-500">{currentLight.toFixed(0)} lux</div>
                  <p className="text-sm text-gray-500 mt-1">Intensidad Actual</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">{isNaN(minLight) ? '--' : minLight.toFixed(0)} lux</div>
                  <p className="text-sm text-gray-500 mt-1">Mínima del Período</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">{isNaN(maxLight) ? '--' : maxLight.toFixed(0)} lux</div>
                  <p className="text-sm text-gray-500 mt-1">Máxima del Período</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">{isNaN(avgLight) ? '--' : avgLight.toFixed(0)} lux</div>
                  <p className="text-sm text-gray-500 mt-1">Promedio del Período</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Light Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Iluminación</CardTitle>
                  <CardDescription>Variación de la intensidad lumínica a lo largo del tiempo</CardDescription>
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
                  <LineChart data={lightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={[0, 'dataMax + 100']}
                    />
                    {/* Reference lines for optimal range */}
                    <ReferenceLine y={800} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Mín Óptimo (800 lux)", position: "left" }} />
                    <ReferenceLine y={1200} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Máx Óptimo (1200 lux)", position: "left" }} />
                    <ReferenceLine y={200} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Mínimo Crítico (200 lux)", position: "left" }} />
                    
                    <Line
                      type="monotone"
                      dataKey="light"
                      stroke="hsl(45, 93%, 47%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(45, 93%, 47%)", r: 4 }}
                      name="Intensidad (lux)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Light Zones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-moon text-gray-500 text-2xl mb-2" />
                <h3 className="font-semibold text-gray-800">Zona Oscura</h3>
                <p className="text-sm text-gray-600">&lt; 200 lux</p>
                <p className="text-xs text-gray-500 mt-1">Activar luz artificial</p>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-cloud text-orange-500 text-2xl mb-2" />
                <h3 className="font-semibold text-orange-800">Zona Tenue</h3>
                <p className="text-sm text-orange-600">200 - 800 lux</p>
                <p className="text-xs text-orange-500 mt-1">Luz suplementaria</p>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-sun text-green-500 text-2xl mb-2" />
                <h3 className="font-semibold text-green-800">Zona Óptima</h3>
                <p className="text-sm text-green-600">800 - 1200 lux</p>
                <p className="text-xs text-green-500 mt-1">Condiciones ideales</p>
              </CardContent>
            </Card>
            
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-center">
                <i className="fas fa-fire text-red-500 text-2xl mb-2" />
                <h3 className="font-semibold text-red-800">Zona Intensa</h3>
                <p className="text-sm text-red-600">&gt; 1200 lux</p>
                <p className="text-xs text-red-500 mt-1">Considerar sombrado</p>
              </CardContent>
            </Card>
          </div>

          {/* Lighting Control and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-lightbulb text-yellow-500" />
                  <span>Control de Iluminación Artificial</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <i className="fas fa-lightbulb text-blue-500 text-2xl mb-2" />
                    <p className="font-medium text-blue-800">LED Principal</p>
                    <Badge variant="secondary">Automático</Badge>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <i className="fas fa-seedling text-purple-500 text-2xl mb-2" />
                    <p className="font-medium text-purple-800">LED Crecimiento</p>
                    <Badge variant="secondary">Inactivo</Badge>
                  </div>
                </div>
                
                <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Activación Automática</p>
                      <p className="text-sm text-gray-500">Se activa cuando luz &lt; 800 lux</p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800">Habilitado</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Horario Nocturno</p>
                      <p className="text-sm text-gray-500">22:00 - 06:00</p>
                    </div>
                    <Badge variant="outline">Configurado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-chart-line text-green-500" />
                  <span>Análisis Fotosintético</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    {currentLight < 200 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-800">Luz Insuficiente</p>
                        <p className="text-sm text-red-600">Activar inmediatamente la iluminación artificial para mantener la fotosíntesis.</p>
                      </div>
                    )}
                    
                    {currentLight >= 800 && currentLight <= 1200 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-800">Condiciones Fotosintéticas Óptimas</p>
                        <p className="text-sm text-green-600">La intensidad lumínica actual favorece la máxima eficiencia fotosintética.</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">Índice DLI Estimado</h4>
                        <p className="text-2xl font-bold text-blue-600">{((currentLight * 12) / 1000000).toFixed(1)} mol/m²/día</p>
                        <p className="text-xs text-gray-500">Integral Diaria de Luz (DLI)</p>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">Eficiencia Energética</h4>
                        <p className="text-lg font-semibold text-green-600">
                          {currentLight > 800 ? 'Alta' : currentLight > 400 ? 'Media' : 'Baja'}
                        </p>
                        <p className="text-xs text-gray-500">Uso de luz natural vs artificial</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-3">Recomendaciones</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      {currentLight < 800 && (
                        <li className="flex items-start space-x-2">
                          <i className="fas fa-lightbulb text-yellow-500 mt-0.5" />
                          <span>Activar iluminación LED para complementar luz natural</span>
                        </li>
                      )}
                      {currentLight > 1500 && (
                        <li className="flex items-start space-x-2">
                          <i className="fas fa-umbrella text-blue-500 mt-0.5" />
                          <span>Instalar mallas de sombrado para reducir intensidad</span>
                        </li>
                      )}
                      <li className="flex items-start space-x-2">
                        <i className="fas fa-clock text-green-500 mt-0.5" />
                        <span>Mantener fotoperiodo de 12-16 horas para crecimiento óptimo</span>
                      </li>
                    </ul>
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