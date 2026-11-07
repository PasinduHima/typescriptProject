# TypeScript notes

A study sheet: every TypeScript feature used in this project, with where to find it.

## Compiler settings

### `strict` and friends — `tsconfig.json`

`strict` turns on the core safety checks: `null`/`undefined` must be handled explicitly, and nothing is silently `any`. On top of that we use `noUncheckedIndexedAccess` (indexing returns `T | undefined`), `noFallthroughCasesInSwitch`, `noImplicitOverride`, and `verbatimModuleSyntax` (type-only imports must say `import type`).

### `import type` — everywhere, e.g. `src/api/forecast.ts`

`import type { City } from "./types.ts"` imports something used only as a type; it's erased from the JavaScript output. Inline form: `import { ok, type Result } from "../lib/result.ts"`. Required by `verbatimModuleSyntax`.

## Basic types

### Type aliases and object types — `src/domain/types.ts`

`type CurrentWeather = { temperatureC: number; … }` names a shape so it can be reused. Each property has a type; TypeScript checks every object you build against it.

### Optional properties — `src/domain/types.ts`

`region?: string` means the property may be missing. Reading it gives `string | undefined`, so you must handle the missing case (see `formatCityLabel`).

### String literal unions — `src/domain/types.ts`

`type TempUnit = "celsius" | "fahrenheit"` allows only those exact strings. Typos like `"celcius"` are compile errors. We use these instead of `enum`.

### Explicit return types — every exported function

`export function kmhToMph(kmh: number): number` states what comes out. If the body returns something else, the error points at the function, not at some distant caller.

### Function types — `src/ui/render.ts`

`onSelectCity: (city: City) => void` describes a function's parameters and return. `Handlers` uses it so `render` can call back into `main.ts` with the right arguments.

## Combining types

### Intersection types — `src/domain/types.ts`

`type City = Coordinates & { id: number; … }` means "everything in `Coordinates` plus these fields". A `City` can be passed anywhere a `Coordinates` is expected, e.g. `getForecast(city)`.

### Discriminated unions — `src/lib/result.ts`, `src/domain/types.ts`, `src/state.ts`

A union whose members share a literal "tag" field: `ok: true | false` in `Result`, `kind` in `AppError`, `status` in `LoadState`. Checking the tag tells TypeScript exactly which member you have.

### Narrowing — `src/main.ts`, `src/ui/render.ts`

Inside `if (result.ok) { … }` TypeScript knows `result.value` exists; in the `else` it knows `result.error` exists. The same happens in each `case` of a `switch`, after `=== null` checks, and after `typeof x === "string"`.

### `never` and exhaustive switches — `src/lib/assertNever.ts`, `src/domain/errors.ts`

`never` is the type with no values. After a `switch` handles every union member, the leftover is `never`, so `default: return assertNever(x)` compiles. Add a new member and that line errors until you handle it.

### `never` on the unused side — `src/lib/result.ts`

`ok(value)` returns `Result<T, never>`. `never` fits into any type, so the result can be returned where `Result<T, AppError>` (or any error type) is expected.

## Generics

### Generic types and functions — `src/lib/result.ts`, `src/state.ts`, `src/api/client.ts`

`Result<T, E>` and `LoadState<T>` take type parameters, so one definition works for `City[]`, `Forecast`, etc. `fetchJson<T>(…)` infers `T` from the schema you pass.

### Generic defaults — `src/lib/result.ts`

`Result<T, E = AppError>`: if you leave out `E`, it's `AppError`. So `Result<Forecast>` means `Result<Forecast, AppError>`.

### Generic constraints — `src/ui/dom.ts`, `src/lib/debounce.ts`

`<T extends Element>` limits what `T` can be. `<K extends keyof HTMLElementTagNameMap>` allows only real tag names. `<Args extends unknown[]>` captures a function's parameter list as a tuple.

### Rest parameters with a generic tuple — `src/lib/debounce.ts`

`fn: (...args: Args) => void` means the debounced function takes exactly the same parameters as the original — `debounce((q: string) => …)` only accepts a string.

### Constructor types — `src/ui/dom.ts`

`ctor: new () => T` accepts a class like `HTMLInputElement`. Combined with `el instanceof ctor`, `getEl("#search-input", HTMLInputElement)` returns a real `HTMLInputElement` with no cast.

## Utility types and type operators

### `Partial<T>` — `src/state.ts`

Makes every property optional. `update(changes: Partial<AppState>)` lets callers pass only the fields that changed.

### `Readonly<T>` — `src/state.ts`, `src/ui/render.ts`

Makes properties read-only. The UI receives `Readonly<AppState>`, so it can't change state except through `update()`.

### `Pick<T, Keys>` — `src/lib/storage.ts`, `src/domain/cityLabel.ts`

Builds a type from some of another type's properties. `Pick<Storage, "getItem" | "setItem" | "removeItem">` lets tests pass a small fake instead of real `localStorage`.

### `Record<K, V>` — `src/domain/weatherCodes.ts`

An object type with keys `K` and values `V`. `Record<number, WeatherInfo>` describes the weather-code table.

### `ReturnType<typeof f>` — `src/lib/debounce.ts`

Gets a function's return type. `ReturnType<typeof setTimeout>` works whether timers return a `number` (browser) or an object (Node).

### `keyof` and indexed access types — `src/ui/dom.ts`

`keyof HTMLElementTagNameMap` is the union of all tag names; `HTMLElementTagNameMap[K]` looks up the element type for one tag. So `createEl("li")` returns `HTMLLIElement`.

### `typeof` in a type position — tests, e.g. `src/api/client.test.ts`

`vi.fn<typeof fetch>()` reuses the type of an existing value (`fetch`) so the mock has the exact same signature.

## Literal and table checking

### `satisfies` — `src/domain/weatherCodes.ts`, `src/persistence.ts`

Checks a value against a type without changing the value's own type. The weather table is checked entry by entry; `StoredCitySchema satisfies z.ZodType<City>` proves the schema produces a `City`.

### `as const` — `src/domain/units.ts`

`["celsius", "fahrenheit"] as const` keeps the exact string literals in a readonly tuple instead of widening to `string[]`. `z.enum(TEMP_UNITS)` needs that.

### `noUncheckedIndexedAccess` in practice — `src/api/forecast.ts`, `src/main.ts`

`raw.time[i]` is `string | undefined`, so `zipDaily` checks each value before using it. `results[state.activeIndex]` in the Enter handler is checked the same way. No `!` needed.

## Dealing with outside data

### `unknown` — `src/api/client.ts`, `src/lib/storage.ts`

Like `any`, it accepts every value, but you can't use it until you narrow it. `response.json()` and `JSON.parse()` results are stored as `unknown` and only become typed after Zod validates them.

### `catch` variables are `unknown` — `src/api/client.ts`

In strict mode, `catch (error)` gives `error: unknown`, because anything can be thrown. `catch {}` (no variable) is fine when you don't need it — see `src/lib/storage.ts`.

### `instanceof` narrowing — `src/api/client.ts`, `src/ui/dom.ts`, `src/main.ts`

`error instanceof DOMException` narrows `unknown` to `DOMException`, so `.name` is allowed. `event.target instanceof HTMLInputElement` does the same for DOM events.

### User-defined type guards — `src/domain/units.ts`, `src/domain/cityLabel.ts`

`function isTempUnit(value: string): value is TempUnit` returns a boolean that also narrows the argument. In `.filter((part): part is string => …)` it tells TypeScript the `undefined`s are gone.

### `z.infer` — `src/api/schemas.ts`

`type RawDaily = z.infer<typeof RawDailySchema>` derives a type from a runtime schema, so the shape is written once and the type can't drift from the validation.

### `z.ZodType<T>` as a generic parameter — `src/api/client.ts`, `src/lib/storage.ts`

`fetchJson<T>(url, schema: z.ZodType<T>)` accepts any schema and returns `Result<T>` for whatever that schema outputs. `StorageEntry<T>` ties a storage key to a schema the same way.

## Everyday syntax

### Optional chaining `?.` and nullish coalescing `??` — `src/main.ts`, `src/domain/weatherCodes.ts`

`searchController?.abort()` only calls `abort` if the controller isn't `null`. `lookup[code] ?? UNKNOWN_WEATHER` uses the fallback only for `null`/`undefined` (unlike `||`, which also replaces `0` and `""`).

### `async` / `Promise<Result<T>>` — `src/api/*.ts`

`async function searchCities(…): Promise<Result<City[]>>` always resolves — failures are values, not exceptions — so callers just check `.ok` after `await`.

### `void` for fire-and-forget promises — `src/main.ts`

`void loadForecast(city)` says "I'm intentionally not awaiting this". The type-aware lint rule `no-floating-promises` requires it.

### Type-level tests — `src/lib/result.test.ts`, `src/api/forecast.test.ts`

`expectTypeOf(good.value).toEqualTypeOf<number>()` checks types, not values: the test fails to compile if narrowing stops working.
