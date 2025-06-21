import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ArduinoStatus {
  connected: boolean;
  lastUpdate: string;
}

export function ArduinoStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const webSocket = useWebSocket();
  const queryClient = useQueryClient();

  // Query para obtener estado del Arduino
  const { data: status, isLoading } = useQuery<ArduinoStatus>({
    queryKey: ['/api/arduino/status'],
    refetchInterval: 10000 // Actualizar cada 10 segundos
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
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Estado Arduino</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Verificando conexión...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Estado Arduino</CardTitle>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <AlertCircle className="h-3 w-3 mr-1" />
            )}
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
        <CardDescription>
          {isConnected 
            ? 'Datos en tiempo real desde sensores físicos'
            : 'Usando datos simulados'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
              disabled={pumpControlMutation.isPending}
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
              disabled={pumpControlMutation.isPending}
              className="flex-1"
            >
              {pumpControlMutation.isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              Desactivar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}