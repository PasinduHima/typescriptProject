import type {
  Coordinates,
  CurrentWeather,
  DailyForecast,
  Forecast,
} from "../domain/types.ts";
import { err, ok, type Result } from "../lib/result.ts";
import { fetchJson } from "./client.ts";
import {
  RawForecastResponseSchema,
  type RawCurrent,
  type RawDaily,
  type RawForecastResponse,
} from "./schemas.ts";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const FORECAST_DAYS = 5;

export function buildForecastUrl(coords: Coordinates): URL {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(coords.latitude));
  url.searchParams.set("longitude", String(coords.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));
  return url;
}

export function mapCurrent(raw: RawCurrent): CurrentWeather {
  return {
    temperatureC: raw.temperature_2m,
    feelsLikeC: raw.apparent_temperature,
    humidityPercent: raw.relative_humidity_2m,
    windSpeedKmh: raw.wind_speed_10m,
    weatherCode: raw.weather_code,
    isDay: raw.is_day === 1,
  };
}

/**
 * Zips Open-Meteo's parallel daily arrays into one object per day.
 * Days with a null (or missing) value are skipped.
 * Arrays of different lengths mean the response is broken → invalid-response.
 */
export function zipDaily(raw: RawDaily): Result<DailyForecast[]> {
  const lengths = {
    time: raw.time.length,
    weather_code: raw.weather_code.length,
    temperature_2m_max: raw.temperature_2m_max.length,
    temperature_2m_min: raw.temperature_2m_min.length,
  };
  const allSame = Object.values(lengths).every((n) => n === lengths.time);
  if (!allSame) {
    const detail = Object.entries(lengths)
      .map(([key, n]) => `${key}=${n}`)
      .join(", ");
    return err({
      kind: "invalid-response",
      issues: [`daily: arrays have different lengths (${detail})`],
    });
  }

  const days: DailyForecast[] = [];
  for (let i = 0; i < raw.time.length; i++) {
    // With noUncheckedIndexedAccess each of these is `T | undefined`.
    const date = raw.time[i];
    const weatherCode = raw.weather_code[i];
    const max = raw.temperature_2m_max[i];
    const min = raw.temperature_2m_min[i];
    if (
      date === undefined ||
      weatherCode == null ||
      max == null ||
      min == null
    ) {
      continue;
    }
    days.push({
      date,
      weatherCode,
      maxTemperatureC: max,
      minTemperatureC: min,
    });
  }
  return ok(days);
}

export function mapForecast(raw: RawForecastResponse): Result<Forecast> {
  const daily = zipDaily(raw.daily);
  if (!daily.ok) return daily;
  return ok({ current: mapCurrent(raw.current), daily: daily.value });
}

export async function getForecast(
  coords: Coordinates,
  signal?: AbortSignal,
): Promise<Result<Forecast>> {
  const result = await fetchJson(
    buildForecastUrl(coords).href,
    RawForecastResponseSchema,
    signal,
  );
  return result.ok ? mapForecast(result.value) : result;
}
