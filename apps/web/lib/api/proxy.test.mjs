import "./test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import contract from "./openapi.json" with { type: "json" };
const { proxyBackend } = await import("./proxy.ts");
const { validateSchema } = await import("./validation.ts");

function example(schema) {
  if (schema.$ref) return example(contract.components.schemas[schema.$ref.split("/").at(-1)]);
  if (schema.anyOf) return example(schema.anyOf[0]);
  if ("const" in schema) return schema.const;
  if (schema.enum) return schema.enum[0];
  if (schema.type === "object") return Object.fromEntries((schema.required ?? []).map((name) => [name, example(schema.properties[name])]));
  if (schema.type === "array") return Array.from({ length: schema.minItems ?? 0 }, () => example(schema.items));
  if (schema.type === "string") return schema.format === "uuid" ? "11111111-1111-1111-1111-111111111111" : "Example";
  if (schema.type === "number" || schema.type === "integer") return schema.minimum ?? (schema.exclusiveMinimum ?? 0) + 1;
  if (schema.type === "null") return null;
  return {};
}

test("every documented operation is reachable with its request and response schema", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const [template, operations] of Object.entries(contract.paths)) {
      const path = template.replace(/\{[^}]+\}/g, "1");
      for (const [method, operation] of Object.entries(operations)) {
        const success = Object.keys(operation.responses).find((status) => status.startsWith("2"));
        const schema = operation.responses[success]?.content?.["application/json"]?.schema ?? {};
        const result = example(schema);
        const bodySchema = operation.requestBody?.content?.["application/json"]?.schema;
        globalThis.fetch = async (input, init) => {
          if (path === "/api/v1/assistant/chat" && new URL(input).pathname === "/api/v1/flood/statistics") {
            return Response.json({ summary: { total_events: 2245 } });
          }
          assert.equal(new URL(input).pathname, path);
          assert.equal(init.method.toLowerCase(), method);
          return Response.json(result, { status: Number(success) });
        };
        const response = await proxyBackend(new Request("http://localhost/api/backend" + path, {
          method: method.toUpperCase(),
          headers: bodySchema ? { "Content-Type": "application/json" } : {},
          body: bodySchema ? JSON.stringify(example(bodySchema)) : undefined,
        }), path);
        assert.equal(response.status, Number(success), method + " " + path);
        assert.deepEqual(await response.json(), result);
      }
    }
    for (const schema of Object.values(contract.components.schemas)) {
      assert.deepEqual(validateSchema(schema, example(schema), contract.components.schemas), []);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("invalid chat and route inputs are rejected and backend failures are sanitized", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => { throw new Error("must not fetch"); };
    const routePath = "/api/v1/evacuation/routes";
    const request = (body) => new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    assert.equal((await proxyBackend(request({ origin_latitude: 0, origin_longitude: 0, limit: 11 }), routePath)).status, 422);
    assert.equal((await proxyBackend(request({ origin_latitude: 91, origin_longitude: 0 }), routePath)).status, 422);
    assert.equal((await proxyBackend(request({ messages: [], sources: [] }), "/api/v1/assistant/chat")).status, 422);
    assert.equal((await proxyBackend(new Request("http://localhost"), "/anything")).status, 404);
    assert.equal((await proxyBackend(request({}), "/")).status, 405);
    globalThis.fetch = async () => Response.json({ detail: "database password=private" }, { status: 503 });
    const failed = await proxyBackend(new Request("http://localhost"), "/");
    assert.equal(failed.status, 503);
    assert.doesNotMatch(JSON.stringify(await failed.json()), /password|private/);
    globalThis.fetch = async () => Response.json({ answer: 123 });
    assert.equal((await proxyBackend(request({ messages: [{ role: "user", content: "Banjir" }], sources: ["flood_history"] }), "/api/v1/assistant/chat")).status, 502);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("chat context preserves alternating roles, latest question and verified dataset totals", async () => {
  const originalFetch = globalThis.fetch;
  const question = "A".repeat(2000);
  try {
    globalThis.fetch = async (input, init) => {
      if (new URL(input).pathname.endsWith("/sites")) return Response.json({ total: 14338 });
      const body = JSON.parse(init.body);
      assert.equal(body.messages.at(-1).content, question);
      assert.ok(body.messages.length <= 12);
      assert.match(body.messages[0].content, /14338/);
      body.messages.forEach((message, index) => assert.equal(message.role, index % 2 ? "model" : "user"));
      return Response.json({ answer: "14338", sources: ["evacuation_sites"], model: "test" });
    };
    const messages = Array.from({ length: 11 }, (_, index) => ({ role: index % 2 ? "model" : "user", content: index === 10 ? question : "History" }));
    const response = await proxyBackend(new Request("http://localhost", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, sources: ["evacuation_sites"] }),
    }), "/api/v1/assistant/chat");
    assert.equal(response.status, 200);
  } finally { globalThis.fetch = originalFetch; }
});
