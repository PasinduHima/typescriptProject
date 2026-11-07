import { formatCityLabel } from "../domain/cityLabel.ts";
import { assertNever } from "../lib/assertNever.ts";
import type { AppState } from "../state.ts";

function searchMessage(state: Readonly<AppState>): string | null {
  const { search } = state;
  switch (search.status) {
    case "idle":
      return null;
    case "loading":
      return "Searching…";
    case "error":
      return "Search failed. Please try again.";
    case "success": {
      if (!state.isListOpen) return null;
      const n = search.data.length;
      if (n === 0) return `No places found for “${state.query.trim()}”.`;
      return `${n} ${n === 1 ? "place" : "places"} found. Use the up and down arrow keys to choose.`;
    }
    default:
      return assertNever(search);
  }
}

function forecastMessage(state: Readonly<AppState>): string {
  const { forecast, selectedCity } = state;
  switch (forecast.status) {
    case "idle":
      return "";
    case "loading":
      return selectedCity === null
        ? "Loading weather…"
        : `Loading weather for ${formatCityLabel(selectedCity)}…`;
    case "error":
      return "Couldn't load the weather. Please try again.";
    case "success":
      return "";
    default:
      return assertNever(forecast);
  }
}

/** The text for the aria-live status region. Search messages win while the user is searching. */
export function getStatusMessage(state: Readonly<AppState>): string {
  return searchMessage(state) ?? forecastMessage(state);
}
