import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function QuickActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const irrigateNowMutation = useMutation({
    mutationFn: async (duration: number) => {
      const response = await apiRequest('POST', '/api/actions/irrigate', { duration });
      return response.json();
    },
    onSuccess: (_, duration) => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-controls'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system-activity'] });
      toast({
        title: "Riego iniciado",
        description: `El sistema de riego se ha activado por ${duration} segundos.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo iniciar el riego.",
        variant: "destructive",
      });
    },
  });

  const handleTakePhoto = () => {
    toast({
      title: "Función en desarrollo",
      description: "La función de tomar fotos estará disponible próximamente.",
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: "Función en desarrollo",
      description: "La función de generar reportes estará disponible próximamente.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Función en desarrollo",
      description: "La función de exportar datos estará disponible próximamente.",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center p-4 h-auto hover:bg-gray-50 transition-colors"
          onClick={() => irrigateNowMutation.mutate(10)}
          disabled={irrigateNowMutation.isPending}
        >
          <i className="fas fa-shower text-blue-500 text-xl mb-2" />
          <span className="text-sm font-medium text-gray-900">
            {irrigateNowMutation.isPending ? "Iniciando..." : "Regar Ahora (10s)"}
          </span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center p-4 h-auto hover:bg-gray-50 transition-colors"
          onClick={handleTakePhoto}
        >
          <i className="fas fa-camera text-green-500 text-xl mb-2" />
          <span className="text-sm font-medium text-gray-900">Tomar Foto</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center p-4 h-auto hover:bg-gray-50 transition-colors"
          onClick={handleGenerateReport}
        >
          <i className="fas fa-chart-line text-purple-500 text-xl mb-2" />
          <span className="text-sm font-medium text-gray-900">Generar Reporte</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center p-4 h-auto hover:bg-gray-50 transition-colors"
          onClick={handleExportData}
        >
          <i className="fas fa-download text-orange-500 text-xl mb-2" />
          <span className="text-sm font-medium text-gray-900">Exportar Datos</span>
        </Button>
      </div>
    </div>
  );
}
