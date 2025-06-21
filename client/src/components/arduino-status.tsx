import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ArduinoStatus {
  connected: boolean;
  lastUpdate: string;
}

interface ArduinoData {
  emergencyMode?: boolean;
}

export function ArduinoStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const webSocket = useWebSocket();
  const queryClient = useQueryClient();

  // Query para obtener estado del Arduino
  const { data: status, isLoading } = useQuery<ArduinoStatus>({
    queryKey: ['/api/arduino/status'],
    refetchInterval: 20000 // Actualizar cada 20 segundos
  });

  // Query para obtener datos del Arduino (incluyendo estado de emergencia)
  const { data: arduinoData } = useQuery<ArduinoData>({
    queryKey: ['/api/sensor-data/latest'],
    refetchInterval: 10000,
  });

  // Mutation para controlar la bomba manualmente
  const pumpControlMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['/api/system-controls'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system-activity'] });
    }
  });

  // Escuchar mensajes WebSocket para estado del Arduino
  useEffect(() => {
    if (webSocket && webSocket.lastMessage) {
      try {
        const message = JSON.parse(webSocket.lastMessage.data);
        if (message.type === 'arduino-status') {
          setIsConnected(message.connected);
        } else if (message.type === 'arduino-data') {
          setIsConnected(true);
          if (message.data && message.data.emergencyMode !== undefined) {
            setIsEmergencyMode(message.data.emergencyMode);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [webSocket.lastMessage]);

  // Actualizar estado basado en la query
  useEffect(() => {
    if (status) {
      setIsConnected(status.connected);
    }
  }, [status]);

  // Actualizar estado de emergencia basado en los datos del Arduino
  useEffect(() => {
    if (arduinoData && arduinoData.emergencyMode !== undefined) {
      setIsEmergencyMode(arduinoData.emergencyMode);
    }
  }, [arduinoData]);

  const handlePumpControl = async (state: boolean) => {
    try {
      await pumpControlMutation.mutateAsync(state);
    } catch (error) {
      console.error('Error controlling pump:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            <span>Estado Arduino</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isConnected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          )}
          <span>Estado Arduino</span>
          {isEmergencyMode && (
            <Badge variant="destructive" className="ml-auto">
              EMERGENCIA
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Conexión:</span>
          <span className={isConnected ? 'text-green-600' : 'text-orange-600'}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sensores:</span>
          <span className={isConnected ? 'text-green-600' : 'text-orange-600'}>
            {isConnected ? 'Activos' : 'Simulados'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Última actualización:</span>
          <span className="text-xs">
            {status?.lastUpdate 
              ? new Date(status.lastUpdate).toLocaleTimeString()
              : 'N/A'
            }
          </span>
        </div>

        {isEmergencyMode && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            <AlertTriangle className="h-3 w-3" />
            <span>Modo de emergencia activo - Todos los controles bloqueados</span>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Control Bomba</span>
            <Zap className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePumpControl(true)}
              disabled={pumpControlMutation.isPending || isEmergencyMode}
              className="flex-1"
            >
              {pumpControlMutation.isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              Activar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePumpControl(false)}
              disabled={pumpControlMutation.isPending || isEmergencyMode}
              className="flex-1"
            >
              {pumpControlMutation.isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              Desactivar
            </Button>
          </div>
          {isEmergencyMode && (
            <p className="text-xs text-red-600 mt-1">
              Controles bloqueados por emergencia
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}