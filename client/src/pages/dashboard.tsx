import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MetricCard } from "@/components/metric-card";
import { EnvironmentChart } from "@/components/environment-chart";
import { ControlPanel } from "@/components/control-panel";
import { IrrigationSchedule } from "@/components/irrigation-schedule";
import { SystemAlerts } from "@/components/system-alerts";
import { RecentActivity } from "@/components/recent-activity";
import { ArduinoStatus } from "@/components/arduino-status";
import { QuickActions } from "@/components/quick-actions";
import { WeatherCard } from "@/components/weather-card";
import { ArduinoSensors } from "@/components/arduino-sensors";
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
          {/* Arduino Sensors - Physical Components */}
          <ArduinoSensors />
          


          {/* Charts and Controls Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <EnvironmentChart />
              <IrrigationSchedule />
            </div>
            
            <div className="space-y-6">
              <ArduinoStatus />
              <WeatherCard />
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
