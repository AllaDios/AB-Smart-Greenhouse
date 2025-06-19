import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { IrrigationSchedule, SensorData } from "@shared/schema";

export default function Irrigation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: "",
    time: "",
    duration: 10,
    isActive: true,
    isAutomatic: false
  });

  const { data: schedules, isLoading } = useQuery<IrrigationSchedule[]>({
    queryKey: ['/api/irrigation-schedules'],
  });

  const { data: currentSensor } = useQuery<SensorData>({
    queryKey: ['/api/sensor-data/latest'],
    refetchInterval: 30000,
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (schedule: typeof newSchedule) => {
      const response = await apiRequest('POST', '/api/irrigation-schedules', schedule);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/irrigation-schedules'] });
      setIsAddDialogOpen(false);
      setNewSchedule({
        name: "",
        time: "",
        duration: 10,
        isActive: true,
        isAutomatic: false
      });
      toast({
        title: "Programa creado",
        description: "El nuevo programa de riego ha sido creado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el programa de riego.",
        variant: "destructive",
      });
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest('PUT', `/api/irrigation-schedules/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/irrigation-schedules'] });
      toast({
        title: "Programa actualizado",
        description: "El estado del programa de riego ha sido actualizado.",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/irrigation-schedules/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/irrigation-schedules'] });
      toast({
        title: "Programa eliminado",
        description: "El programa de riego ha sido eliminado exitosamente.",
      });
    },
  });

  const irrigateNowMutation = useMutation({
    mutationFn: async (duration: number) => {
      const response = await apiRequest('POST', '/api/actions/irrigate', { duration });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-controls'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system-activity'] });
      toast({
        title: "Riego iniciado",
        description: "El sistema de riego se ha activado.",
      });
    },
  });

  const getStatusBadge = (schedule: IrrigationSchedule) => {
    if (!schedule.isActive) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    if (schedule.isAutomatic) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Automático</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>;
  };

  const getSoilMoistureStatus = (moisture: number) => {
    if (moisture < 30) return { status: "Crítica", color: "text-red-600", bgColor: "bg-red-50" };
    if (moisture < 50) return { status: "Baja", color: "text-orange-600", bgColor: "bg-orange-50" };
    if (moisture <= 70) return { status: "Óptima", color: "text-green-600", bgColor: "bg-green-50" };
    return { status: "Alta", color: "text-blue-600", bgColor: "bg-blue-50" };
  };

  const soilMoisture = currentSensor?.soilMoisture || 0;
  const moistureStatus = getSoilMoistureStatus(soilMoisture);

  const handleCreateSchedule = () => {
    if (!newSchedule.name || !newSchedule.time) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }
    createScheduleMutation.mutate(newSchedule);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header />
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sistema de Riego</h1>
              <p className="text-gray-600 mt-2">Gestión completa del sistema de irrigación automático</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={`${moistureStatus.color} ${moistureStatus.bgColor} border-0`}>
                <i className="fas fa-seedling mr-2" />
                Humedad: {moistureStatus.status}
              </Badge>
            </div>
          </div>

          {/* Soil Moisture Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-seedling text-green-500" />
                <span>Estado Actual del Suelo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500">{soilMoisture.toFixed(1)}%</div>
                  <p className="text-sm text-gray-500 mt-1">Humedad del Suelo</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">50-70%</div>
                  <p className="text-sm text-gray-500 mt-1">Rango Óptimo</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-semibold ${moistureStatus.color}`}>
                    {moistureStatus.status}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Estado Actual</p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, soilMoisture)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0%</span>
                  <span>Crítico: 30%</span>
                  <span>Óptimo: 50-70%</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Button
                  size="lg"
                  onClick={() => irrigateNowMutation.mutate(5)}
                  disabled={irrigateNowMutation.isPending}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white mb-4"
                >
                  <i className="fas fa-shower mr-2" />
                  {irrigateNowMutation.isPending ? "Activando..." : "Riego Rápido (5 min)"}
                </Button>
                <p className="text-sm text-gray-500">Activación inmediata por 5 minutos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Button
                  size="lg"
                  onClick={() => irrigateNowMutation.mutate(10)}
                  disabled={irrigateNowMutation.isPending}
                  className="w-full bg-green-500 hover:bg-green-600 text-white mb-4"
                >
                  <i className="fas fa-clock mr-2" />
                  Riego Normal (10 min)
                </Button>
                <p className="text-sm text-gray-500">Ciclo estándar de riego</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Button
                  size="lg"
                  onClick={() => irrigateNowMutation.mutate(20)}
                  disabled={irrigateNowMutation.isPending}
                  className="w-full bg-greenhouse-500 hover:bg-greenhouse-600 text-white mb-4"
                >
                  <i className="fas fa-tint mr-2" />
                  Riego Profundo (20 min)
                </Button>
                <p className="text-sm text-gray-500">Para suelos muy secos</p>
              </CardContent>
            </Card>
          </div>

          {/* Irrigation Schedules */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Programas de Riego</CardTitle>
                  <CardDescription>Gestiona los horarios automáticos de irrigación</CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-greenhouse-500 hover:bg-greenhouse-600 text-white">
                      <i className="fas fa-plus mr-2" />
                      Nuevo Programa
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Programa de Riego</DialogTitle>
                      <DialogDescription>
                        Configura un nuevo programa automático de riego
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="name">Nombre del Programa</Label>
                        <Input
                          id="name"
                          value={newSchedule.name}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ej: Riego Matutino"
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Hora de Activación</Label>
                        <Input
                          id="time"
                          type="time"
                          value={newSchedule.time}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Duración (minutos)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={newSchedule.duration}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, duration: Number(e.target.value) }))}
                          min="1"
                          max="60"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="active"
                          checked={newSchedule.isActive}
                          onCheckedChange={(checked) => setNewSchedule(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="active">Activar inmediatamente</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="automatic"
                          checked={newSchedule.isAutomatic}
                          onCheckedChange={(checked) => setNewSchedule(prev => ({ ...prev, isAutomatic: checked }))}
                        />
                        <Label htmlFor="automatic">Activación por sensores (humedad &lt; 30%)</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleCreateSchedule}
                        disabled={createScheduleMutation.isPending}
                        className="bg-greenhouse-500 hover:bg-greenhouse-600 text-white"
                      >
                        {createScheduleMutation.isPending ? "Creando..." : "Crear Programa"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                          <div className="h-3 bg-gray-200 rounded w-48" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-6 bg-gray-200 rounded w-20" />
                        <div className="w-8 h-8 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules?.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          schedule.isAutomatic ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                          <i className={`fas ${
                            schedule.isAutomatic ? 'fa-robot text-orange-500' : 'fa-shower text-blue-500'
                          } text-lg`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{schedule.name}</p>
                          <p className="text-sm text-gray-500">
                            {schedule.isAutomatic 
                              ? "Activación automática cuando humedad < 30%" 
                              : `${schedule.time} - ${schedule.duration} minutos`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(schedule)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleScheduleMutation.mutate({ 
                            id: schedule.id, 
                            isActive: !schedule.isActive 
                          })}
                          disabled={toggleScheduleMutation.isPending}
                        >
                          <i className="fas fa-power-off" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                          disabled={deleteScheduleMutation.isPending}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="fas fa-trash" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {schedules?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-shower text-4xl mb-4" />
                      <p className="text-lg font-medium mb-2">No hay programas configurados</p>
                      <p className="text-sm">Crea tu primer programa de riego automático</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Irrigation Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-lightbulb text-yellow-500" />
                <span>Consejos de Riego</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Mejores Prácticas</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-clock text-green-500 mt-0.5" />
                      <span>Riega temprano en la mañana (6:00-8:00 AM) para mejor absorción</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-tint text-blue-500 mt-0.5" />
                      <span>Mantén la humedad del suelo entre 50-70% para crecimiento óptimo</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-thermometer-half text-red-500 mt-0.5" />
                      <span>Ajusta la frecuencia según la temperatura ambiente</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-eye text-purple-500 mt-0.5" />
                      <span>Monitorea las plantas para detectar sobre o sub-riego</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Indicadores de Riego</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-2 bg-red-50 rounded">
                      <i className="fas fa-exclamation-triangle text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Necesita riego inmediato</p>
                        <p className="text-xs text-red-600">Humedad &lt; 30%</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-orange-50 rounded">
                      <i className="fas fa-clock text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">Programar riego pronto</p>
                        <p className="text-xs text-orange-600">Humedad 30-50%</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-green-50 rounded">
                      <i className="fas fa-check-circle text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Humedad óptima</p>
                        <p className="text-xs text-green-600">Humedad 50-70%</p>
                      </div>
                    </div>
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