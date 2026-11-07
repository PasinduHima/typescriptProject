// Zod schemas for the RAW Open-Meteo responses (snake_case, exactly as sent).
// Mapping to domain types happens in geocoding.ts / forecast.ts.
// z.object() strips keys we don't list, so extra API fields are ignored.
import { z } from "zod";

// ---------- Geocoding ----------

export const RawGeocodingResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string().optional(),
  admin1: z.string().optional(),
});

export const RawGeocodingResponseSchema = z.object({
  // Missing entirely (not []) when nothing matches.
  results: z.array(RawGeocodingResultSchema).optional(),
});

// ---------- Forecast ----------

export const RawCurrentSchema = z.object({
  temperature_2m: z.number(),
  apparent_temperature: z.number(),
  relative_humidity_2m: z.number(),
  weather_code: z.number(),
  wind_speed_10m: z.number(),
  is_day: z.literal([0, 1]),
});

// Parallel arrays: index i of each array belongs to day i.
// Values can be null when the model has no data for that day.
export const RawDailySchema = z.object({
  time: z.array(z.string()),
  weather_code: z.array(z.number().nullable()),
  temperature_2m_max: z.array(z.number().nullable()),
  temperature_2m_min: z.array(z.number().nullable()),
});

export const RawForecastResponseSchema = z.object({
  current: RawCurrentSchema,
  daily: RawDailySchema,
});

export type RawGeocodingResult = z.infer<typeof RawGeocodingResultSchema>;
export type RawGeocodingResponse = z.infer<typeof RawGeocodingResponseSchema>;
export type RawCurrent = z.infer<typeof RawCurrentSchema>;
export type RawDaily = z.infer<typeof RawDailySchema>;
export type RawForecastResponse = z.infer<typeof RawForecastResponseSchema>;
