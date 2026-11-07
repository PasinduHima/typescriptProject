import { assertNever } from "../lib/assertNever.ts";
import type { City, Coordinates, Place } from "./types.ts";

/** "Colombo, Western Province, Sri Lanka" — missing or empty parts are skipped. */
export function formatCityLabel(
  city: Pick<City, "name" | "region" | "country">,
): string {
  return [city.name, city.region, city.country]
    .filter((part): part is string => part !== undefined && part !== "")
    .join(", ");
}

/** Heading text for a place. Open-Meteo has no reverse geocoding, so a device position is just "Your location". */
export function formatPlaceLabel(place: Place): string {
  switch (place.kind) {
    case "city":
      return formatCityLabel(place.city);
    case "my-location":
      return "Your location";
    default:
      return assertNever(place);
  }
}

/** The coordinates to fetch the forecast for. */
export function placeCoordinates(place: Place): Coordinates {
  switch (place.kind) {
    case "city":
      return place.city;
    case "my-location":
      return place.coordinates;
    default:
      return assertNever(place);
  }
}
