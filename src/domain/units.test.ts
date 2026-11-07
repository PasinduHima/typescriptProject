import { describe, expect, it } from "vitest";
import {
  celsiusToFahrenheit,
  formatTemperature,
  formatWindSpeed,
  kmhToMph,
} from "./units.ts";

describe("celsiusToFahrenheit", () => {
  it("converts the freezing point", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
  });

  it("converts the boiling point", () => {
    expect(celsiusToFahrenheit(100)).toBe(212);
  });

  it("converts negative temperatures", () => {
    expect(celsiusToFahrenheit(-40)).toBe(-40);
    expect(celsiusToFahrenheit(-10)).toBe(14);
  });
});

describe("kmhToMph", () => {
  it("converts km/h to mph", () => {
    expect(kmhToMph(0)).toBe(0);
    expect(kmhToMph(1.609344)).toBeCloseTo(1);
    expect(kmhToMph(100)).toBeCloseTo(62.137, 3);
  });
});

describe("formatTemperature", () => {
  it("formats Celsius", () => {
    expect(formatTemperature(0, "celsius")).toBe("0°C");
    expect(formatTemperature(-5, "celsius")).toBe("-5°C");
  });

  it("formats Fahrenheit", () => {
    expect(formatTemperature(0, "fahrenheit")).toBe("32°F");
    expect(formatTemperature(-10, "fahrenheit")).toBe("14°F");
  });

  it("rounds to whole numbers", () => {
    expect(formatTemperature(21.4, "celsius")).toBe("21°C");
    expect(formatTemperature(21.5, "celsius")).toBe("22°C");
    expect(formatTemperature(21.4, "fahrenheit")).toBe("71°F"); // 70.52
  });

  it("never shows negative zero", () => {
    expect(formatTemperature(-0.4, "celsius")).toBe("0°C");
  });
});

describe("formatWindSpeed", () => {
  it("formats km/h", () => {
    expect(formatWindSpeed(12.6, "kmh")).toBe("13 km/h");
  });

  it("formats mph", () => {
    expect(formatWindSpeed(100, "mph")).toBe("62 mph");
    expect(formatWindSpeed(0, "mph")).toBe("0 mph");
  });
});
