import { describe, expect, it } from "vitest";
import { getWeatherInfo } from "./weatherCodes.ts";

describe("getWeatherInfo", () => {
  it("maps known codes", () => {
    expect(getWeatherInfo(0)).toEqual({ label: "Clear sky", icon: "☀️" });
    expect(getWeatherInfo(3).label).toBe("Overcast");
    expect(getWeatherInfo(65).label).toBe("Heavy rain");
    expect(getWeatherInfo(99).label).toBe("Thunderstorm with hail");
  });

  it("returns the fallback for unknown codes", () => {
    expect(getWeatherInfo(4)).toEqual({ label: "Unknown", icon: "❓" });
    expect(getWeatherInfo(-1).label).toBe("Unknown");
    expect(getWeatherInfo(1.5).label).toBe("Unknown");
  });
});
