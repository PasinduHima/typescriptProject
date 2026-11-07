export type WeatherInfo = {
  label: string;
  icon: string;
};

/** WMO weather interpretation codes, as used by Open-Meteo. */
const WEATHER_CODES = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Moderate drizzle", icon: "🌦️" },
  55: { label: "Dense drizzle", icon: "🌦️" },
  56: { label: "Freezing drizzle", icon: "🧊" },
  57: { label: "Freezing drizzle", icon: "🧊" },
  61: { label: "Slight rain", icon: "🌧️" },
  63: { label: "Moderate rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Freezing rain", icon: "🧊" },
  67: { label: "Freezing rain", icon: "🧊" },
  71: { label: "Slight snow", icon: "🌨️" },
  73: { label: "Moderate snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "🌨️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌦️" },
  82: { label: "Rain showers", icon: "🌦️" },
  85: { label: "Snow showers", icon: "🌨️" },
  86: { label: "Snow showers", icon: "🌨️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Thunderstorm with hail", icon: "⛈️" },
} satisfies Record<number, WeatherInfo>;

const UNKNOWN_WEATHER: WeatherInfo = { label: "Unknown", icon: "❓" };

// Widen to an index signature so we can look up any number from the API.
// With noUncheckedIndexedAccess, a lookup returns `WeatherInfo | undefined`.
const lookup: Readonly<Record<number, WeatherInfo>> = WEATHER_CODES;

export function getWeatherInfo(code: number): WeatherInfo {
  return lookup[code] ?? UNKNOWN_WEATHER;
}
