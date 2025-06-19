import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SystemControls } from "@shared/schema";

export function ControlPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: controls, isLoading } = useQuery<SystemControls>({
    queryKey: ['/api/system-controls'],
  });

  const updateControlsMutation = useMutation({
    mutationFn: async (newControls: Partial<SystemControls>) => {
      const response = await apiRequest('PUT', '/api/system-controls', newControls);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-controls'] });
      toast({
        title: "Control actualizado",
        description: "Los controles del sistema han sido actualizados exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el control del sistema.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (control: keyof SystemControls, value: boolean) => {
    if (controls) {
      updateControlsMutation.mutate({ [control]: value });
    }
  };

  const controlItems = [
    {
      key: 'irrigation' as keyof SystemControls,
      name: "Sistema de Riego",
      status: controls?.irrigation ? "Activo" : "Inactivo",
      icon: "fas fa-shower",
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
    },
    {
      key: 'ventilation' as keyof SystemControls,
      name: "Ventilación",
      status: controls?.ventilation ? "Activo" : "Inactivo",
      icon: "fas fa-fan",
      iconColor: "text-green-500",
      iconBg: "bg-green-100",
    },
    {
      key: 'lighting' as keyof SystemControls,
      name: "Luz Artificial",
      status: controls?.lighting ? "Activo" : "Automático",
      icon: "fas fa-lightbulb",
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-100",
    },
    {
      key: 'heating' as keyof SystemControls,
      name: "Calefacción",
      status: controls?.heating ? "Activo" : "Inactivo",
      icon: "fas fa-fire",
      iconColor: "text-red-500",
      iconBg: "bg-red-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Control Manual</h3>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>
              <div className="w-11 h-6 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Control Manual</h3>
      <div className="space-y-4">
        {controlItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${item.iconBg} rounded-full flex items-center justify-center`}>
                <i className={`${item.icon} ${item.iconColor}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">{item.status}</p>
              </div>
            </div>
            <Switch
              checked={controls?.[item.key] as boolean || false}
              onCheckedChange={(checked) => handleToggle(item.key, checked)}
              disabled={updateControlsMutation.isPending}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
