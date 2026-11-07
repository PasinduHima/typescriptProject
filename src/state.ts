import type {
  AppError,
  City,
  Forecast,
  Place,
  TempUnit,
} from "./domain/types.ts";

export type LoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: AppError };

export type AppState = {
  query: string;
  search: LoadState<City[]>;
  isListOpen: boolean;
  /** Index of the highlighted option in the results list, or null for none. */
  activeIndex: number | null;
  selectedPlace: Place | null;
  /** True while waiting for the browser's geolocation answer. */
  locating: boolean;
  forecast: LoadState<Forecast>;
  unit: TempUnit;
};

export function createInitialState(): AppState {
  return {
    query: "",
    search: { status: "idle" },
    isListOpen: false,
    activeIndex: null,
    selectedPlace: null,
    locating: false,
    forecast: { status: "idle" },
    unit: "celsius",
  };
}

export type Store = {
  getState: () => Readonly<AppState>;
  /** The only way to change state. Merges `changes` in, then calls the listener (re-render). */
  update: (changes: Partial<AppState>) => void;
};

export function createStore(
  initial: AppState,
  onChange: (state: Readonly<AppState>) => void,
): Store {
  let state: Readonly<AppState> = initial;
  return {
    getState: () => state,
    update(changes) {
      state = { ...state, ...changes };
      onChange(state);
    },
  };
}
