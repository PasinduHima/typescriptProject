import { describe, expect, it } from "vitest";
import {
  formatCityLabel,
  formatPlaceLabel,
  placeCoordinates,
} from "./cityLabel.ts";

describe("formatCityLabel", () => {
  it("joins name, region and country", () => {
    expect(
      formatCityLabel({
        name: "Colombo",
        region: "Western Province",
        country: "Sri Lanka",
      }),
    ).toBe("Colombo, Western Province, Sri Lanka");
  });

  it("skips a missing region", () => {
    expect(formatCityLabel({ name: "Colombo", country: "Sri Lanka" })).toBe(
      "Colombo, Sri Lanka",
    );
  });

  it("skips a missing country", () => {
    expect(
      formatCityLabel({ name: "Colombo", region: "Western Province" }),
    ).toBe("Colombo, Western Province");
  });

  it("shows just the name when nothing else is known", () => {
    expect(formatCityLabel({ name: "Colombo" })).toBe("Colombo");
  });

  it("skips empty strings", () => {
    expect(
      formatCityLabel({ name: "Colombo", region: "", country: "Sri Lanka" }),
    ).toBe("Colombo, Sri Lanka");
  });
});

describe("formatPlaceLabel / placeCoordinates", () => {
  const city = {
    id: 1,
    name: "Colombo",
    latitude: 6.9,
    longitude: 79.8,
    country: "Sri Lanka",
  };
  const here = { latitude: 7.29, longitude: 80.63 };

  it("labels a city with its full name", () => {
    expect(formatPlaceLabel({ kind: "city", city })).toBe("Colombo, Sri Lanka");
  });

  it('labels the device position "Your location"', () => {
    expect(formatPlaceLabel({ kind: "my-location", coordinates: here })).toBe(
      "Your location",
    );
  });

  it("returns the right coordinates for each kind", () => {
    expect(placeCoordinates({ kind: "city", city })).toMatchObject({
      latitude: 6.9,
      longitude: 79.8,
    });
    expect(placeCoordinates({ kind: "my-location", coordinates: here })).toBe(
      here,
    );
  });
});
