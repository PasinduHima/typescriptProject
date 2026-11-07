import { describe, expect, it, vi } from "vitest";
import { createInitialState, createStore } from "./state.ts";

describe("createStore", () => {
  it("merges changes and notifies the listener", () => {
    const onChange = vi.fn();
    const store = createStore(createInitialState(), onChange);

    store.update({ query: "Col", isListOpen: true });

    expect(store.getState().query).toBe("Col");
    expect(store.getState().isListOpen).toBe(true);
    expect(store.getState().unit).toBe("celsius"); // untouched fields stay
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(store.getState());
  });

  it("replaces the state object instead of mutating it", () => {
    const store = createStore(createInitialState(), () => undefined);
    const before = store.getState();

    store.update({ query: "x" });

    expect(store.getState()).not.toBe(before);
    expect(before.query).toBe("");
  });
});
