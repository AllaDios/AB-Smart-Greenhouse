import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useWebSocket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log("WebSocket connected");
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'sensor-data':
                queryClient.setQueryData(['/api/sensor-data/latest'], data.data);
                queryClient.invalidateQueries({ queryKey: ['/api/sensor-data/history'] });
                break;
                
              case 'system-controls':
                queryClient.setQueryData(['/api/system-controls'], data.data);
                break;
                
              case 'new-alert':
                queryClient.invalidateQueries({ queryKey: ['/api/system-alerts'] });
                toast({
                  title: data.data.title,
                  description: data.data.message,
                  variant: data.data.type === 'error' ? 'destructive' : 'default',
                });
                break;
                
              case 'alert-read':
              case 'alert-deleted':
                queryClient.invalidateQueries({ queryKey: ['/api/system-alerts'] });
                break;
                
              case 'irrigation-schedule-created':
              case 'irrigation-schedule-updated':
              case 'irrigation-schedule-deleted':
                queryClient.invalidateQueries({ queryKey: ['/api/irrigation-schedules'] });
                break;
                
              case 'emergency-stop':
                queryClient.setQueryData(['/api/system-controls'], data.data);
                queryClient.invalidateQueries({ queryKey: ['/api/system-activity'] });
                break;
                
              default:
                console.log('Unknown WebSocket message type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log("WebSocket disconnected");
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect WebSocket...");
            connect();
          }, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient, toast]);

  return wsRef.current;
}
