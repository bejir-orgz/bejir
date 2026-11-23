import assert from "node:assert/strict";
import test from "node:test";
import { requestBackend } from "./client.ts";

test("browser requests use /backend and preserve POST options", async () => {
  const original = globalThis.fetch;
  const options = { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal: new AbortController().signal };
  globalThis.fetch = async (input, init) => {
    assert.equal(input, "/backend/api/v1/assistant/chat");
    assert.equal(init, options);
    return Response.json({ answer: "test" });
  };
  try {
    assert.deepEqual(await requestBackend("/api/v1/assistant/chat", options), { answer: "test" });
    globalThis.fetch = async (input) => {
      assert.equal(input, "/backend");
      return Response.json({ status: "ok" });
    };
    await requestBackend("/");
  } finally { globalThis.fetch = original; }
});

test("browser gateway preserves validation messages and non-JSON errors", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ detail: [{ msg: "Input tidak valid." }] }, { status: 422 });
    await assert.rejects(requestBackend("/api/v1/evacuation/routes"), /Input tidak valid/);
    globalThis.fetch = async () => new Response("unavailable", { status: 502 });
    await assert.rejects(requestBackend("/api/v1/assistant/chat"), /Permintaan API gagal/);
  } finally { globalThis.fetch = original; }
});
