import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createMemoryStorage,
  readEntry,
  writeEntry,
  type StorageEntry,
  type StorageLike,
} from "./storage.ts";

const entry: StorageEntry<{ name: string }> = {
  key: "test:v1:thing",
  schema: z.object({ name: z.string() }),
};

function throwingStorage(): StorageLike {
  const fail = (): never => {
    throw new DOMException("Blocked", "SecurityError");
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

describe("readEntry / writeEntry", () => {
  it("round-trips valid data", () => {
    const storage = createMemoryStorage();

    expect(writeEntry(storage, entry, { name: "Colombo" })).toBe(true);
    expect(readEntry(storage, entry)).toEqual({ name: "Colombo" });
  });

  it("returns null for a missing key", () => {
    expect(readEntry(createMemoryStorage(), entry)).toBeNull();
  });

  it("ignores and removes corrupt JSON", () => {
    const storage = createMemoryStorage();
    storage.setItem(entry.key, "{not json");

    expect(readEntry(storage, entry)).toBeNull();
    expect(storage.getItem(entry.key)).toBeNull();
  });

  it("ignores and removes data with the wrong shape", () => {
    const storage = createMemoryStorage();
    storage.setItem(entry.key, JSON.stringify({ name: 42 }));

    expect(readEntry(storage, entry)).toBeNull();
    expect(storage.getItem(entry.key)).toBeNull();
  });

  it("never throws when storage throws", () => {
    const storage = throwingStorage();

    expect(readEntry(storage, entry)).toBeNull();
    expect(writeEntry(storage, entry, { name: "Colombo" })).toBe(false);
  });

  it("still returns null when removing bad data throws", () => {
    const storage: StorageLike = {
      getItem: () => "{not json",
      setItem: () => undefined,
      removeItem: () => {
        throw new Error("nope");
      },
    };

    expect(readEntry(storage, entry)).toBeNull();
  });
});
