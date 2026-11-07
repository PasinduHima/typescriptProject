import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import colombo from "./__fixtures__/geocoding-colombo.json";
import noResults from "./__fixtures__/geocoding-no-results.json";
import { mapGeocodingResponse, searchCities } from "./geocoding.ts";
import { RawGeocodingResponseSchema } from "./schemas.ts";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function respondWith(body: unknown): void {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body)));
}

function calledUrl(): URL {
  const arg = fetchMock.mock.calls[0]?.[0];
  if (typeof arg !== "string") {
    throw new Error("fetch was not called with a string URL");
  }
  return new URL(arg);
}

describe("RawGeocodingResponseSchema", () => {
  it("accepts the real Colombo response", () => {
    expect(RawGeocodingResponseSchema.safeParse(colombo).success).toBe(true);
  });

  it("accepts a response with no `results` key", () => {
    expect(RawGeocodingResponseSchema.safeParse(noResults).success).toBe(true);
  });

  it("rejects a malformed result", () => {
    const bad = { results: [{ id: "1", name: "X" }] };
    expect(RawGeocodingResponseSchema.safeParse(bad).success).toBe(false);
  });

  it("accepts a result without country or admin1", () => {
    const sparse = {
      results: [{ id: 1, name: "X", latitude: 0, longitude: 0 }],
    };
    expect(RawGeocodingResponseSchema.safeParse(sparse).success).toBe(true);
  });
});

describe("mapGeocodingResponse", () => {
  it("treats a missing `results` key as []", () => {
    expect(mapGeocodingResponse({})).toEqual([]);
  });
});

describe("searchCities", () => {
  it("maps the Colombo fixture to cities", async () => {
    respondWith(colombo);

    const result = await searchCities("Colombo");

    if (!result.ok) {
      expect.unreachable("expected ok");
    } else {
      expect(result.value).toHaveLength(5);
      expect(result.value[0]).toEqual({
        id: 1248991,
        name: "Colombo",
        latitude: 6.93548,
        longitude: 79.84868,
        region: "Western Province",
        country: "Sri Lanka",
      });
    }
  });

  it("returns [] for the no-results fixture", async () => {
    respondWith(noResults);

    expect(await searchCities("zzqxv")).toEqual({ ok: true, value: [] });
  });

  it("doesn't call fetch for queries shorter than 2 characters", async () => {
    expect(await searchCities("")).toEqual({ ok: true, value: [] });
    expect(await searchCities("  a  ")).toEqual({ ok: true, value: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("encodes names with spaces and accents", async () => {
    respondWith(noResults);

    await searchCities("  Nuwara Eliya ");
    const url = calledUrl();

    expect(url.origin + url.pathname).toBe(
      "https://geocoding-api.open-meteo.com/v1/search",
    );
    expect(url.searchParams.get("name")).toBe("Nuwara Eliya");
    expect(url.searchParams.get("count")).toBe("5");
    expect(url.searchParams.get("language")).toBe("en");
    expect(url.searchParams.get("format")).toBe("json");
  });

  it("keeps accented characters intact", async () => {
    respondWith(noResults);

    await searchCities("São Paulo");

    expect(calledUrl().searchParams.get("name")).toBe("São Paulo");
  });

  it("passes errors through", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 503 }));

    expect(await searchCities("Colombo")).toEqual({
      ok: false,
      error: { kind: "http", status: 503 },
    });
  });
});
