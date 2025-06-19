import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { SystemAlert } from "@shared/schema";

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  const { data: alerts } = useQuery<SystemAlert[]>({
    queryKey: ['/api/system-alerts'],
  });

  const unreadAlerts = alerts?.filter(alert => !alert.isRead) || [];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleEmergencyStop = async () => {
    try {
      await apiRequest('POST', '/api/actions/emergency-stop');
      toast({
        title: "Parada de Emergencia Activada",
        description: "Todos los sistemas han sido desactivados por seguridad.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo ejecutar la parada de emergencia.",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return date.toLocaleDateString('es-ES', options);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard de Control</h1>
            <p className="text-sm text-gray-500">{formatDateTime(currentTime)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Alerts Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-greenhouse-500 focus:ring-offset-2 rounded-lg"
            >
              <i className="fas fa-bell text-xl" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 transform translate-x-1 -translate-y-1" />
              )}
            </Button>
          </div>

          {/* Emergency Stop */}
          <Button
            onClick={handleEmergencyStop}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <i className="fas fa-stop-circle" />
            <span>Parada de Emergencia</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
