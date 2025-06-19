import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: string;
  iconColor: string;
  iconBg: string;
  percentage: number;
  gradientColors: string;
  optimalRange: string;
  minLabel: string;
  maxLabel: string;
  isWarning?: boolean;
}

export function MetricCard({
  title,
  value,
  trend,
  trendUp,
  icon,
  iconColor,
  iconBg,
  percentage,
  gradientColors,
  optimalRange,
  minLabel,
  maxLabel,
  isWarning = false,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <div className="flex items-center mt-2">
            <i className={cn(
              "text-sm mr-1",
              isWarning 
                ? "fas fa-exclamation-triangle text-yellow-500"
                : trendUp 
                  ? "fas fa-arrow-up text-green-500" 
                  : "fas fa-arrow-down text-orange-500"
            )} />
            <span className={cn(
              "text-sm",
              isWarning 
                ? "text-yellow-600"
                : trendUp 
                  ? "text-green-600" 
                  : "text-orange-600"
            )}>
              {trend}
            </span>
          </div>
        </div>
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", iconBg)}>
          <i className={cn(icon, iconColor, "text-xl")} />
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={cn("bg-gradient-to-r h-2 rounded-full", gradientColors)}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{minLabel}</span>
          <span>Óptimo: {optimalRange}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    </div>
  );
}
