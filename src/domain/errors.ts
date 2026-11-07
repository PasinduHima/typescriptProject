import { assertNever } from "../lib/assertNever.ts";
import type { AppError, GeolocationReason } from "./types.ts";

/** A friendly message for each kind of error. "aborted" is silent (the user just typed again). */
export function formatError(error: AppError): string {
  switch (error.kind) {
    case "network":
      return "Can't reach the weather service. Check your internet connection and try again.";
    case "http":
      if (error.status === 429) {
        return "Too many requests right now. Please wait a moment and try again.";
      }
      if (error.status >= 500) {
        return `The weather service is having trouble (error ${error.status}). Please try again later.`;
      }
      return `The weather service couldn't handle the request (error ${error.status}).`;
    case "invalid-response":
      return "The weather service sent data we couldn't read. Please try again later.";
    case "aborted":
      return "";
    case "geolocation":
      return formatGeolocationError(error.reason);
    default:
      return assertNever(error);
  }
}

function formatGeolocationError(reason: GeolocationReason): string {
  switch (reason) {
    case "denied":
      return "Location access was denied. Allow it in your browser settings, or search for a city instead.";
    case "unavailable":
      return "Your location isn't available right now. Try searching for a city instead.";
    case "timeout":
      return "Finding your location took too long. Please try again.";
    default:
      return assertNever(reason);
  }
}
