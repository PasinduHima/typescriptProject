import { describe, expect, it } from "vitest";
import { getCurrentCoordinates, type GeolocationLike } from "./geolocation.ts";

function succeedingGeolocation(
  latitude: number,
  longitude: number,
): GeolocationLike {
  return {
    getCurrentPosition: (onSuccess) => {
      onSuccess({
        coords: {
          latitude,
          longitude,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      });
    },
  };
}

function failingGeolocation(code: number): GeolocationLike {
  return {
    getCurrentPosition: (_onSuccess, onError) => {
      onError?.({
        code,
        message: "failed",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    },
  };
}

describe("getCurrentCoordinates", () => {
  it("resolves with the coordinates", async () => {
    expect(
      await getCurrentCoordinates(succeedingGeolocation(7.29, 80.63)),
    ).toEqual({
      ok: true,
      value: { latitude: 7.29, longitude: 80.63 },
    });
  });

  it("maps each error code to a reason", async () => {
    const reasons = await Promise.all(
      [1, 2, 3].map(async (code) => {
        const result = await getCurrentCoordinates(failingGeolocation(code));
        return !result.ok && result.error.kind === "geolocation"
          ? result.error.reason
          : null;
      }),
    );
    expect(reasons).toEqual(["denied", "unavailable", "timeout"]);
  });

  it('treats a browser without geolocation as "unavailable"', async () => {
    expect(await getCurrentCoordinates(undefined)).toEqual({
      ok: false,
      error: { kind: "geolocation", reason: "unavailable" },
    });
  });

  it('treats a throwing geolocation API as "unavailable"', async () => {
    const throwing: GeolocationLike = {
      getCurrentPosition: () => {
        throw new Error("blocked");
      },
    };
    expect(await getCurrentCoordinates(throwing)).toEqual({
      ok: false,
      error: { kind: "geolocation", reason: "unavailable" },
    });
  });
});
