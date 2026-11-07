# CLAUDE.md — Weather App (TypeScript)

## Project overview

A small, fast weather app. The user searches for a city, picks a match, and sees current conditions plus a 5-day forecast.

Built with **vanilla TypeScript + Vite** — no UI framework — so the focus stays on TypeScript itself.

This is a **learning project**: I'm getting comfortable with TypeScript. Clear, correct types matter more than feature count.

## Tech stack

- **Language:** TypeScript (strict mode)
- **Build / dev server:** Vite (`vanilla-ts` template)
- **Runtime validation:** Zod
- **Tests:** Vitest
- **Lint / format:** ESLint (typescript-eslint) + Prettier
- **Styling:** plain CSS with custom properties (no Tailwind, no UI library)
- **Weather data:** Open-Meteo — free, no API key
- **Package manager:** npm

Don't add any other dependencies without asking first.

## Commands

```bash
npm run dev        # start Vite dev server
npm run build      # tsc --noEmit && vite build
npm run preview    # preview the production build
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
npm run lint       # eslint .
```

After every change, run `npm run typecheck` and `npm run test`. Both must pass before a task is done.

## Features (MVP)

1. Search for a city by name (debounced ~300 ms), show up to 5 matches
2. Select a match → current weather: temperature, feels-like, humidity, wind speed, condition label + icon
3. 5-day forecast: day name, condition icon, max / min temperature
4. °C / °F toggle — convert on the client, don't refetch
5. Loading, error and "no results" states
6. Remember the last selected city in `localStorage` and load it on startup

Nice-to-haves (only after the MVP works): "Use my location" via the Geolocation API, day/night styling using `is_day`.

## Folder structure

```
src/
├── main.ts               # entry point: wires events → state → render
├── state.ts              # AppState, LoadState<T>, createStore (one update() → re-render)
├── persistence.ts        # what we save in localStorage: StorageEntry keys + Zod schemas
├── api/
│   ├── client.ts         # fetchJson(url, schema, signal) → Promise<Result<T>>, never throws
│   ├── geocoding.ts      # searchCities(query, signal) + raw → City mapper
│   ├── forecast.ts       # getForecast(coords, signal) + mappers (zipDaily, mapCurrent)
│   ├── schemas.ts        # Zod schemas for RAW API responses
│   └── __fixtures__/     # real JSON responses for tests
├── domain/
│   ├── types.ts          # app-facing types: Coordinates, City, Place, Forecast, AppError, …
│   ├── weatherCodes.ts   # WMO code → label + icon
│   ├── units.ts          # °C/°F, km/h/mph conversion + formatting, windUnitFor
│   ├── cityLabel.ts      # formatCityLabel, formatPlaceLabel, placeCoordinates
│   ├── dates.ts          # formatDayName, forecastDayLabel ("Today")
│   └── errors.ts         # formatError(AppError) → user-facing message
├── ui/
│   ├── dom.ts            # getEl(selector, Ctor), createEl(tag, options, children)
│   ├── render.ts         # render functions per section (search, status, weather, units)
│   ├── statusMessage.ts  # getStatusMessage(state) for the aria-live region
│   └── listNavigation.ts # moveActiveIndex for ↑/↓ in the results list
├── lib/
│   ├── result.ts         # Result<T, E> type + ok() / err()
│   ├── assertNever.ts    # exhaustive-switch helper
│   ├── storage.ts        # typed localStorage wrapper (validates with Zod on read)
│   ├── geolocation.ts    # getCurrentCoordinates() → Promise<Result<Coordinates>>
│   └── debounce.ts
└── styles.css
docs/
└── TYPESCRIPT_NOTES.md   # study sheet: every TS feature used, with file references
```

Tests sit next to the code they test: `units.test.ts` beside `units.ts`.

## TypeScript rules

Keep Vite's default `tsconfig.json` and make sure these are on:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true
  }
}
```

- **No `any`.** Anything from outside (API, `localStorage`, `JSON.parse`) is `unknown` until Zod validates it.
- **No escape hatches** to silence the compiler: no `as` casts (except `as const`), no non-null `!`, no `@ts-ignore` / `@ts-expect-error`. If the compiler complains, fix the types.
- Use **string literal unions**, not `enum`: `type TempUnit = "celsius" | "fahrenheit"`.
- Model anything with states as a **discriminated union**, and handle every case with an exhaustive `switch` + `assertNever(x: never)`.
- Explicit return types on all exported functions.
- Derive types from Zod schemas with `z.infer<typeof Schema>` — never write the same shape twice.
- Keep **raw API types** (snake_case, from `schemas.ts`) separate from **domain types** (camelCase, `domain/types.ts`). Map between them in `api/` only. UI code never sees raw API shapes.
- Use `satisfies` for lookup tables (e.g. the weather-code map) so they're checked without widening.

### Core types to build around

```ts
// lib/result.ts
export type Result<T, E = AppError> =
  { ok: true; value: T } | { ok: false; error: E };

// domain/types.ts
export type AppError =
  | { kind: "network"; message: string }
  | { kind: "http"; status: number }
  | { kind: "invalid-response"; issues: string[] }
  | { kind: "aborted" };

// state.ts
export type LoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: AppError };
```

API functions return `Promise<Result<T>>` and **don't throw**. The UI decides what message to show for each `AppError["kind"]`. An `"aborted"` error is silent (the user just typed again).

## Open-Meteo API reference

### Geocoding

```
GET https://geocoding-api.open-meteo.com/v1/search?name={query}&count=5&language=en&format=json
```

- Fields used per result: `id`, `name`, `latitude`, `longitude`, `country` (optional), `admin1` (region — optional). Other fields (`timezone`, `elevation`, `population`, …) are ignored.
- ⚠️ When nothing matches, the `results` key is **missing entirely**, not an empty array. The schema makes it optional; the mapper treats missing as `[]`.
- Don't call the API for queries shorter than 2 characters.

### Forecast

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day
  &daily=weather_code,temperature_2m_max,temperature_2m_min
  &timezone=auto
  &forecast_days=5
```

- Always request metric (the default: °C, km/h). Convert to °F / mph on the client.
- ⚠️ `daily` comes back as **parallel arrays** (`time[]`, `weather_code[]`, `temperature_2m_max[]`, …), not an array of objects. Write one mapper that zips them into `DailyForecast[]`. With `noUncheckedIndexedAccess`, `arr[i]` is `T | undefined` — handle it properly, don't `!` it.
- Use `AbortController`: cancel the previous in-flight search request when the user keeps typing.

### WMO weather codes (`weather_code`)

Map these in `domain/weatherCodes.ts`:

| Code       | Label                                 |
| ---------- | ------------------------------------- |
| 0          | Clear sky                             |
| 1, 2, 3    | Mainly clear, Partly cloudy, Overcast |
| 45, 48     | Fog                                   |
| 51, 53, 55 | Drizzle (light → dense)               |
| 56, 57     | Freezing drizzle                      |
| 61, 63, 65 | Rain (slight → heavy)                 |
| 66, 67     | Freezing rain                         |
| 71, 73, 75 | Snow (slight → heavy)                 |
| 77         | Snow grains                           |
| 80, 81, 82 | Rain showers                          |
| 85, 86     | Snow showers                          |
| 95         | Thunderstorm                          |
| 96, 99     | Thunderstorm with hail                |

Unknown codes fall back to `"Unknown"` — never crash on them.

**Attribution:** Open-Meteo data is CC BY 4.0. Keep "Weather data by Open-Meteo.com" (linked) in the footer.

## UI & accessibility

- Mobile-first, single column; must look right from 360 px wide upward
- Search input has a visible `<label>`; the results list is keyboard-navigable (↑ / ↓ / Enter / Esc)
- Loading and error messages go in an `aria-live="polite"` region
- Semantic HTML (`<header>`, `<main>`, `<section>`, headings) — not just `<div>`s
- Put API-provided text into the page with `textContent`. Never inject API strings with `innerHTML`.

## Testing

- Unit-test the pure logic: unit conversion, weather-code mapping, daily-array zipping, and Zod schemas against fixtures — including the "no `results` key" case and a malformed response
- **No real network calls in tests.** Use the JSON in `src/api/__fixtures__/` and mock `fetch` with `vi.fn()` where needed
- UI rendering doesn't need tests for the MVP

## Build order

✅ **Build order complete** — all 8 steps are done. New work starts from the Features list and Design decisions below.

1. ✅ Scaffold: Vite `vanilla-ts`, tsconfig rules, ESLint, Prettier, Vitest, npm scripts
2. ✅ `lib/result.ts`, `lib/assertNever.ts`, `domain/types.ts`, `domain/units.ts`, `domain/weatherCodes.ts` + tests
3. ✅ API layer — `feat: add Zod schemas, API client, geocoding and forecast`
   Zod v4 raw schemas (snake_case, no `.transform()`), real fixtures, `fetchJson` (never throws), `searchCities`, `getForecast`, exported pure mappers, `formatCityLabel`. Tests mock `fetch` with `vi.stubGlobal`.
4. ✅ Search UI — `feat: add city search with debounce and keyboard navigation`
   `state.ts` (one state object, one update function that re-renders), `ui/dom.ts` `getEl(selector, Ctor)` with `instanceof`, `lib/debounce.ts` (fake-timer tests), AbortController, ARIA combobox (↑/↓/Enter/Esc, click, click-outside closes).
5. ✅ Weather display — `feat: show current weather and 5-day forecast`
   Cancel the previous forecast request; current card + 5 days ("Today" first); `domain/formatDayName` (tested); `createElement` + `textContent` only.
6. ✅ Units + persistence — `feat: add °C/°F toggle and remember last city`
   Accessible two-option toggle; wind follows it (celsius → km/h, fahrenheit → mph); no refetch. `lib/storage.ts` takes `Pick<Storage, "getItem" | "setItem" | "removeItem">`, validates with Zod, removes bad data, try/catch, keys like `weather-app:v1:last-city`. Restore city + unit on startup.
7. ✅ Polish — `feat: polish states, styling and docs`
   `domain/errors.ts` `formatError` (exhaustive, tested); start / no-results / loading / error messages in the aria-live region; mobile-first CSS with custom properties, light/dark, `:focus-visible`, reduced motion; Open-Meteo footer; README; `docs/TYPESCRIPT_NOTES.md`.
8. ✅ Nice-to-haves — `feat: add use-my-location and day/night styling`
   Geolocation wrapped as `Promise<Result<Coordinates>>`, new `AppError` kind `"geolocation"` (`"denied" | "unavailable" | "timeout"`), labelled "Your location", not saved. Day/night styling from `isDay`. Update README and notes.

## Design decisions

- Dates stay `"YYYY-MM-DD"` strings. To show day names, parse as UTC and format with `Intl.DateTimeFormat` using `timeZone: "UTC"`, so the day never shifts in the browser's timezone.
- `isDay` arrives as `0`/`1` and is mapped to a `boolean` in the API layer.
- `weatherCode` stays a `number` and always goes through `getWeatherInfo()`.
- `ok()` / `err()` return `never` on the unused side (`Result<T, never>`, `Result<never, E>`) so they fit any `Result`.
- In geocoding, `country` and `admin1` are optional in the raw schema and in `City` (`country?`, `region?`), so one odd result can't fail a whole search. `formatCityLabel()` joins name, region and country, skipping missing parts.
- `timezone` is not part of `City` or the raw schema: nothing uses it, because the forecast call uses `timezone=auto`.
- The daily arrays in the forecast allow `null` (`z.number().nullable()`); the mapper skips any day with a null or missing value. Arrays of different lengths are an `invalid-response`. The `current` block stays strict.

- The °C/°F toggle also sets wind units (celsius → km/h, fahrenheit → mph) via `windUnitFor()`. Data stays metric in state; switching only re-renders.
- `localStorage` access goes through `lib/storage.ts` with a `StorageEntry<T>` (key + Zod schema). Bad or outdated data is removed and ignored; storage errors never throw. Keys are versioned (`weather-app:v1:…`) — bump the version if a stored shape changes. Stored schemas live in `src/persistence.ts` and use `satisfies z.ZodType<City>` so they can't drift from the domain types.

- User-facing error text comes only from `formatError()` (exhaustive switch). Raw Zod issues are never shown to users. Status messages (start / searching / no results / loading / errors) come from `getStatusMessage(state)` and go in the single aria-live region.
- The selected place is a discriminated union `Place = { kind: "city"; city } | { kind: "my-location"; coordinates }` (state field `selectedPlace`). Use `formatPlaceLabel()` / `placeCoordinates()` instead of reaching into it.
- "Use my location": `lib/geolocation.ts` wraps `getCurrentPosition` as `Promise<Result<Coordinates>>`; failures are `AppError` `{ kind: "geolocation"; reason: GeolocationReason }`, and a browser without geolocation counts as `"unavailable"`. The position is labelled "Your location" (no reverse geocoding) and is **not** saved to storage. A counter (`placeRequest`) makes sure a slow location answer can't replace a city picked meanwhile.
- Day/night: `renderCurrent` sets `data-time="day" | "night"` on the current-weather card from `isDay`; CSS sets the card's colors per value (in both light and dark themes).

## Git workflow

- Work directly on `main`. No feature branches.
- After each build step passes typecheck, lint, test and build, commit and push to `origin main`.
- Use Conventional Commit messages: `feat:`, `fix:`, `chore:`, `test:`, `docs:`.
- Never force-push. Never commit while any check is failing.

## Working with me (learning mode)

- I'm learning TypeScript. The first time you use a TS feature in this project (generics, discriminated unions, type guards, `satisfies`, `z.infer`, `never`, etc.), explain it in 1–2 sentences in your reply — not as long code comments.
- Prefer clear, explicit types over clever type gymnastics.
- Keep changes small and focused — one build step per commit.
- If something is ambiguous, ask instead of guessing.
- Don't rewrite code I've changed by hand unless I ask.
