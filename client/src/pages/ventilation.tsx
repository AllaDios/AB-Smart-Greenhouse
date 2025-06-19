import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SystemControls, SensorData } from "@shared/schema";

export default function Ventilation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [fanSpeed, setFanSpeed] = useState([75]);

  const { data: systemControls } = useQuery<SystemControls>({
    queryKey: ['/api/system-controls'],
  });

  const { data: currentSensor } = useQuery<SensorData>({
    queryKey: ['/api/sensor-data/latest'],
    refetchInterval: 30000,
  });

  const updateControlsMutation = useMutation({
    mutationFn: async (newControls: Partial<SystemControls>) => {
      const response = await apiRequest('PUT', '/api/system-controls', newControls);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-controls'] });
      toast({
        title: "Sistema actualizado",
        description: "La configuración de ventilación ha sido actualizada.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el sistema de ventilación.",
        variant: "destructive",
      });
    },
  });

  const getVentilationStatus = (isActive: boolean, temp: number, humidity: number) => {
    if (!isActive) return { status: "Inactivo", color: "bg-gray-100 text-gray-800", recommendation: "Sistema desactivado" };
    
    if (temp > 28 || humidity > 85) {
      return { status: "Crítico", color: "bg-red-100 text-red-800", recommendation: "Ventilación máxima requerida" };
    }
    if (temp > 25 || humidity > 75) {
      return { status: "Alto", color: "bg-orange-100 text-orange-800", recommendation: "Aumentar ventilación" };
    }
    return { status: "Normal", color: "bg-green-100 text-green-800", recommendation: "Funcionamiento óptimo" };
  };

  const currentTemp = currentSensor?.temperature || 0;
  const currentHumidity = currentSensor?.humidity || 0;
  const isVentilationActive = systemControls?.ventilation || false;
  const ventilationStatus = getVentilationStatus(isVentilationActive, currentTemp, currentHumidity);

  const handleToggleVentilation = (enabled: boolean) => {
    updateControlsMutation.mutate({ ventilation: enabled });
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header />
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sistema de Ventilación</h1>
              <p className="text-gray-600 mt-2">Control y monitoreo del sistema de circulación de aire</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={ventilationStatus.color}>
                <i className="fas fa-fan mr-2" />
                {ventilationStatus.status}
              </Badge>
            </div>
          </div>

          {/* Ventilation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-fan text-green-500" />
                <span>Estado del Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${isVentilationActive ? 'text-green-500' : 'text-gray-400'}`}>
                    <i className={`fas fa-fan ${isVentilationActive ? 'fa-spin' : ''}`} />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {isVentilationActive ? 'Sistema Activo' : 'Sistema Inactivo'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">{currentTemp.toFixed(1)}°C</div>
                  <p className="text-sm text-gray-500 mt-1">Temperatura Actual</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-700">{currentHumidity.toFixed(1)}%</div>
                  <p className="text-sm text-gray-500 mt-1">Humedad Actual</p>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${ventilationStatus.color.includes('green') ? 'text-green-600' : ventilationStatus.color.includes('red') ? 'text-red-600' : 'text-orange-600'}`}>
                    {ventilationStatus.recommendation}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Recomendación</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Control Manual</CardTitle>
              <CardDescription>Gestiona la ventilación manualmente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ventilation-toggle" className="text-base font-medium">
                    Sistema de Ventilación
                  </Label>
                  <p className="text-sm text-gray-500">Activar o desactivar el sistema de ventilación</p>
                </div>
                <Switch
                  id="ventilation-toggle"
                  checked={isVentilationActive}
                  onCheckedChange={handleToggleVentilation}
                  disabled={updateControlsMutation.isPending}
                />
              </div>

              {isVentilationActive && (
                <>
                  <div className="border-t pt-6">
                    <Label className="text-base font-medium mb-4 block">
                      Velocidad del Ventilador: {fanSpeed[0]}%
                    </Label>
                    <Slider
                      value={fanSpeed}
                      onValueChange={setFanSpeed}
                      max={100}
                      min={25}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>Mínimo (25%)</span>
                      <span>Medio (50%)</span>
                      <span>Alto (75%)</span>
                      <span>Máximo (100%)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setFanSpeed([25])}
                      className="h-auto flex flex-col items-center p-4"
                    >
                      <i className="fas fa-leaf text-green-500 text-xl mb-2" />
                      <span className="font-medium">Eco</span>
                      <span className="text-sm text-gray-500">25% - Bajo consumo</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setFanSpeed([75])}
                      className="h-auto flex flex-col items-center p-4"
                    >
                      <i className="fas fa-wind text-blue-500 text-xl mb-2" />
                      <span className="font-medium">Normal</span>
                      <span className="text-sm text-gray-500">75% - Uso estándar</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setFanSpeed([100])}
                      className="h-auto flex flex-col items-center p-4"
                    >
                      <i className="fas fa-bolt text-red-500 text-xl mb-2" />
                      <span className="font-medium">Turbo</span>
                      <span className="text-sm text-gray-500">100% - Máxima potencia</span>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Environmental Impact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-thermometer-half text-red-500" />
                  <span>Control de Temperatura</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Reducción de Calor</p>
                    <p className="text-sm text-gray-500">Ventilación activa puede reducir 2-5°C</p>
                  </div>
                  <Badge variant={currentTemp > 26 ? "destructive" : "secondary"}>
                    {currentTemp > 26 ? "Requerido" : "Opcional"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Temperatura objetivo: 22-26°C</span>
                    <span className={currentTemp > 26 ? 'text-red-600' : currentTemp < 22 ? 'text-blue-600' : 'text-green-600'}>
                      {currentTemp.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        currentTemp > 30 ? 'bg-red-500' :
                        currentTemp > 26 ? 'bg-orange-400' :
                        currentTemp >= 22 ? 'bg-green-400' :
                        'bg-blue-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, ((currentTemp - 15) / 20) * 100))}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-tint text-blue-500" />
                  <span>Control de Humedad</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Reducción de Humedad</p>
                    <p className="text-sm text-gray-500">Ayuda a prevenir enfermedades fúngicas</p>
                  </div>
                  <Badge variant={currentHumidity > 80 ? "destructive" : "secondary"}>
                    {currentHumidity > 80 ? "Crítico" : "Normal"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Humedad objetivo: 60-80%</span>
                    <span className={currentHumidity > 85 ? 'text-red-600' : currentHumidity < 50 ? 'text-orange-600' : 'text-green-600'}>
                      {currentHumidity.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        currentHumidity > 90 ? 'bg-red-500' :
                        currentHumidity > 80 ? 'bg-orange-400' :
                        currentHumidity >= 60 ? 'bg-green-400' :
                        'bg-blue-400'
                      }`}
                      style={{ width: `${currentHumidity}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ventilation Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-map-marked-alt text-purple-500" />
                <span>Zonas de Ventilación</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <i className="fas fa-seedling text-green-500 text-2xl mb-2" />
                  <h4 className="font-semibold text-green-800">Zona de Crecimiento</h4>
                  <p className="text-sm text-green-600">Ventilación suave continua</p>
                  <Badge className="mt-2 bg-green-100 text-green-800">Activa</Badge>
                </div>
                
                <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <i className="fas fa-flower text-blue-500 text-2xl mb-2" />
                  <h4 className="font-semibold text-blue-800">Zona de Floración</h4>
                  <p className="text-sm text-blue-600">Control preciso de humedad</p>
                  <Badge className="mt-2 bg-blue-100 text-blue-800">Monitoreando</Badge>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <i className="fas fa-spa text-yellow-500 text-2xl mb-2" />
                  <h4 className="font-semibold text-yellow-800">Zona de Propagación</h4>
                  <p className="text-sm text-yellow-600">Humedad alta controlada</p>
                  <Badge className="mt-2 bg-yellow-100 text-yellow-800">Especial</Badge>
                </div>
                
                <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <i className="fas fa-warehouse text-gray-500 text-2xl mb-2" />
                  <h4 className="font-semibold text-gray-800">Zona de Almacén</h4>
                  <p className="text-sm text-gray-600">Ventilación básica</p>
                  <Badge className="mt-2 bg-gray-100 text-gray-800">Estándar</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips and Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-lightbulb text-yellow-500" />
                <span>Consejos de Ventilación</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Mejores Prácticas</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-check text-green-500 mt-0.5" />
                      <span>Mantén ventilación continua durante el día</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-check text-green-500 mt-0.5" />
                      <span>Reduce velocidad durante la noche</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-check text-green-500 mt-0.5" />
                      <span>Aumenta ventilación después del riego</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-check text-green-500 mt-0.5" />
                      <span>Monitorea temperatura y humedad constantemente</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Indicadores de Alerta</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-2 bg-red-50 rounded">
                      <i className="fas fa-exclamation-triangle text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Ventilación urgente</p>
                        <p className="text-xs text-red-600">Temp &gt; 30°C o Humedad &gt; 90%</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-orange-50 rounded">
                      <i className="fas fa-clock text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">Aumentar ventilación</p>
                        <p className="text-xs text-orange-600">Temp 26-30°C o Humedad 80-90%</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-green-50 rounded">
                      <i className="fas fa-check-circle text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Condiciones óptimas</p>
                        <p className="text-xs text-green-600">Temp 22-26°C y Humedad 60-80%</p>
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