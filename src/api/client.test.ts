import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { fetchJson } from "./client.ts";

const Schema = z.object({
  name: z.string(),
  daily: z.object({ time: z.array(z.string()) }),
});
const URL_ = "https://example.test/data";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("fetchJson", () => {
  it("returns the validated data on success", async () => {
    const data = { name: "ok", daily: { time: ["2026-11-07"] } };
    fetchMock.mockResolvedValue(jsonResponse(data));

    const result = await fetchJson(URL_, Schema);

    expect(result).toEqual({ ok: true, value: data });
    expect(fetchMock).toHaveBeenCalledWith(URL_, { signal: undefined });
  });

  it("returns an http error for a non-2xx status", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 500 }));

    expect(await fetchJson(URL_, Schema)).toEqual({
      ok: false,
      error: { kind: "http", status: 500 },
    });
  });

  it("returns a network error when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(await fetchJson(URL_, Schema)).toEqual({
      ok: false,
      error: { kind: "network", message: "Failed to fetch" },
    });
  });

  it("returns aborted when fetch rejects with an AbortError", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    expect(await fetchJson(URL_, Schema)).toEqual({
      ok: false,
      error: { kind: "aborted" },
    });
  });

  it("returns aborted when the signal was aborted, whatever the reason", async () => {
    const controller = new AbortController();
    controller.abort(new Error("custom reason"));
    fetchMock.mockRejectedValue(new Error("custom reason"));

    expect(await fetchJson(URL_, Schema, controller.signal)).toEqual({
      ok: false,
      error: { kind: "aborted" },
    });
  });

  it("returns invalid-response when the body isn't JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>not json</html>"));

    expect(await fetchJson(URL_, Schema)).toEqual({
      ok: false,
      error: {
        kind: "invalid-response",
        issues: ["Response body is not valid JSON"],
      },
    });
  });

  it("returns readable issues when the body fails the schema", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ name: 42, daily: {} }));

    const result = await fetchJson(URL_, Schema);

    if (result.ok) {
      expect.unreachable("expected an error");
    } else if (result.error.kind !== "invalid-response") {
      expect.unreachable("expected invalid-response");
    } else {
      expect(result.error.issues).toHaveLength(2);
      expect(result.error.issues[0]).toMatch(/^name: .*expected string/);
      expect(result.error.issues[1]).toMatch(/^daily\.time: .*expected array/);
    }
  });
});
