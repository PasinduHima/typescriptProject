// What the app saves in localStorage, and the schemas used to check it on read.
// Keys are versioned: if the stored shape ever changes, bump v1 → v2 and old data is ignored.
import { z } from "zod";
import type { City, TempUnit } from "./domain/types.ts";
import { TEMP_UNITS } from "./domain/units.ts";
import type { StorageEntry } from "./lib/storage.ts";

// `satisfies z.ZodType<City>` makes the compiler check that this schema
// produces exactly a City, so the schema and the domain type can't drift apart.
const StoredCitySchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  region: z.string().optional(),
  country: z.string().optional(),
}) satisfies z.ZodType<City>;

const TempUnitSchema = z.enum(TEMP_UNITS) satisfies z.ZodType<TempUnit>;

export const LAST_CITY: StorageEntry<City> = {
  key: "weather-app:v1:last-city",
  schema: StoredCitySchema,
};

export const UNIT: StorageEntry<TempUnit> = {
  key: "weather-app:v1:unit",
  schema: TempUnitSchema,
};
