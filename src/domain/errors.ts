import { assertNever } from "../lib/assertNever.ts";
import type { AppError } from "./types.ts";

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
    default:
      return assertNever(error);
  }
}
