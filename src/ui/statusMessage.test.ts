import { describe, expect, it } from "vitest";
import type { City } from "../domain/types.ts";
import { createInitialState, type AppState } from "../state.ts";
import { getStatusMessage, START_MESSAGE } from "./statusMessage.ts";

const colombo: City = {
  id: 1,
  name: "Colombo",
  latitude: 6.9,
  longitude: 79.8,
  country: "Sri Lanka",
};

function stateWith(changes: Partial<AppState>): AppState {
  return { ...createInitialState(), ...changes };
}

describe("getStatusMessage", () => {
  it("shows the start message before anything happens", () => {
    expect(getStatusMessage(createInitialState())).toEqual({
      text: START_MESSAGE,
      tone: "info",
    });
  });

  it("shows searching and no-results messages", () => {
    expect(
      getStatusMessage(stateWith({ search: { status: "loading" } })).text,
    ).toBe("Searching…");
    expect(
      getStatusMessage(
        stateWith({
          query: " zzqxv ",
          isListOpen: true,
          search: { status: "success", data: [] },
        }),
      ).text,
    ).toBe("No places found for “zzqxv”.");
  });

  it("announces how many places were found", () => {
    const state = stateWith({
      isListOpen: true,
      search: { status: "success", data: [colombo] },
    });
    expect(getStatusMessage(state).text).toMatch(/^1 place found/);
  });

  it("shows search errors with the error tone", () => {
    const state = stateWith({
      search: { status: "error", error: { kind: "http", status: 500 } },
    });
    expect(getStatusMessage(state).tone).toBe("error");
  });

  it("shows forecast loading with the city name", () => {
    const state = stateWith({
      selectedPlace: { kind: "city", city: colombo },
      forecast: { status: "loading" },
    });
    expect(getStatusMessage(state).text).toBe(
      "Loading weather for Colombo, Sri Lanka…",
    );
  });

  it("shows a message while locating, and the location label while loading", () => {
    expect(getStatusMessage(stateWith({ locating: true })).text).toBe(
      "Finding your location…",
    );
    const state = stateWith({
      selectedPlace: {
        kind: "my-location",
        coordinates: { latitude: 7.29, longitude: 80.63 },
      },
      forecast: { status: "loading" },
    });
    expect(getStatusMessage(state).text).toBe(
      "Loading weather for Your location…",
    );
  });

  it("shows geolocation errors with the error tone", () => {
    const state = stateWith({
      forecast: {
        status: "error",
        error: { kind: "geolocation", reason: "denied" },
      },
    });
    expect(getStatusMessage(state).tone).toBe("error");
    expect(getStatusMessage(state).text).toMatch(/denied/);
  });

  it("shows forecast errors and stays quiet on success", () => {
    const failed = stateWith({
      selectedPlace: { kind: "city", city: colombo },
      forecast: { status: "error", error: { kind: "network", message: "x" } },
    });
    expect(getStatusMessage(failed).tone).toBe("error");

    const loaded = stateWith({
      selectedPlace: { kind: "city", city: colombo },
      forecast: {
        status: "success",
        data: {
          current: {
            temperatureC: 25,
            feelsLikeC: 30,
            humidityPercent: 90,
            windSpeedKmh: 5,
            weatherCode: 0,
            isDay: true,
          },
          daily: [],
        },
      },
    });
    expect(getStatusMessage(loaded).text).toBe("");
  });
});
