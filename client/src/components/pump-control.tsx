import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Droplets, Power, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import type { SensorData } from "@shared/schema";

export function PumpControl() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: sensorData } = useQuery<SensorData>({
    queryKey: ['/api/sensor-data/latest'],
    refetchInterval: 10000,
  });

  const { data: arduinoStatus } = useQuery<{ connected: boolean }>({
    queryKey: ['/api/arduino/status'],
    refetchInterval: 20000,
  });

  const pumpMutation = useMutation({
    mutationFn: async (state: boolean) => {
      const response = await fetch(`/api/arduino/pump`, {
        method: 'POST',
        body: JSON.stringify({ state }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to control pump');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sensor-data/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system-activity'] });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const getWaterLevelStatus = (level: number) => {
    if (level < 20) return { label: 'Crítico', color: 'destructive', icon: AlertTriangle };
    if (level < 50) return { label: 'Bajo', color: 'secondary', icon: Droplets };
    return { label: 'Bueno', color: 'default', icon: CheckCircle };
  };

  const getWaterLevelColor = (level: number) => {
    if (level < 20) return 'bg-red-500';
    if (level < 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (!sensorData) return null;

  const waterLevel = sensorData.waterLevel || 0;
  const pumpStatus = sensorData.pumpStatus || false;
  const waterStatus = getWaterLevelStatus(waterLevel);
  const StatusIcon = waterStatus.icon;

  const handlePumpToggle = async () => {
    setIsLoading(true);
    pumpMutation.mutate(!pumpStatus);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          Sistema de Agua
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Water Tank Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tanque de Agua</span>
            <div className="flex items-center gap-1">
              <StatusIcon className="h-4 w-4" />
              <Badge variant={waterStatus.color as any} className="text-xs">
                {waterStatus.label}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-1">
            <Progress 
              value={waterLevel} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Vacío</span>
              <span>{waterLevel}%</span>
              <span>Lleno</span>
            </div>
          </div>
        </div>

        {/* Tank Visual Indicator */}
        <div className="flex justify-center py-4">
          <div className="relative w-24 h-32 border-4 border-gray-300 rounded-lg bg-gray-100 overflow-hidden">
            {/* Water Wave Animation */}
            <div
              className="tank-wave"
              style={{ height: `${waterLevel}%` }}
            ></div>
            
            {/* Water Level Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white drop-shadow-lg">
                {waterLevel}%
              </span>
            </div>
            
            {/* Bubbles Animation */}
            {waterLevel > 10 && (
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bottom-0 w-1 h-1 bg-blue-200 rounded-full opacity-50"
                    style={{
                      left: `${Math.random() * 90 + 5}%`,
                      animation: `bubble-rise 3s ease-in-out ${Math.random() * 3}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pump Status and Control */}
        <div className="space-y-3 border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado de la Bomba</span>
            <Badge variant={pumpStatus ? "default" : "secondary"}>
              {pumpStatus ? "Activa" : "Inactiva"}
            </Badge>
          </div>

          {arduinoStatus?.connected ? (
            <Button
              onClick={handlePumpToggle}
              disabled={isLoading || pumpMutation.isPending}
              variant={pumpStatus ? "destructive" : "default"}
              className="w-full"
              size="sm"
            >
              <Power className="h-4 w-4 mr-2" />
              {isLoading || pumpMutation.isPending ? (
                "Procesando..."
              ) : pumpStatus ? (
                "Apagar Bomba"
              ) : (
                "Encender Bomba"
              )}
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground text-center p-2 bg-gray-50 rounded">
              Arduino desconectado - Control manual no disponible
            </div>
          )}

          {waterLevel < 20 && (
            <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
              <AlertTriangle className="h-3 w-3" />
              Nivel de agua crítico - Revisar tanque
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}