# Weather App

A small, fast weather app built with **vanilla TypeScript + Vite** — no UI framework. Search for a city, pick a match, and see the current conditions plus a 5-day forecast. Weather data comes from [Open-Meteo](https://open-meteo.com/) (free, no API key).

This is a learning project: the focus is on clear, strict TypeScript.

<!-- Screenshot: add an image here, e.g. ![Weather App screenshot](docs/screenshot.png) -->

## Features

- City search with a 300 ms debounce, up to 5 matches, and cancelled stale requests (`AbortController`)
- Accessible results list (ARIA combobox): ↑ / ↓ to move, Enter to select, Esc to close, mouse click, click outside to close
- Current weather: temperature, feels-like, humidity, wind, condition label and icon
- 5-day forecast with day names ("Today" first), icons and max / min temperatures
- °C / °F toggle (wind switches between km/h and mph) — converted on the client, no refetch
- Remembers the last city and unit in `localStorage` and restores them on startup
- "Use my location" via the Geolocation API (shown as "Your location"; not saved)
- Day/night styling for the current-weather card, from Open-Meteo's `is_day`
- Clear start, loading, "no results" and error messages in an `aria-live` region
- Mobile-first layout (from 360 px), light and dark themes, visible focus styles, reduced-motion support

## Tech stack

| Area          | Tool                                              |
| ------------- | ------------------------------------------------- |
| Language      | TypeScript (strict)                               |
| Build / dev   | Vite (`vanilla-ts`)                               |
| Validation    | Zod v4                                            |
| Tests         | Vitest                                            |
| Lint / format | ESLint (typescript-eslint, type-aware) + Prettier |
| Styling       | Plain CSS with custom properties                  |
| Data          | Open-Meteo geocoding + forecast APIs              |

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Command             | What it does                      |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the Vite dev server         |
| `npm run build`     | Type-check, then build to `dist/` |
| `npm run preview`   | Preview the production build      |
| `npm run typecheck` | `tsc --noEmit`                    |
| `npm run test`      | Run the Vitest suite once         |
| `npm run lint`      | Run ESLint                        |

## Folder structure

```
src/
├── main.ts          # entry point: wires events → state → render
├── state.ts         # AppState, LoadState<T>, a tiny store
├── persistence.ts   # localStorage keys + Zod schemas
├── api/             # fetchJson, geocoding, forecast, raw Zod schemas, fixtures
├── domain/          # app types, units, weather codes, dates, errors, city labels
├── ui/              # typed DOM helpers, render functions, status messages
├── lib/             # Result, assertNever, debounce, storage, geolocation
└── styles.css
docs/
└── TYPESCRIPT_NOTES.md
```

Tests sit next to the code they test (`units.test.ts` beside `units.ts`).

## Key design decisions

- **Nothing from outside is trusted.** API responses and `localStorage` values are `unknown` until a Zod schema validates them.
- **Raw vs domain types.** `api/schemas.ts` describes the API's snake_case shapes; `domain/types.ts` holds the camelCase types the app uses. Mapping happens only in `api/`.
- **No throwing.** API functions return `Result<T>` — `{ ok: true, value } | { ok: false, error }` — and the UI picks a message for each `AppError` kind. Cancelled requests are silent.
- **Discriminated unions + exhaustive switches.** Loading states (`LoadState<T>`) and errors are unions; every `switch` ends in `assertNever`, so adding a case is a compile error until it's handled.
- **Places, not just cities.** The selected place is `{ kind: "city"; city } | { kind: "my-location"; coordinates }`. Open-Meteo has no reverse geocoding, so a device position is labelled "Your location" and isn't saved.
- **Callbacks become Results.** `getCurrentCoordinates()` wraps `navigator.geolocation` in a `Promise<Result<Coordinates>>`; denied, unavailable (including no geolocation support) and timeout are `AppError`s like any other.
- **Metric in, convert on display.** The API is always called in °C and km/h; the unit toggle only changes formatting.
- **Dates stay strings.** Forecast dates are `"YYYY-MM-DD"` in the city's timezone and are formatted in UTC so the browser's timezone never shifts the day.
- **Safe DOM.** API text is inserted with `textContent`, never `innerHTML`.
- **No escape hatches.** No `any`, no `as` casts (except `as const`), no `!`, no `@ts-ignore`.

## Attribution

Weather data by [Open-Meteo.com](https://open-meteo.com/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
