import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { SystemActivity, SensorData } from "@shared/schema";

export default function History() {
  const [activeTab, setActiveTab] = useState("activity");
  const [timeRange, setTimeRange] = useState("24");
  const [activityLimit, setActivityLimit] = useState("50");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: activities, isLoading: activitiesLoading } = useQuery<SystemActivity[]>({
    queryKey: ['/api/system-activity', { limit: parseInt(activityLimit) }],
    queryFn: async () => {
      const response = await fetch(`/api/system-activity?limit=${activityLimit}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    },
  });

  const { data: sensorHistory, isLoading: sensorLoading } = useQuery<SensorData[]>({
    queryKey: ['/api/sensor-data/history', { hours: parseInt(timeRange) }],
    queryFn: async () => {
      const response = await fetch(`/api/sensor-data/history?hours=${timeRange}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch sensor history');
      return response.json();
    },
  });

  const getIconColor = (icon: string) => {
    if (icon.includes('shower')) return 'bg-blue-100 text-blue-500';
    if (icon.includes('thermometer')) return 'bg-red-100 text-red-500';
    if (icon.includes('fan')) return 'bg-green-100 text-green-500';
    if (icon.includes('cog')) return 'bg-purple-100 text-purple-500';
    if (icon.includes('stop')) return 'bg-red-100 text-red-500';
    if (icon.includes('edit')) return 'bg-yellow-100 text-yellow-500';
    if (icon.includes('trash')) return 'bg-gray-100 text-gray-500';
    return 'bg-gray-100 text-gray-500';
  };

  const filteredActivities = activities?.filter(activity => 
    searchTerm === "" || 
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activity.details && activity.details.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const chartData = sensorHistory?.map(data => ({
    time: new Date(data.timestamp).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: timeRange === "168" || timeRange === "720" ? '2-digit' : undefined,
      month: timeRange === "720" ? 'short' : undefined
    }),
    temperature: data.temperature.toFixed(1),
    humidity: data.humidity.toFixed(1),
    light: (data.lightLevel / 10).toFixed(1),
    soilMoisture: data.soilMoisture.toFixed(1),
    timestamp: data.timestamp
  })) || [];

  const exportData = (type: 'activity' | 'sensor') => {
    const data = type === 'activity' ? activities : sensorHistory;
    const filename = `${type}_history_${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header />
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Historial del Sistema</h1>
              <p className="text-gray-600 mt-2">Registro completo de actividades y datos históricos</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => exportData(activeTab as 'activity' | 'sensor')}
              >
                <i className="fas fa-download mr-2" />
                Exportar Datos
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="activity">Actividad del Sistema</TabsTrigger>
              <TabsTrigger value="sensor">Datos de Sensores</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-6">
              {/* Activity Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar en el historial de actividades..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={activityLimit} onValueChange={setActivityLimit}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Límite" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">Últimos 25</SelectItem>
                        <SelectItem value="50">Últimos 50</SelectItem>
                        <SelectItem value="100">Últimos 100</SelectItem>
                        <SelectItem value="200">Últimos 200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Activity List */}
              <Card>
                <CardHeader>
                  <CardTitle>Registro de Actividades</CardTitle>
                  <CardDescription>
                    {filteredActivities.length} de {activities?.length || 0} actividades mostradas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="space-y-4">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-full" />
                          </div>
                          <div className="text-right">
                            <div className="h-3 bg-gray-200 rounded w-16 mb-1" />
                            <div className="h-3 bg-gray-200 rounded w-12" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredActivities.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <i className="fas fa-history text-4xl mb-4" />
                      <p className="text-lg font-medium mb-2">No se encontraron actividades</p>
                      <p className="text-sm">
                        {searchTerm ? "Intenta ajustar el término de búsqueda" : "No hay actividad registrada"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(activity.icon)}`}>
                            <i className={activity.icon} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.description}</p>
                            {activity.details && (
                              <p className="text-sm text-gray-500 mt-1">{activity.details}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">
                              {new Date(activity.createdAt).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(activity.createdAt), { locale: es })} atrás
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sensor" className="space-y-6">
              {/* Sensor Data Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">Últimas 24h</SelectItem>
                        <SelectItem value="72">Últimos 3 días</SelectItem>
                        <SelectItem value="168">Última semana</SelectItem>
                        <SelectItem value="720">Último mes</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-gray-500">
                      {sensorHistory?.length || 0} registros encontrados
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Historical Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendencias Históricas</CardTitle>
                  <CardDescription>
                    Evolución de los parámetros ambientales en el tiempo seleccionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    {sensorLoading ? (
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
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="hsl(0, 84%, 60%)"
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            name="Temperatura (°C)"
                          />
                          <Line
                            type="monotone"
                            dataKey="humidity"
                            stroke="hsl(207, 90%, 54%)"
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            name="Humedad (%)"
                          />
                          <Line
                            type="monotone"
                            dataKey="light"
                            stroke="hsl(45, 93%, 47%)"
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            name="Luz (lux/10)"
                          />
                          <Line
                            type="monotone"
                            dataKey="soilMoisture"
                            stroke="hsl(122, 39%, 49%)"
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            name="Humedad Suelo (%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Historical Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Temperatura', value: sensorHistory?.length ? (sensorHistory.reduce((acc, d) => acc + d.temperature, 0) / sensorHistory.length).toFixed(1) + '°C' : '--', icon: 'fas fa-thermometer-half', color: 'text-red-500' },
                  { name: 'Humedad', value: sensorHistory?.length ? (sensorHistory.reduce((acc, d) => acc + d.humidity, 0) / sensorHistory.length).toFixed(1) + '%' : '--', icon: 'fas fa-tint', color: 'text-blue-500' },
                  { name: 'Luz', value: sensorHistory?.length ? (sensorHistory.reduce((acc, d) => acc + d.lightLevel, 0) / sensorHistory.length).toFixed(0) + ' lux' : '--', icon: 'fas fa-sun', color: 'text-yellow-500' },
                  { name: 'Suelo', value: sensorHistory?.length ? (sensorHistory.reduce((acc, d) => acc + d.soilMoisture, 0) / sensorHistory.length).toFixed(1) + '%' : '--', icon: 'fas fa-seedling', color: 'text-green-500' }
                ].map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 text-center">
                      <i className={`${stat.icon} ${stat.color} text-2xl mb-2`} />
                      <div className="text-2xl font-bold text-gray-700">{stat.value}</div>
                      <p className="text-sm text-gray-500">Promedio del Período</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Data Quality Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Calidad de Datos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{sensorHistory?.length || 0}</div>
                      <p className="text-sm text-gray-600">Registros Totales</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">99.8%</div>
                      <p className="text-sm text-gray-600">Precisión de Datos</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">30s</div>
                      <p className="text-sm text-gray-600">Intervalo de Muestreo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}