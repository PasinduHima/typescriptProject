import { assertNever } from "../lib/assertNever.ts";
import type { TempUnit, WindUnit } from "./types.ts";

const KM_PER_MILE = 1.609344;

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function kmhToMph(kmh: number): number {
  return kmh / KM_PER_MILE;
}

/** Math.round(-0.4) is -0; adding 0 turns it into a plain 0 so we never show "-0°C". */
function roundWhole(n: number): number {
  return Math.round(n) + 0;
}

export function formatTemperature(celsius: number, unit: TempUnit): string {
  switch (unit) {
    case "celsius":
      return `${roundWhole(celsius)}°C`;
    case "fahrenheit":
      return `${roundWhole(celsiusToFahrenheit(celsius))}°F`;
    default:
      return assertNever(unit);
  }
}

export function formatWindSpeed(kmh: number, unit: WindUnit): string {
  switch (unit) {
    case "kmh":
      return `${roundWhole(kmh)} km/h`;
    case "mph":
      return `${roundWhole(kmhToMph(kmh))} mph`;
    default:
      return assertNever(unit);
  }
}

export const TEMP_UNITS = [
  "celsius",
  "fahrenheit",
] as const satisfies readonly TempUnit[];

/** Type guard: narrows a plain string (e.g. a radio input's value) to TempUnit. */
export function isTempUnit(value: string): value is TempUnit {
  return TEMP_UNITS.some((unit) => unit === value);
}

/** Wind follows the temperature unit: metric → km/h, imperial → mph. */
export function windUnitFor(unit: TempUnit): WindUnit {
  switch (unit) {
    case "celsius":
      return "kmh";
    case "fahrenheit":
      return "mph";
    default:
      return assertNever(unit);
  }
}
