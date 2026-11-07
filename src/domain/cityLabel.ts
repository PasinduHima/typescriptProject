import type { City } from "./types.ts";

/** "Colombo, Western Province, Sri Lanka" — missing or empty parts are skipped. */
export function formatCityLabel(
  city: Pick<City, "name" | "region" | "country">,
): string {
  return [city.name, city.region, city.country]
    .filter((part): part is string => part !== undefined && part !== "")
    .join(", ");
}
