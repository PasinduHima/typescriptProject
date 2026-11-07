import { describe, expect, it } from "vitest";
import { moveActiveIndex } from "./listNavigation.ts";

describe("moveActiveIndex", () => {
  it("starts at the first item on ↓ and the last on ↑", () => {
    expect(moveActiveIndex(null, 1, 5)).toBe(0);
    expect(moveActiveIndex(null, -1, 5)).toBe(4);
  });

  it("moves by one", () => {
    expect(moveActiveIndex(1, 1, 5)).toBe(2);
    expect(moveActiveIndex(1, -1, 5)).toBe(0);
  });

  it("wraps around at both ends", () => {
    expect(moveActiveIndex(4, 1, 5)).toBe(0);
    expect(moveActiveIndex(0, -1, 5)).toBe(4);
  });

  it("returns null for an empty list", () => {
    expect(moveActiveIndex(null, 1, 0)).toBeNull();
    expect(moveActiveIndex(2, -1, 0)).toBeNull();
  });
});
