import "./styles.css";
import { getForecast } from "./api/forecast.ts";
import { MIN_QUERY_LENGTH, searchCities } from "./api/geocoding.ts";
import { formatCityLabel, placeCoordinates } from "./domain/cityLabel.ts";
import type { City, Place } from "./domain/types.ts";
import { isTempUnit } from "./domain/units.ts";
import { debounce } from "./lib/debounce.ts";
import { getCurrentCoordinates } from "./lib/geolocation.ts";
import { getLocalStorage, readEntry, writeEntry } from "./lib/storage.ts";
import { LAST_CITY, UNIT } from "./persistence.ts";
import { createInitialState, createStore } from "./state.ts";
import { getEl } from "./ui/dom.ts";
import { moveActiveIndex } from "./ui/listNavigation.ts";
import { render, type Elements, type Handlers } from "./ui/render.ts";

const SEARCH_DEBOUNCE_MS = 300;

const els: Elements = {
  combobox: getEl("#combobox", HTMLDivElement),
  input: getEl("#search-input", HTMLInputElement),
  list: getEl("#search-results", HTMLUListElement),
  status: getEl("#status", HTMLParagraphElement),
  current: getEl("#current", HTMLElement),
  forecast: getEl("#forecast", HTMLElement),
  forecastList: getEl("#forecast-list", HTMLOListElement),
  unitToggle: getEl("#unit-toggle", HTMLFieldSetElement),
  unitCelsius: getEl("#unit-celsius", HTMLInputElement),
  unitFahrenheit: getEl("#unit-fahrenheit", HTMLInputElement),
  locate: getEl("#locate", HTMLButtonElement),
};

const storage = getLocalStorage();

const handlers: Handlers = {
  onSelectCity: selectCity,
};

const initialState = createInitialState();
const store = createStore(
  { ...initialState, unit: readEntry(storage, UNIT) ?? initialState.unit },
  (state) => {
    render(els, state, handlers);
  },
);

// ---------- Search ----------

let searchController: AbortController | null = null;

function cancelSearch(): void {
  debouncedSearch.cancel();
  searchController?.abort();
  searchController = null;
}

async function runSearch(query: string): Promise<void> {
  searchController?.abort();
  const controller = new AbortController();
  searchController = controller;

  store.update({
    search: { status: "loading" },
    isListOpen: true,
    activeIndex: null,
  });
  const result = await searchCities(query, controller.signal);

  // A newer search (or a selection) has replaced this one.
  if (controller !== searchController) return;

  if (result.ok) {
    store.update({ search: { status: "success", data: result.value } });
  } else if (result.error.kind !== "aborted") {
    store.update({ search: { status: "error", error: result.error } });
  }
}

const debouncedSearch = debounce((query: string) => {
  void runSearch(query);
}, SEARCH_DEBOUNCE_MS);

function onInput(): void {
  const query = els.input.value;
  // The user is still typing: drop the in-flight request right away.
  searchController?.abort();

  if (query.trim().length < MIN_QUERY_LENGTH) {
    cancelSearch();
    store.update({
      query,
      search: { status: "idle" },
      isListOpen: false,
      activeIndex: null,
    });
    return;
  }
  store.update({ query });
  debouncedSearch(query);
}

function closeList(): void {
  if (store.getState().isListOpen) {
    store.update({ isListOpen: false, activeIndex: null });
  }
}

function onKeyDown(event: KeyboardEvent): void {
  const state = store.getState();
  const results = state.search.status === "success" ? state.search.data : [];

  switch (event.key) {
    case "ArrowDown":
    case "ArrowUp": {
      if (results.length === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const current = state.isListOpen ? state.activeIndex : null;
      store.update({
        isListOpen: true,
        activeIndex: moveActiveIndex(current, step, results.length),
      });
      return;
    }
    case "Enter": {
      if (!state.isListOpen || state.activeIndex === null) return;
      const city = results[state.activeIndex];
      if (city === undefined) return;
      event.preventDefault();
      selectCity(city);
      return;
    }
    case "Escape":
      if (state.isListOpen) {
        event.preventDefault();
        closeList();
      }
      return;
  }
}

// ---------- Forecast ----------

let forecastController: AbortController | null = null;

async function loadForecast(place: Place): Promise<void> {
  forecastController?.abort();
  const controller = new AbortController();
  forecastController = controller;

  store.update({ forecast: { status: "loading" } });
  const result = await getForecast(placeCoordinates(place), controller.signal);

  // The user picked another place while this one was loading.
  if (controller !== forecastController) return;

  if (result.ok) {
    store.update({ forecast: { status: "success", data: result.value } });
  } else if (result.error.kind !== "aborted") {
    store.update({ forecast: { status: "error", error: result.error } });
  }
}

// Bumped whenever the user picks a place, so a slow geolocation answer
// can't replace a city chosen in the meantime.
let placeRequest = 0;

function selectCity(city: City): void {
  placeRequest++;
  cancelSearch();
  const label = formatCityLabel(city);
  els.input.value = label;
  els.input.focus();
  store.update({
    query: label,
    selectedPlace: { kind: "city", city },
    locating: false,
    isListOpen: false,
    activeIndex: null,
  });
  writeEntry(storage, LAST_CITY, city);
  void loadForecast({ kind: "city", city });
}

// ---------- My location ----------

// The DOM types say navigator.geolocation always exists, but some browsers
// (or insecure http:// pages) don't provide it.
const geolocation =
  "geolocation" in navigator ? navigator.geolocation : undefined;

async function useMyLocation(): Promise<void> {
  if (store.getState().locating) return;
  const request = ++placeRequest;
  cancelSearch();
  forecastController?.abort();
  forecastController = null;
  store.update({
    locating: true,
    isListOpen: false,
    activeIndex: null,
    forecast: { status: "idle" },
  });

  const result = await getCurrentCoordinates(geolocation);
  if (request !== placeRequest) return; // the user picked a city meanwhile

  if (!result.ok) {
    store.update({
      locating: false,
      forecast: { status: "error", error: result.error },
    });
    return;
  }

  // Not saved to storage: "last city" only remembers searched cities.
  const place: Place = { kind: "my-location", coordinates: result.value };
  els.input.value = "";
  store.update({
    locating: false,
    query: "",
    search: { status: "idle" },
    selectedPlace: place,
  });
  void loadForecast(place);
}

// ---------- Units ----------

function onUnitChange(event: Event): void {
  if (!(event.target instanceof HTMLInputElement)) return;
  const unit = event.target.value;
  if (!isTempUnit(unit)) return;
  // Re-render only: everything is stored in metric, so no refetch is needed.
  store.update({ unit });
  writeEntry(storage, UNIT, unit);
}

els.input.addEventListener("input", onInput);
els.input.addEventListener("keydown", onKeyDown);
els.unitToggle.addEventListener("change", onUnitChange);
els.locate.addEventListener("click", () => {
  void useMyLocation();
});
document.addEventListener("click", (event) => {
  if (event.target instanceof Node && els.combobox.contains(event.target)) {
    return;
  }
  closeList();
});

render(els, store.getState(), handlers);

// Restore the last city (the unit was restored into the initial state above).
const lastCity = readEntry(storage, LAST_CITY);
if (lastCity !== null) {
  const label = formatCityLabel(lastCity);
  els.input.value = label;
  const place: Place = { kind: "city", city: lastCity };
  store.update({ query: label, selectedPlace: place });
  void loadForecast(place);
}
