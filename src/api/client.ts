import type { z } from "zod";
import { err, ok, type Result } from "../lib/result.ts";
import type { AppError } from "../domain/types.ts";

/** Turns Zod issues into readable lines like "daily.time: Invalid input: expected array, received undefined". */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.map((key) => String(key)).join(".");
    return path === "" ? issue.message : `${path}: ${issue.message}`;
  });
}

function isAbort(error: unknown, signal: AbortSignal | undefined): boolean {
  if (signal?.aborted === true) return true;
  return error instanceof DOMException && error.name === "AbortError";
}

function toRequestError(
  error: unknown,
  signal: AbortSignal | undefined,
): AppError {
  if (isAbort(error, signal)) return { kind: "aborted" };
  const message =
    error instanceof Error ? error.message : "Network request failed";
  return { kind: "network", message };
}

/**
 * Fetches a URL and validates the JSON body with `schema`.
 * Never throws: every failure becomes an AppError.
 */
export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<Result<T>> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    return err(toRequestError(error, signal));
  }

  if (!response.ok) {
    return err({ kind: "http", status: response.status });
  }

  // response.json() is typed `any`; store it as `unknown` until Zod has checked it.
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (isAbort(error, signal)) return err({ kind: "aborted" });
    return err({
      kind: "invalid-response",
      issues: ["Response body is not valid JSON"],
    });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return err({
      kind: "invalid-response",
      issues: formatIssues(parsed.error),
    });
  }
  return ok(parsed.data);
}
