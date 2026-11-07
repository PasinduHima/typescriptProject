import { describe, expect, it } from "vitest";
import { formatCityLabel } from "./cityLabel.ts";

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
