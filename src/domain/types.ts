export type TempUnit = "celsius" | "fahrenheit";
export type WindUnit = "kmh" | "mph";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type City = Coordinates & {
  id: number;
  name: string;
  region?: string; // admin1, e.g. "Western Province"
  country?: string;
};

/** What the weather is shown for: a searched city, or the device's own position. */
export type Place =
  | { kind: "city"; city: City }
  | { kind: "my-location"; coordinates: Coordinates };

export type CurrentWeather = {
  temperatureC: number;
  feelsLikeC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  weatherCode: number;
  isDay: boolean;
};

export type DailyForecast = {
  date: string; // "YYYY-MM-DD", in the city's local timezone
  weatherCode: number;
  maxTemperatureC: number;
  minTemperatureC: number;
};

export type Forecast = {
  current: CurrentWeather;
  daily: DailyForecast[];
};

export type GeolocationReason = "denied" | "unavailable" | "timeout";

export type AppError =
  | { kind: "network"; message: string }
  | { kind: "http"; status: number }
  | { kind: "invalid-response"; issues: string[] }
  | { kind: "aborted" }
  | { kind: "geolocation"; reason: GeolocationReason };
