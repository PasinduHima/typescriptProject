import type { AppState } from "../state.ts";

/** The text for the aria-live status region, derived from state. */
export function getStatusMessage(state: Readonly<AppState>): string {
  const { search } = state;
  switch (search.status) {
    case "loading":
      return "Searching…";
    case "error":
      return "Search failed. Please try again.";
    case "success":
      if (state.isListOpen) {
        const n = search.data.length;
        if (n === 0) return `No places found for “${state.query.trim()}”.`;
        return `${n} ${n === 1 ? "place" : "places"} found. Use the up and down arrow keys to choose.`;
      }
      break;
    case "idle":
      break;
  }
  return "";
}
