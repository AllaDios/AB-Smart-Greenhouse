export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  location: string;
  timestamp: Date;
}

export class WeatherService {
  private baseUrl = 'https://api.open-meteo.com/v1/forecast';
  private lastFetch: Date | null = null;
  private cachedData: WeatherData | null = null;
  private cacheTimeout = 10 * 60 * 1000; // 10 minutos

  async getWeatherData(latitude: number = -34.6118, longitude: number = -58.3960): Promise<WeatherData> {
    // Usar cache si es reciente
    if (this.cachedData && this.lastFetch && 
        Date.now() - this.lastFetch.getTime() < this.cacheTimeout) {
      return this.cachedData;
    }

    try {
      const url = `${this.baseUrl}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      const weatherData: WeatherData = {
        temperature: Math.round(data.current.temperature_2m * 10) / 10,
        humidity: Math.round(data.current.relative_humidity_2m),
        windSpeed: Math.round(data.current.wind_speed_10m * 10) / 10,
        weatherCode: data.current.weather_code,
        location: "Buenos Aires", // Puedes hacerlo dinámico más tarde
        timestamp: new Date()
      };

      this.cachedData = weatherData;
      this.lastFetch = new Date();
      
      console.log(`[Weather] Updated: ${weatherData.temperature}°C, ${weatherData.humidity}% humidity`);
      
      return weatherData;
    } catch (error) {
      console.error('[Weather] Error fetching weather data:', error);
      
      // Retornar datos por defecto si hay error
      return {
        temperature: 22.0,
        humidity: 60,
        windSpeed: 5.0,
        weatherCode: 0,
        location: "Buenos Aires",
        timestamp: new Date()
      };
    }
  }

  getWeatherDescription(code: number): string {
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
  }
}

export const weatherService = new WeatherService();