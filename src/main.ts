import "./styles.css";
import { MIN_QUERY_LENGTH, searchCities } from "./api/geocoding.ts";
import { formatCityLabel } from "./domain/cityLabel.ts";
import type { City } from "./domain/types.ts";
import { debounce } from "./lib/debounce.ts";
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
};

const handlers: Handlers = {
  onSelectCity: selectCity,
};

const store = createStore(createInitialState(), (state) => {
  render(els, state, handlers);
});

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

function selectCity(city: City): void {
  cancelSearch();
  const label = formatCityLabel(city);
  els.input.value = label;
  els.input.focus();
  store.update({
    query: label,
    selectedCity: city,
    isListOpen: false,
    activeIndex: null,
  });
}

els.input.addEventListener("input", onInput);
els.input.addEventListener("keydown", onKeyDown);
document.addEventListener("click", (event) => {
  if (event.target instanceof Node && els.combobox.contains(event.target)) {
    return;
  }
  closeList();
});

render(els, store.getState(), handlers);
