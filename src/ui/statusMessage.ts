import { formatCityLabel } from "../domain/cityLabel.ts";
import { formatError } from "../domain/errors.ts";
import { assertNever } from "../lib/assertNever.ts";
import type { AppState } from "../state.ts";

export type StatusMessage = {
  text: string;
  tone: "info" | "error";
};

export const START_MESSAGE = "Search for a city to see the weather.";

function info(text: string): StatusMessage {
  return { text, tone: "info" };
}

function searchMessage(state: Readonly<AppState>): StatusMessage | null {
  const { search } = state;
  switch (search.status) {
    case "idle":
      return null;
    case "loading":
      return info("Searching…");
    case "error":
      return { text: formatError(search.error), tone: "error" };
    case "success": {
      if (!state.isListOpen) return null;
      const n = search.data.length;
      if (n === 0) return info(`No places found for “${state.query.trim()}”.`);
      return info(
        `${n} ${n === 1 ? "place" : "places"} found. Use the up and down arrow keys to choose.`,
      );
    }
    default:
      return assertNever(search);
  }
}

function forecastMessage(state: Readonly<AppState>): StatusMessage {
  const { forecast, selectedCity } = state;
  switch (forecast.status) {
    case "idle":
      return info(selectedCity === null ? START_MESSAGE : "");
    case "loading":
      return info(
        selectedCity === null
          ? "Loading weather…"
          : `Loading weather for ${formatCityLabel(selectedCity)}…`,
      );
    case "error":
      return { text: formatError(forecast.error), tone: "error" };
    case "success":
      return info("");
    default:
      return assertNever(forecast);
  }
}

/** The message for the aria-live status region. Search messages win while the user is searching. */
export function getStatusMessage(state: Readonly<AppState>): StatusMessage {
  return searchMessage(state) ?? forecastMessage(state);
}
