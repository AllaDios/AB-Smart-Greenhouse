import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { SystemAlert } from "@shared/schema";

export default function Alerts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: alerts, isLoading } = useQuery<SystemAlert[]>({
    queryKey: ['/api/system-alerts'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PUT', `/api/system-alerts/${id}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-alerts'] });
      toast({
        title: "Alerta marcada como leída",
        description: "La alerta ha sido marcada como leída.",
      });
    },
  });

  const deleteAlertMutation = useMutation({
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
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadAlerts = alerts?.filter(alert => !alert.isRead) || [];
      await Promise.all(
        unreadAlerts.map(alert => 
          apiRequest('PUT', `/api/system-alerts/${alert.id}/read`)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-alerts'] });
      toast({
        title: "Todas las alertas marcadas como leídas",
        description: "Se han marcado todas las alertas como leídas.",
      });
    },
  });

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'bg-red-100 text-red-500',
          iconName: 'fas fa-exclamation-circle',
          title: 'text-red-900',
          message: 'text-red-700',
          time: 'text-red-600',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'bg-yellow-100 text-yellow-500',
          iconName: 'fas fa-exclamation-triangle',
          title: 'text-yellow-900',
          message: 'text-yellow-700',
          time: 'text-yellow-600',
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'bg-blue-100 text-blue-500',
          iconName: 'fas fa-info-circle',
          title: 'text-blue-900',
          message: 'text-blue-700',
          time: 'text-blue-600',
        };
    }
  };

  const filteredAlerts = alerts?.filter(alert => {
    const matchesType = filterType === "all" || alert.type === filterType;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "read" && alert.isRead) || 
      (filterStatus === "unread" && !alert.isRead);
    const matchesSearch = searchTerm === "" || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  }) || [];

  const alertStats = {
    total: alerts?.length || 0,
    unread: alerts?.filter(alert => !alert.isRead).length || 0,
    errors: alerts?.filter(alert => alert.type === 'error').length || 0,
    warnings: alerts?.filter(alert => alert.type === 'warning').length || 0,
    info: alerts?.filter(alert => alert.type === 'info').length || 0,
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header />
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Centro de Alertas</h1>
              <p className="text-gray-600 mt-2">Gestión completa de notificaciones y alertas del sistema</p>
            </div>
            <div className="flex items-center space-x-3">
              {alertStats.unread > 0 && (
                <Button
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  variant="outline"
                >
                  <i className="fas fa-check-double mr-2" />
                  Marcar Todas como Leídas
                </Button>
              )}
              <Badge variant="secondary">
                {alertStats.unread} sin leer
              </Badge>
            </div>
          </div>

          {/* Alert Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-700">{alertStats.total}</div>
                <p className="text-sm text-gray-500">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{alertStats.unread}</div>
                <p className="text-sm text-gray-500">Sin Leer</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{alertStats.errors}</div>
                <p className="text-sm text-gray-500">Errores</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{alertStats.warnings}</div>
                <p className="text-sm text-gray-500">Advertencias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{alertStats.info}</div>
                <p className="text-sm text-gray-500">Información</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar alertas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="error">Errores</SelectItem>
                    <SelectItem value="warning">Advertencias</SelectItem>
                    <SelectItem value="info">Información</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="unread">Sin leer</SelectItem>
                    <SelectItem value="read">Leídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Alertas</CardTitle>
              <CardDescription>
                {filteredAlerts.length} de {alertStats.total} alertas mostradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded" />
                        <div className="w-8 h-8 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-bell-slash text-4xl mb-4" />
                  <p className="text-lg font-medium mb-2">No se encontraron alertas</p>
                  <p className="text-sm">
                    {searchTerm || filterType !== "all" || filterStatus !== "all" 
                      ? "Intenta ajustar los filtros de búsqueda" 
                      : "El sistema está funcionando correctamente"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => {
                    const styles = getAlertStyle(alert.type);
                    return (
                      <div 
                        key={alert.id} 
                        className={`flex items-start space-x-4 p-4 border rounded-lg transition-all ${styles.container} ${
                          alert.isRead ? 'opacity-75' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
                          <i className={`${styles.iconName} text-sm`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`font-medium ${styles.title} ${!alert.isRead ? 'font-semibold' : ''}`}>
                                {alert.title}
                                {!alert.isRead && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block" />}
                              </p>
                              <p className={`text-sm mt-1 ${styles.message}`}>{alert.message}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <p className={`text-xs ${styles.time}`}>
                                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: es })}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {alert.type === 'error' ? 'Error' : alert.type === 'warning' ? 'Advertencia' : 'Info'}
                                </Badge>
                                {alert.isRead && (
                                  <Badge variant="outline" className="text-xs bg-gray-100">
                                    Leída
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {!alert.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsReadMutation.mutate(alert.id)}
                                  disabled={markAsReadMutation.isPending}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Marcar como leída"
                                >
                                  <i className="fas fa-check" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAlertMutation.mutate(alert.id)}
                                disabled={deleteAlertMutation.isPending}
                                className="text-red-500 hover:text-red-700"
                                title="Eliminar alerta"
                              >
                                <i className="fas fa-trash" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert Management Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-lightbulb text-yellow-500" />
                <span>Gestión de Alertas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Tipos de Alertas</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-exclamation-circle text-xs" />
                      </div>
                      <div>
                        <p className="font-medium text-red-800">Errores</p>
                        <p className="text-sm text-red-600">Problemas críticos que requieren atención inmediata</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-xs" />
                      </div>
                      <div>
                        <p className="font-medium text-yellow-800">Advertencias</p>
                        <p className="text-sm text-yellow-600">Condiciones que podrían requerir intervención</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-info-circle text-xs" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">Información</p>
                        <p className="text-sm text-blue-600">Notificaciones generales del sistema</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Mejores Prácticas</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-check text-green-500 mt-0.5" />
                      <span>Revisa las alertas críticas diariamente</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-check text-green-500 mt-0.5" />
                      <span>Marca como leídas las alertas procesadas</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-check text-green-500 mt-0.5" />
                      <span>Configura umbrales apropiados para evitar spam</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <i className="fas fa-check text-green-500 mt-0.5" />
                      <span>Elimina alertas antiguas para mantener orden</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}