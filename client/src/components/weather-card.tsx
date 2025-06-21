import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, Sun, Wind, Droplets } from "lucide-react";

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  location: string;
  timestamp: string;
}

export function WeatherCard() {
  const { data: weather, isLoading } = useQuery<WeatherData>({
    queryKey: ['/api/weather'],
    refetchInterval: 10 * 60 * 1000, // Actualizar cada 10 minutos
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clima Exterior</CardTitle>
          <Cloud className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) return Sun;
    if (code >= 51 && code <= 65) return Droplets;
    return Cloud;
  };

  const getWeatherDescription = (code: number): string => {
    const weatherCodes: { [key: number]: string } = {
      0: "Despejado",
      1: "Mayormente despejado",
      2: "Parcialmente nublado",
      3: "Nublado",
      45: "Neblina",
      48: "Neblina con escarcha",
      51: "Llovizna ligera",
      53: "Llovizna moderada",
      55: "Llovizna intensa",
      61: "Lluvia ligera",
      63: "Lluvia moderada",
      65: "Lluvia intensa",
      71: "Nevada ligera",
      73: "Nevada moderada",
      75: "Nevada intensa",
      95: "Tormenta",
      96: "Tormenta con granizo ligero",
      99: "Tormenta con granizo intenso"
    };
    
    return weatherCodes[code] || "Desconocido";
  };

  const WeatherIcon = getWeatherIcon(weather.weatherCode);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Clima Exterior</CardTitle>
        <WeatherIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{weather.temperature}°C</div>
              <p className="text-xs text-muted-foreground">{weather.location}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {getWeatherDescription(weather.weatherCode)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-muted-foreground">Humedad:</span>
              <span className="font-medium">{weather.humidity}%</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-muted-foreground">Viento:</span>
              <span className="font-medium">{weather.windSpeed} km/h</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-2">
            Actualizado: {new Date(weather.timestamp).toLocaleTimeString('es-AR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}