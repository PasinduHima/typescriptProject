import type { Coordinates, GeolocationReason } from "../domain/types.ts";
import { err, ok, type Result } from "./result.ts";

/** The part of navigator.geolocation we use. Tests pass a fake. */
export type GeolocationLike = Pick<Geolocation, "getCurrentPosition">;

// GeolocationPositionError codes (from the spec).
const PERMISSION_DENIED = 1;
const TIMEOUT = 3;

function reasonFor(code: number): GeolocationReason {
  switch (code) {
    case PERMISSION_DENIED:
      return "denied";
    case TIMEOUT:
      return "timeout";
    default:
      // POSITION_UNAVAILABLE (2) or anything unexpected.
      return "unavailable";
  }
}

const DEFAULT_OPTIONS: PositionOptions = {
  timeout: 10_000,
  maximumAge: 10 * 60_000, // a position up to 10 minutes old is fine for weather
};

/**
 * Wraps the callback-based geolocation API in a Promise<Result>. Never rejects.
 * Pass `undefined` when the browser has no geolocation → "unavailable".
 */
export function getCurrentCoordinates(
  geolocation: GeolocationLike | undefined,
  options: PositionOptions = DEFAULT_OPTIONS,
): Promise<Result<Coordinates>> {
  if (geolocation === undefined) {
    return Promise.resolve(err({ kind: "geolocation", reason: "unavailable" }));
  }

  return new Promise<Result<Coordinates>>((resolve) => {
    try {
      geolocation.getCurrentPosition(
        (position) => {
          resolve(
            ok({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          );
        },
        (error) => {
          resolve(err({ kind: "geolocation", reason: reasonFor(error.code) }));
        },
        options,
      );
    } catch {
      // Some browsers throw instead of calling the error callback (e.g. blocked by policy).
      resolve(err({ kind: "geolocation", reason: "unavailable" }));
    }
  });
}
