import { describe, expect, it } from "vitest";
import { createMemoryStorage, readEntry, writeEntry } from "./lib/storage.ts";
import { LAST_CITY, UNIT } from "./persistence.ts";

describe("persisted entries", () => {
  it("round-trips a city with and without optional fields", () => {
    const storage = createMemoryStorage();
    const city = {
      id: 1248991,
      name: "Colombo",
      latitude: 6.93548,
      longitude: 79.84868,
      region: "Western Province",
      country: "Sri Lanka",
    };

    writeEntry(storage, LAST_CITY, city);
    expect(readEntry(storage, LAST_CITY)).toEqual(city);

    writeEntry(storage, LAST_CITY, {
      id: 1,
      name: "X",
      latitude: 0,
      longitude: 0,
    });
    expect(readEntry(storage, LAST_CITY)).toEqual({
      id: 1,
      name: "X",
      latitude: 0,
      longitude: 0,
    });
  });

  it("rejects a city saved in an old shape", () => {
    const storage = createMemoryStorage();
    storage.setItem(
      LAST_CITY.key,
      JSON.stringify({ name: "Colombo", lat: 6.9 }),
    );

    expect(readEntry(storage, LAST_CITY)).toBeNull();
  });

  it("round-trips the unit and rejects unknown units", () => {
    const storage = createMemoryStorage();

    writeEntry(storage, UNIT, "fahrenheit");
    expect(readEntry(storage, UNIT)).toBe("fahrenheit");

    storage.setItem(UNIT.key, JSON.stringify("kelvin"));
    expect(readEntry(storage, UNIT)).toBeNull();
  });
});
