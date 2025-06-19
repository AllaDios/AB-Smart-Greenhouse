import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { SystemAlert } from "@shared/schema";

export function SystemAlerts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: alerts, isLoading } = useQuery<SystemAlert[]>({
    queryKey: ['/api/system-alerts'],
  });

  const dismissAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/system-alerts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-alerts'] });
      toast({
        title: "Alerta eliminada",
        description: "La alerta ha sido eliminada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la alerta.",
        variant: "destructive",
      });
    },
  });

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'bg-red-100 text-red-500',
          title: 'text-red-900',
          message: 'text-red-700',
          time: 'text-red-600',
          button: 'text-red-400 hover:text-red-600',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'bg-yellow-100 text-yellow-500',
          title: 'text-yellow-900',
          message: 'text-yellow-700',
          time: 'text-yellow-600',
          button: 'text-yellow-400 hover:text-yellow-600',
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'bg-blue-100 text-blue-500',
          title: 'text-blue-900',
          message: 'text-blue-700',
          time: 'text-blue-600',
          button: 'text-blue-400 hover:text-blue-600',
        };
    }
  };

  const unreadAlerts = alerts?.filter(alert => !alert.isRead).slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas del Sistema</h3>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
              <div className="w-4 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas del Sistema</h3>
      <div className="space-y-3">
        {unreadAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-check-circle text-4xl mb-2 text-green-500" />
            <p>No hay alertas activas</p>
          </div>
        ) : (
          unreadAlerts.map((alert) => {
            const styles = getAlertStyle(alert.type);
            return (
              <div key={alert.id} className={`flex items-start space-x-3 p-3 border rounded-lg ${styles.container}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${styles.icon}`}>
                  <i className="fas fa-exclamation-triangle text-xs" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${styles.title}`}>{alert.title}</p>
                  <p className={`text-xs mt-1 ${styles.message}`}>{alert.message}</p>
                  <p className={`text-xs mt-2 ${styles.time}`}>
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.button}
                  onClick={() => dismissAlertMutation.mutate(alert.id)}
                  disabled={dismissAlertMutation.isPending}
                >
                  <i className="fas fa-times text-sm" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      {alerts && alerts.length > 3 && (
        <Button variant="ghost" className="w-full mt-4 text-sm text-gray-600 hover:text-gray-800 py-2">
          Ver todas las alertas
          <i className="fas fa-arrow-right ml-1" />
        </Button>
      )}
    </div>
  );
}
