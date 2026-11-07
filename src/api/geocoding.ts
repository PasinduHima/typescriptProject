import type { City } from "../domain/types.ts";
import { ok, type Result } from "../lib/result.ts";
import { fetchJson } from "./client.ts";
import {
  RawGeocodingResponseSchema,
  type RawGeocodingResponse,
  type RawGeocodingResult,
} from "./schemas.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
export const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 5;

export function buildSearchUrl(query: string): URL {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", String(MAX_RESULTS));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  return url;
}

export function mapGeocodingResult(raw: RawGeocodingResult): City {
  return {
    id: raw.id,
    name: raw.name,
    latitude: raw.latitude,
    longitude: raw.longitude,
    region: raw.admin1,
    country: raw.country,
  };
}

export function mapGeocodingResponse(raw: RawGeocodingResponse): City[] {
  return (raw.results ?? []).map(mapGeocodingResult);
}

export async function searchCities(
  query: string,
  signal?: AbortSignal,
): Promise<Result<City[]>> {
  if (query.trim().length < MIN_QUERY_LENGTH) {
    return ok([]);
  }
  const result = await fetchJson(
    buildSearchUrl(query).href,
    RawGeocodingResponseSchema,
    signal,
  );
  return result.ok ? ok(mapGeocodingResponse(result.value)) : result;
}
