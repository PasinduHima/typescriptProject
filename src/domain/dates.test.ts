import { describe, expect, it } from "vitest";
import { forecastDayLabel, formatDayName } from "./dates.ts";

describe("formatDayName", () => {
  it("formats a date as a short weekday", () => {
    expect(formatDayName("2026-11-07")).toBe("Sat");
    expect(formatDayName("2026-11-08")).toBe("Sun");
    expect(formatDayName("2026-11-09")).toBe("Mon");
  });

  it("handles month and year boundaries", () => {
    expect(formatDayName("2026-12-31")).toBe("Thu");
    expect(formatDayName("2027-01-01")).toBe("Fri");
  });

  it("returns the input for invalid dates", () => {
    expect(formatDayName("not a date")).toBe("not a date");
    expect(formatDayName("2026-13-45")).toBe("2026-13-45");
    expect(formatDayName("")).toBe("");
  });
});

describe("forecastDayLabel", () => {
  it('shows "Today" for the first day', () => {
    expect(forecastDayLabel("2026-11-07", 0)).toBe("Today");
  });

  it("shows the weekday for later days", () => {
    expect(forecastDayLabel("2026-11-08", 1)).toBe("Sun");
  });
});
