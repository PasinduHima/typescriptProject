import { describe, expect, it } from "vitest";
import { formatError } from "./errors.ts";

describe("formatError", () => {
  it("explains network errors", () => {
    expect(
      formatError({ kind: "network", message: "Failed to fetch" }),
    ).toMatch(/internet connection/);
  });

  it("explains server errors with the status code", () => {
    expect(formatError({ kind: "http", status: 503 })).toBe(
      "The weather service is having trouble (error 503). Please try again later.",
    );
  });

  it("explains rate limiting", () => {
    expect(formatError({ kind: "http", status: 429 })).toMatch(
      /Too many requests/,
    );
  });

  it("explains other HTTP errors", () => {
    expect(formatError({ kind: "http", status: 400 })).toBe(
      "The weather service couldn't handle the request (error 400).",
    );
  });

  it("explains invalid responses without showing raw issues", () => {
    const message = formatError({
      kind: "invalid-response",
      issues: ["daily.time: expected array"],
    });
    expect(message).toMatch(/couldn't read/);
    expect(message).not.toContain("daily.time");
  });

  it("shows nothing for aborted requests", () => {
    expect(formatError({ kind: "aborted" })).toBe("");
  });
});
