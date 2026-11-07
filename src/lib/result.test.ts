import { describe, expect, expectTypeOf, it } from "vitest";
import type { AppError } from "../domain/types.ts";
import { err, ok, type Result } from "./result.ts";

function parsePositive(n: number): Result<number> {
  return n > 0
    ? ok(n)
    : err({ kind: "invalid-response", issues: ["not positive"] });
}

describe("ok / err", () => {
  it("ok() wraps a value", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("err() wraps an error", () => {
    expect(err({ kind: "aborted" })).toEqual({
      ok: false,
      error: { kind: "aborted" },
    });
  });

  it("narrows on .ok", () => {
    const good = parsePositive(5);
    if (good.ok) {
      expectTypeOf(good.value).toEqualTypeOf<number>();
      expect(good.value).toBe(5);
    } else {
      expect.unreachable("expected ok");
    }

    const bad = parsePositive(-1);
    if (!bad.ok) {
      expectTypeOf(bad.error).toEqualTypeOf<AppError>();
      expect(bad.error).toEqual({
        kind: "invalid-response",
        issues: ["not positive"],
      });
    } else {
      expect.unreachable("expected error");
    }
  });
});
