import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, Sun, Gauge, Waves } from "lucide-react";
import { useState } from "react";

interface ArduinoData {
  soilMoisture: number;
  lightLevel: number;
  waterLevel: number;
  pumpStatus: boolean;
}

export function ArduinoSensors() {
  const [pumpLoading, setPumpLoading] = useState(false);
  
  const { data: sensorData } = useQuery<ArduinoData>({
    queryKey: ['/api/sensor-data/latest'],
    refetchInterval: 10000,
  });

  const { data: arduinoStatus } = useQuery<{ connected: boolean }>({
    queryKey: ['/api/arduino/status'],
    refetchInterval: 20000,
  });

  const handlePumpControl = async (state: boolean) => {
    setPumpLoading(true);
    try {
      const response = await fetch('/api/arduino/pump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
      });
      
      if (!response.ok) {
        throw new Error('Error controlando bomba');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setPumpLoading(false);
    }
  };

  const getSensorStatus = (value: number, type: 'soil' | 'light' | 'water') => {
    switch (type) {
      case 'soil':
        if (value < 30) return { label: 'Seco', color: 'destructive' };
        if (value < 60) return { label: 'Moderado', color: 'secondary' };
        return { label: 'Húmedo', color: 'default' };
      
      case 'light':
        if (value < 300) return { label: 'Bajo', color: 'destructive' };
        if (value < 800) return { label: 'Moderado', color: 'secondary' };
        return { label: 'Alto', color: 'default' };
      
      case 'water':
        if (value < 30) return { label: 'Crítico', color: 'destructive' };
        if (value < 60) return { label: 'Bajo', color: 'secondary' };
        return { label: 'Bueno', color: 'default' };
      
      default:
        return { label: 'Normal', color: 'default' };
    }
  };

  if (!sensorData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Humedad del Suelo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Humedad Suelo</CardTitle>
          <Droplets className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sensorData.soilMoisture}%</div>
          <Badge 
            variant={getSensorStatus(sensorData.soilMoisture, 'soil').color as any}
            className="mt-2"
          >
            {getSensorStatus(sensorData.soilMoisture, 'soil').label}
          </Badge>
        </CardContent>
      </Card>

      {/* Nivel de Luz */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Luz</CardTitle>
          <Sun className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sensorData.lightLevel}</div>
          <div className="text-xs text-muted-foreground">lux</div>
          <Badge 
            variant={getSensorStatus(sensorData.lightLevel, 'light').color as any}
            className="mt-2"
          >
            {getSensorStatus(sensorData.lightLevel, 'light').label}
          </Badge>
        </CardContent>
      </Card>

      {/* Nivel de Agua */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tanque Agua</CardTitle>
          <Waves className="h-4 w-4 text-cyan-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sensorData.waterLevel}%</div>
          <Badge 
            variant={getSensorStatus(sensorData.waterLevel, 'water').color as any}
            className="mt-2"
          >
            {getSensorStatus(sensorData.waterLevel, 'water').label}
          </Badge>
        </CardContent>
      </Card>

      {/* Control de Bomba */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bomba de Agua</CardTitle>
          <Gauge className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Badge variant={sensorData.pumpStatus ? "default" : "secondary"}>
              {sensorData.pumpStatus ? "Activa" : "Inactiva"}
            </Badge>
            
            {arduinoStatus?.connected ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={sensorData.pumpStatus ? "destructive" : "default"}
                  onClick={() => handlePumpControl(!sensorData.pumpStatus)}
                  disabled={pumpLoading}
                  className="text-xs"
                >
                  {pumpLoading ? "..." : sensorData.pumpStatus ? "Apagar" : "Encender"}
                </Button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Arduino desconectado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}