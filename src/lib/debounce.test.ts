import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce.ts";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("debounce", () => {
  it("calls the function once, after the delay", () => {
    const fn = vi.fn<(query: string) => void>();
    const debounced = debounce(fn, 300);

    debounced("C");
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledExactlyOnceWith("C");
  });

  it("restarts the timer on every call and uses the latest arguments", () => {
    const fn = vi.fn<(query: string) => void>();
    const debounced = debounce(fn, 300);

    debounced("C");
    vi.advanceTimersByTime(200);
    debounced("Co");
    vi.advanceTimersByTime(200);
    debounced("Col");
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledExactlyOnceWith("Col");
  });

  it("cancel() stops a pending call", () => {
    const fn = vi.fn<(query: string) => void>();
    const debounced = debounce(fn, 300);

    debounced("Col");
    debounced.cancel();
    vi.advanceTimersByTime(1000);

    expect(fn).not.toHaveBeenCalled();
  });

  it("calls again for calls spaced further apart than the delay", () => {
    const fn = vi.fn<(query: string) => void>();
    const debounced = debounce(fn, 300);

    debounced("a");
    vi.advanceTimersByTime(300);
    debounced("b");
    vi.advanceTimersByTime(300);

    expect(fn.mock.calls).toEqual([["a"], ["b"]]);
  });
});
