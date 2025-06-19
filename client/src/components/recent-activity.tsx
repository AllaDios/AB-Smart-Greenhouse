import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { SystemActivity } from "@shared/schema";

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery<SystemActivity[]>({
    queryKey: ['/api/system-activity', { limit: 10 }],
    queryFn: async () => {
      const response = await fetch('/api/system-activity?limit=10', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    },
  });

  const getIconColor = (icon: string) => {
    if (icon.includes('shower')) return 'bg-green-100 text-green-500';
    if (icon.includes('thermometer')) return 'bg-yellow-100 text-yellow-500';
    if (icon.includes('fan')) return 'bg-blue-100 text-blue-500';
    if (icon.includes('cog')) return 'bg-purple-100 text-purple-500';
    if (icon.includes('stop')) return 'bg-red-100 text-red-500';
    return 'bg-gray-100 text-gray-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
              <div className="text-right">
                <div className="h-3 bg-gray-200 rounded w-12 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        <button className="text-sm text-greenhouse-600 hover:text-greenhouse-700 font-medium">
          Ver todo el historial
        </button>
      </div>
      
      <div className="space-y-4">
        {activities?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-history text-4xl mb-2" />
            <p>No hay actividad reciente</p>
          </div>
        ) : (
          activities?.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(activity.icon)}`}>
                <i className={activity.icon} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                {activity.details && (
                  <p className="text-xs text-gray-500">{activity.details}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {new Date(activity.createdAt).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(activity.createdAt), { locale: es })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
