import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { IrrigationSchedule } from "@shared/schema";

export function IrrigationSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: schedules, isLoading } = useQuery<IrrigationSchedule[]>({
    queryKey: ['/api/irrigation-schedules'],
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
        description: "El programa de riego ha sido actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el programa de riego.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (schedule: IrrigationSchedule) => {
    if (!schedule.isActive) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    if (schedule.isAutomatic) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">En Espera</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>;
  };

  const getScheduleType = (schedule: IrrigationSchedule) => {
    if (schedule.isAutomatic) {
      return "Activado automáticamente si humedad < 30%";
    }
    return `${schedule.time} - ${schedule.duration} segundos`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Programa de Riego</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-48" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-6 bg-gray-200 rounded w-16" />
                <div className="w-8 h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Programa de Riego</h3>
      <div className="space-y-4">
        {schedules?.map((schedule) => (
          <div key={schedule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                schedule.isAutomatic ? 'bg-orange-100' : 'bg-blue-100'
              }`}>
                <i className={`fas ${
                  schedule.isAutomatic ? 'fa-exclamation-triangle text-orange-500' : 'fa-shower text-blue-500'
                }`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{schedule.name}</p>
                <p className="text-sm text-gray-500">{getScheduleType(schedule)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
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
                <i className="fas fa-edit" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <Button className="w-full mt-4 bg-greenhouse-500 hover:bg-greenhouse-600 text-white">
        <i className="fas fa-plus mr-2" />
        Agregar Programa
      </Button>
    </div>
  );
}
