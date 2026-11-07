import type { z } from "zod";

/** The parts of the Web Storage API we use. Tests pass an in-memory fake. */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** A storage key paired with the schema its value must match. */
export type StorageEntry<T> = {
  key: string;
  schema: z.ZodType<T>;
};

/** Deletes a key, ignoring storage errors. */
export function removeEntry<T>(
  storage: StorageLike,
  entry: StorageEntry<T>,
): void {
  try {
    storage.removeItem(entry.key);
  } catch {
    // Storage unavailable: nothing to clean up.
  }
}

/**
 * Reads and validates a stored value.
 * Returns null if it's missing, storage throws, or the data is corrupt or outdated
 * (corrupt/outdated data is also removed).
 */
export function readEntry<T>(
  storage: StorageLike,
  entry: StorageEntry<T>,
): T | null {
  let raw: string | null;
  try {
    raw = storage.getItem(entry.key);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    removeEntry(storage, entry);
    return null;
  }

  const parsed = entry.schema.safeParse(data);
  if (!parsed.success) {
    removeEntry(storage, entry);
    return null;
  }
  return parsed.data;
}

/** Stores a value as JSON. Returns false if storage throws (full, disabled, …). */
export function writeEntry<T>(
  storage: StorageLike,
  entry: StorageEntry<T>,
  value: T,
): boolean {
  try {
    storage.setItem(entry.key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** A Map-backed StorageLike, for tests and as a fallback when localStorage is blocked. */
export function createMemoryStorage(): StorageLike {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
  };
}

/** window.localStorage, or an in-memory fallback if the browser blocks it. */
export function getLocalStorage(): StorageLike {
  try {
    return window.localStorage;
  } catch {
    return createMemoryStorage();
  }
}
