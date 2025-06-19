import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MetricCard } from "@/components/metric-card";
import { EnvironmentChart } from "@/components/environment-chart";
import { ControlPanel } from "@/components/control-panel";
import { IrrigationSchedule } from "@/components/irrigation-schedule";
import { SystemAlerts } from "@/components/system-alerts";
import { RecentActivity } from "@/components/recent-activity";
import { QuickActions } from "@/components/quick-actions";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { Skeleton } from "@/components/ui/skeleton";
import type { SensorData, SystemControls } from "@shared/schema";

export default function Dashboard() {
  const { data: sensorData, isLoading: sensorLoading } = useQuery<SensorData>({
    queryKey: ['/api/sensor-data/latest'],
    refetchInterval: 30000,
  });

  const { data: systemControls, isLoading: controlsLoading } = useQuery<SystemControls>({
    queryKey: ['/api/system-controls'],
  });

  // WebSocket connection for real-time updates
  useWebSocket();

  if (sensorLoading || controlsLoading) {
    return (
      <div className="min-h-screen flex">
        <div className="w-64 bg-white shadow-lg border-r border-gray-200">
          <Skeleton className="h-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-16 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header />
        
        <div className="p-6 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Temperatura"
              value={`${sensorData?.temperature.toFixed(1) || '--'}°C`}
              trend={sensorData ? `${sensorData.temperature > 24 ? '+' : ''}${(sensorData.temperature - 24).toFixed(1)}°C desde ayer` : '--'}
              trendUp={sensorData ? sensorData.temperature > 24 : false}
              icon="fas fa-thermometer-half"
              iconColor="text-red-500"
              iconBg="bg-red-100"
              percentage={sensorData ? Math.min(100, Math.max(0, ((sensorData.temperature - 15) / 20) * 100)) : 0}
              gradientColors="from-blue-400 to-red-400"
              optimalRange="22-26°C"
              minLabel="15°C"
              maxLabel="35°C"
            />
            
            <MetricCard
              title="Humedad"
              value={`${sensorData?.humidity.toFixed(0) || '--'}%`}
              trend={sensorData ? `${sensorData.humidity > 68 ? '+' : ''}${(sensorData.humidity - 68).toFixed(0)}% desde ayer` : '--'}
              trendUp={sensorData ? sensorData.humidity > 68 : false}
              icon="fas fa-tint"
              iconColor="text-blue-500"
              iconBg="bg-blue-100"
              percentage={sensorData?.humidity || 0}
              gradientColors="from-yellow-400 to-blue-400"
              optimalRange="60-80%"
              minLabel="0%"
              maxLabel="100%"
            />
            
            <MetricCard
              title="Luz Solar"
              value={`${sensorData?.lightLevel.toFixed(0) || '--'} lux`}
              trend={sensorData ? `${sensorData.lightLevel > 850 ? '+' : ''}${(sensorData.lightLevel - 850).toFixed(0)} lux desde ayer` : '--'}
              trendUp={sensorData ? sensorData.lightLevel > 850 : false}
              icon="fas fa-sun"
              iconColor="text-yellow-500"
              iconBg="bg-yellow-100"
              percentage={sensorData ? Math.min(100, (sensorData.lightLevel / 1500) * 100) : 0}
              gradientColors="from-gray-400 to-yellow-400"
              optimalRange="800-1200 lux"
              minLabel="0 lux"
              maxLabel="1500 lux"
            />
            
            <MetricCard
              title="Humedad del Suelo"
              value={`${sensorData?.soilMoisture.toFixed(0) || '--'}%`}
              trend={sensorData && sensorData.soilMoisture < 50 ? "Nivel bajo" : "Nivel óptimo"}
              trendUp={sensorData ? sensorData.soilMoisture >= 50 : false}
              icon="fas fa-seedling"
              iconColor="text-green-500"
              iconBg="bg-green-100"
              percentage={sensorData?.soilMoisture || 0}
              gradientColors="from-red-400 to-green-400"
              optimalRange="50-70%"
              minLabel="0%"
              maxLabel="100%"
              isWarning={sensorData ? sensorData.soilMoisture < 50 : false}
            />
          </div>

          {/* Charts and Controls Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <EnvironmentChart />
              <IrrigationSchedule />
            </div>
            
            <div className="space-y-6">
              <ControlPanel />
              <SystemAlerts />
              <QuickActions />
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      </main>
    </div>
  );
}
