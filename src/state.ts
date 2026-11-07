import type { AppError, City, Forecast, TempUnit } from "./domain/types.ts";

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
  selectedCity: City | null;
  forecast: LoadState<Forecast>;
  unit: TempUnit;
};

export function createInitialState(): AppState {
  return {
    query: "",
    search: { status: "idle" },
    isListOpen: false,
    activeIndex: null,
    selectedCity: null,
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
