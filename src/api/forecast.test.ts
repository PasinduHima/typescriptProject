import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import fixture from "./__fixtures__/forecast-colombo.json";
import { getForecast, mapForecast, zipDaily } from "./forecast.ts";
import { RawForecastResponseSchema, type RawDaily } from "./schemas.ts";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function parsedFixture() {
  const parsed = RawForecastResponseSchema.safeParse(fixture);
  if (!parsed.success) throw new Error("fixture no longer matches the schema");
  return parsed.data;
}

const daily: RawDaily = {
  time: ["2026-11-07", "2026-11-08", "2026-11-09"],
  weather_code: [81, 95, 80],
  temperature_2m_max: [30.3, 28.8, 29.1],
  temperature_2m_min: [24.5, 23.7, 23.6],
};

describe("RawForecastResponseSchema", () => {
  it("accepts the real Colombo response", () => {
    expect(RawForecastResponseSchema.safeParse(fixture).success).toBe(true);
  });

  it("rejects a response without `daily`", () => {
    const withoutDaily = { ...fixture, daily: undefined };
    expect(RawForecastResponseSchema.safeParse(withoutDaily).success).toBe(
      false,
    );
  });

  it("rejects null in the `current` block", () => {
    const bad = {
      ...fixture,
      current: { ...fixture.current, temperature_2m: null },
    };
    expect(RawForecastResponseSchema.safeParse(bad).success).toBe(false);
  });

  it("allows null in the daily number arrays", () => {
    const withNull = {
      ...fixture,
      daily: {
        ...fixture.daily,
        temperature_2m_max: [null, 28.8, 29.1, 28.7, 29.3],
      },
    };
    expect(RawForecastResponseSchema.safeParse(withNull).success).toBe(true);
  });
});

describe("mapForecast", () => {
  it("maps the fixture to 5 days and a boolean isDay", () => {
    const result = mapForecast(parsedFixture());

    if (!result.ok) {
      expect.unreachable("expected ok");
    } else {
      const { current, daily: days } = result.value;
      expect(current).toEqual({
        temperatureC: 25.4,
        feelsLikeC: 31.1,
        humidityPercent: 95,
        windSpeedKmh: 5.3,
        weatherCode: 51,
        isDay: false,
      });
      expectTypeOf(current.isDay).toEqualTypeOf<boolean>();
      expect(days).toHaveLength(5);
      expect(days[0]).toEqual({
        date: "2026-11-07",
        weatherCode: 81,
        maxTemperatureC: 30.3,
        minTemperatureC: 24.5,
      });
    }
  });
});

describe("zipDaily", () => {
  it("zips parallel arrays into one object per day", () => {
    const result = zipDaily(daily);
    expect(result.ok && result.value.map((d) => d.date)).toEqual([
      "2026-11-07",
      "2026-11-08",
      "2026-11-09",
    ]);
  });

  it("skips days with a null value", () => {
    const result = zipDaily({
      ...daily,
      weather_code: [81, null, 80],
      temperature_2m_min: [24.5, 23.7, null],
    });
    expect(result.ok && result.value.map((d) => d.date)).toEqual([
      "2026-11-07",
    ]);
  });

  it("returns invalid-response when array lengths differ", () => {
    const result = zipDaily({ ...daily, temperature_2m_min: [24.5, 23.7] });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "invalid-response",
        issues: [
          "daily: arrays have different lengths (time=3, weather_code=3, temperature_2m_max=3, temperature_2m_min=2)",
        ],
      },
    });
  });
});

describe("getForecast", () => {
  it("fetches with the right params and maps the response", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(fixture)));

    const result = await getForecast({
      latitude: 6.93548,
      longitude: 79.84868,
    });

    expect(result.ok && result.value.daily).toHaveLength(5);
    const arg = fetchMock.mock.calls[0]?.[0];
    if (typeof arg !== "string") throw new Error("expected a string URL");
    const params = new URL(arg).searchParams;
    expect(params.get("latitude")).toBe("6.93548");
    expect(params.get("longitude")).toBe("79.84868");
    expect(params.get("timezone")).toBe("auto");
    expect(params.get("forecast_days")).toBe("5");
    expect(params.get("current")).toContain("is_day");
  });

  it("returns invalid-response for a malformed body", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ current: {} })));

    const result = await getForecast({ latitude: 0, longitude: 0 });

    expect(!result.ok && result.error.kind).toBe("invalid-response");
  });
});
