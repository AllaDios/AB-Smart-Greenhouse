import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SystemConfig, SystemControls } from "@shared/schema";

interface ConfigSettings {
  temperatureThresholds: {
    min: number;
    max: number;
    optimal: { min: number; max: number };
  };
  humidityThresholds: {
    min: number;
    max: number;
    optimal: { min: number; max: number };
  };
  soilMoistureThresholds: {
    min: number;
    max: number;
    optimal: { min: number; max: number };
  };
  lightThresholds: {
    min: number;
    max: number;
    optimal: { min: number; max: number };
  };
  autoIrrigation: {
    enabled: boolean;
    moistureThreshold: number;
    duration: number;
  };
  notifications: {
    enabled: boolean;
    criticalOnly: boolean;
  };
  dataRetention: {
    days: number;
  };
}

export default function Configuration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("thresholds");

  const { data: systemControls } = useQuery<SystemControls>({
    queryKey: ['/api/system-controls'],
  });

  const [settings, setSettings] = useState<ConfigSettings>({
    temperatureThresholds: {
      min: 15,
      max: 35,
      optimal: { min: 22, max: 26 }
    },
    humidityThresholds: {
      min: 40,
      max: 90,
      optimal: { min: 60, max: 80 }
    },
    soilMoistureThresholds: {
      min: 30,
      max: 80,
      optimal: { min: 50, max: 70 }
    },
    lightThresholds: {
      min: 200,
      max: 1500,
      optimal: { min: 800, max: 1200 }
    },
    autoIrrigation: {
      enabled: true,
      moistureThreshold: 45,
      duration: 10
    },
    notifications: {
      enabled: true,
      criticalOnly: false
    },
    dataRetention: {
      days: 30
    }
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (config: Partial<ConfigSettings>) => {
      // In a real implementation, this would save to system config
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      return config;
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "Los cambios se han aplicado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveConfigMutation.mutate(settings);
  };

  const resetToDefaults = () => {
    setSettings({
      temperatureThresholds: {
        min: 15,
        max: 35,
        optimal: { min: 22, max: 26 }
      },
      humidityThresholds: {
        min: 40,
        max: 90,
        optimal: { min: 60, max: 80 }
      },
      soilMoistureThresholds: {
        min: 30,
        max: 80,
        optimal: { min: 50, max: 70 }
      },
      lightThresholds: {
        min: 200,
        max: 1500,
        optimal: { min: 800, max: 1200 }
      },
      autoIrrigation: {
        enabled: true,
        moistureThreshold: 45,
        duration: 10
      },
      notifications: {
        enabled: true,
        criticalOnly: false
      },
      dataRetention: {
        days: 30
      }
    });
    toast({
      title: "Configuración restablecida",
      description: "Se han restaurado los valores por defecto.",
    });
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header />
        
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
            <p className="text-gray-600 mt-2">Configura los parámetros del sistema de monitoreo y control</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="thresholds">Umbrales</TabsTrigger>
              <TabsTrigger value="automation">Automatización</TabsTrigger>
              <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
              <TabsTrigger value="system">Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="thresholds" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Temperature */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-thermometer-half text-red-500" />
                      <span>Temperatura</span>
                    </CardTitle>
                    <CardDescription>
                      Configura los rangos de temperatura para el invernadero
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="temp-min">Mínimo (°C)</Label>
                        <Input
                          id="temp-min"
                          type="number"
                          value={settings.temperatureThresholds.min}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            temperatureThresholds: {
                              ...prev.temperatureThresholds,
                              min: Number(e.target.value)
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="temp-max">Máximo (°C)</Label>
                        <Input
                          id="temp-max"
                          type="number"
                          value={settings.temperatureThresholds.max}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            temperatureThresholds: {
                              ...prev.temperatureThresholds,
                              max: Number(e.target.value)
                            }
                          }))}
                        />
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-green-600">Rango Óptimo</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <Input
                          type="number"
                          placeholder="Min óptimo"
                          value={settings.temperatureThresholds.optimal.min}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            temperatureThresholds: {
                              ...prev.temperatureThresholds,
                              optimal: {
                                ...prev.temperatureThresholds.optimal,
                                min: Number(e.target.value)
                              }
                            }
                          }))}
                        />
                        <Input
                          type="number"
                          placeholder="Max óptimo"
                          value={settings.temperatureThresholds.optimal.max}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            temperatureThresholds: {
                              ...prev.temperatureThresholds,
                              optimal: {
                                ...prev.temperatureThresholds.optimal,
                                max: Number(e.target.value)
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Humidity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-tint text-blue-500" />
                      <span>Humedad</span>
                    </CardTitle>
                    <CardDescription>
                      Configura los rangos de humedad relativa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="humidity-min">Mínimo (%)</Label>
                        <Input
                          id="humidity-min"
                          type="number"
                          value={settings.humidityThresholds.min}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            humidityThresholds: {
                              ...prev.humidityThresholds,
                              min: Number(e.target.value)
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="humidity-max">Máximo (%)</Label>
                        <Input
                          id="humidity-max"
                          type="number"
                          value={settings.humidityThresholds.max}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            humidityThresholds: {
                              ...prev.humidityThresholds,
                              max: Number(e.target.value)
                            }
                          }))}
                        />
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-green-600">Rango Óptimo</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <Input
                          type="number"
                          placeholder="Min óptimo"
                          value={settings.humidityThresholds.optimal.min}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            humidityThresholds: {
                              ...prev.humidityThresholds,
                              optimal: {
                                ...prev.humidityThresholds.optimal,
                                min: Number(e.target.value)
                              }
                            }
                          }))}
                        />
                        <Input
                          type="number"
                          placeholder="Max óptimo"
                          value={settings.humidityThresholds.optimal.max}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            humidityThresholds: {
                              ...prev.humidityThresholds,
                              optimal: {
                                ...prev.humidityThresholds.optimal,
                                max: Number(e.target.value)
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Soil Moisture */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-seedling text-green-500" />
                      <span>Humedad del Suelo</span>
                    </CardTitle>
                    <CardDescription>
                      Configura los rangos de humedad del suelo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="soil-min">Mínimo (%)</Label>
                        <Input
                          id="soil-min"
                          type="number"
                          value={settings.soilMoistureThresholds.min}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            soilMoistureThresholds: {
                              ...prev.soilMoistureThresholds,
                              min: Number(e.target.value)
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="soil-max">Máximo (%)</Label>
                        <Input
                          id="soil-max"
                          type="number"
                          value={settings.soilMoistureThresholds.max}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            soilMoistureThresholds: {
                              ...prev.soilMoistureThresholds,
                              max: Number(e.target.value)
                            }
                          }))}
                        />
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-green-600">Rango Óptimo</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <Input
                          type="number"
                          placeholder="Min óptimo"
                          value={settings.soilMoistureThresholds.optimal.min}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            soilMoistureThresholds: {
                              ...prev.soilMoistureThresholds,
                              optimal: {
                                ...prev.soilMoistureThresholds.optimal,
                                min: Number(e.target.value)
                              }
                            }
                          }))}
                        />
                        <Input
                          type="number"
                          placeholder="Max óptimo"
                          value={settings.soilMoistureThresholds.optimal.max}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            soilMoistureThresholds: {
                              ...prev.soilMoistureThresholds,
                              optimal: {
                                ...prev.soilMoistureThresholds.optimal,
                                max: Number(e.target.value)
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Light */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-sun text-yellow-500" />
                      <span>Intensidad Lumínica</span>
                    </CardTitle>
                    <CardDescription>
                      Configura los rangos de intensidad de luz
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="light-min">Mínimo (lux)</Label>
                        <Input
                          id="light-min"
                          type="number"
                          value={settings.lightThresholds.min}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            lightThresholds: {
                              ...prev.lightThresholds,
                              min: Number(e.target.value)
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="light-max">Máximo (lux)</Label>
                        <Input
                          id="light-max"
                          type="number"
                          value={settings.lightThresholds.max}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            lightThresholds: {
                              ...prev.lightThresholds,
                              max: Number(e.target.value)
                            }
                          }))}
                        />
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-green-600">Rango Óptimo</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <Input
                          type="number"
                          placeholder="Min óptimo"
                          value={settings.lightThresholds.optimal.min}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            lightThresholds: {
                              ...prev.lightThresholds,
                              optimal: {
                                ...prev.lightThresholds.optimal,
                                min: Number(e.target.value)
                              }
                            }
                          }))}
                        />
                        <Input
                          type="number"
                          placeholder="Max óptimo"
                          value={settings.lightThresholds.optimal.max}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            lightThresholds: {
                              ...prev.lightThresholds,
                              optimal: {
                                ...prev.lightThresholds.optimal,
                                max: Number(e.target.value)
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-cog text-blue-500" />
                    <span>Riego Automático</span>
                  </CardTitle>
                  <CardDescription>
                    Configura el sistema de riego automático basado en sensores
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-irrigation">Habilitar Riego Automático</Label>
                      <p className="text-sm text-gray-500">El sistema regará automáticamente cuando sea necesario</p>
                    </div>
                    <Switch
                      id="auto-irrigation"
                      checked={settings.autoIrrigation.enabled}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        autoIrrigation: {
                          ...prev.autoIrrigation,
                          enabled: checked
                        }
                      }))}
                    />
                  </div>
                  
                  {settings.autoIrrigation.enabled && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="moisture-threshold">Umbral de Humedad (%)</Label>
                          <Input
                            id="moisture-threshold"
                            type="number"
                            value={settings.autoIrrigation.moistureThreshold}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              autoIrrigation: {
                                ...prev.autoIrrigation,
                                moistureThreshold: Number(e.target.value)
                              }
                            }))}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Activar riego cuando la humedad esté por debajo de este valor
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="irrigation-duration">Duración (minutos)</Label>
                          <Input
                            id="irrigation-duration"
                            type="number"
                            value={settings.autoIrrigation.duration}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              autoIrrigation: {
                                ...prev.autoIrrigation,
                                duration: Number(e.target.value)
                              }
                            }))}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Tiempo de riego por activación automática
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-robot text-purple-500" />
                    <span>Estado del Sistema Automático</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <i className="fas fa-shower text-green-500 text-2xl mb-2" />
                      <p className="text-sm font-medium text-gray-900">Riego</p>
                      <Badge variant={systemControls?.irrigation ? "default" : "secondary"}>
                        {systemControls?.irrigation ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <i className="fas fa-fan text-blue-500 text-2xl mb-2" />
                      <p className="text-sm font-medium text-gray-900">Ventilación</p>
                      <Badge variant={systemControls?.ventilation ? "default" : "secondary"}>
                        {systemControls?.ventilation ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <i className="fas fa-lightbulb text-yellow-500 text-2xl mb-2" />
                      <p className="text-sm font-medium text-gray-900">Iluminación</p>
                      <Badge variant={systemControls?.lighting ? "default" : "secondary"}>
                        {systemControls?.lighting ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <i className="fas fa-fire text-red-500 text-2xl mb-2" />
                      <p className="text-sm font-medium text-gray-900">Calefacción</p>
                      <Badge variant={systemControls?.heating ? "default" : "secondary"}>
                        {systemControls?.heating ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-bell text-yellow-500" />
                    <span>Configuración de Notificaciones</span>
                  </CardTitle>
                  <CardDescription>
                    Personaliza cómo y cuándo recibir alertas del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications-enabled">Habilitar Notificaciones</Label>
                      <p className="text-sm text-gray-500">Recibir alertas del sistema en tiempo real</p>
                    </div>
                    <Switch
                      id="notifications-enabled"
                      checked={settings.notifications.enabled}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          enabled: checked
                        }
                      }))}
                    />
                  </div>
                  
                  {settings.notifications.enabled && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="critical-only">Solo Alertas Críticas</Label>
                          <p className="text-sm text-gray-500">Mostrar únicamente errores y alertas críticas</p>
                        </div>
                        <Switch
                          id="critical-only"
                          checked={settings.notifications.criticalOnly}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              criticalOnly: checked
                            }
                          }))}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-database text-blue-500" />
                    <span>Gestión de Datos</span>
                  </CardTitle>
                  <CardDescription>
                    Configura la retención y gestión de datos del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="data-retention">Retención de Datos (días)</Label>
                    <Input
                      id="data-retention"
                      type="number"
                      value={settings.dataRetention.days}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        dataRetention: {
                          days: Number(e.target.value)
                        }
                      }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Los datos se mantendrán durante este período antes de ser archivados
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-info-circle text-green-500" />
                    <span>Información del Sistema</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Versión del Sistema</Label>
                      <p className="text-sm text-gray-600">v2.1.0</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Última Actualización</Label>
                      <p className="text-sm text-gray-600">19 de Junio, 2025</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Estado del Sistema</Label>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <i className="fas fa-check-circle mr-1" />
                        Operativo
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tiempo Activo</Label>
                      <p className="text-sm text-gray-600">2 días, 14 horas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="flex items-center space-x-2"
            >
              <i className="fas fa-undo" />
              <span>Restaurar Valores por Defecto</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <i className="fas fa-download mr-2" />
                Exportar Configuración
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveConfigMutation.isPending}
                className="bg-greenhouse-500 hover:bg-greenhouse-600 text-white"
              >
                {saveConfigMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}