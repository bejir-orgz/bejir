import contract from "./openapi.json" with { type: "json" };
import { fetchBackend } from "./backend";
import { validateSchema, type JsonSchema } from "./validation";
import { groundAssistantRequest } from "../../features/assistant/context";
import type { AssistantChatRequest, RouteRequest } from "./schemas";

interface Operation {
  parameters?: { name: string; in: string; schema: JsonSchema; required?: boolean }[];
  requestBody?: { content: { "application/json": { schema: JsonSchema } } };
  responses: Record<string, { content?: { "application/json"?: { schema: JsonSchema } } }>;
}

const paths = contract.paths as Record<string, Record<string, Operation>>;
const schemas = contract.components.schemas as Record<string, JsonSchema>;

/**
 * Upstream detail text is never echoed; it has carried credentials before. A known
 * failure gets wording of our own so "backend down" doesn't hide an exhausted AI quota.
 */
function upstreamFailure(path: string, status: number): string | undefined {
  if (path === "/api/v1/assistant/chat" && status === 503) return "Layanan AI sedang tidak tersedia atau kuotanya habis. Coba lagi nanti.";
  // The routing road network covers only part of the province and refuses the rest in
  // English. Our own validator already answered 422, so a 400 here is that refusal.
  if (path === "/api/v1/evacuation/routes" && status === 400) return "Belum ada jaringan jalan yang terhubung di titik ini, jadi rute belum bisa dihitung. Coba titik lain.";
  // One broken feature should not read as the whole site being down.
  if (path === "/api/v1/evacuation/routes" && status >= 500) return "Pencarian rute evakuasi sedang bermasalah. Fitur peta yang lain tetap bisa dipakai.";
  return status >= 500 ? "Layanan backend belum tersedia." : undefined;
}

/**
 * Someone waiting on a map click gives up long before the default minute. A route search
 * that runs past twenty seconds is unusable whatever the cause, so fail it fast and say so.
 */
function deadline(path: string, signal: AbortSignal): AbortSignal {
  return path === "/api/v1/evacuation/routes" ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : signal;
}

export async function proxyBackend(request: Request, path: string): Promise<Response> {
  const template = Object.keys(paths).find((entry) => {
    const pattern = entry.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{[^}]+\}/g, "[^/]+");
    return new RegExp(`^${pattern}$`).test(path);
  });
  if (!template) return Response.json({ detail: "Endpoint tidak tersedia." }, { status: 404 });
  const operation = paths[template][request.method.toLowerCase()];
  if (!operation) return Response.json({ detail: "Metode tidak didukung." }, { status: 405 });
  let body: unknown;
  if (operation.requestBody) {
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return Response.json({ detail: "Gunakan Content-Type application/json." }, { status: 415 });
    }
    try { body = await request.json(); } catch {
      return Response.json({ detail: [{ loc: ["body"], msg: "JSON tidak valid.", type: "json_invalid" }] }, { status: 422 });
    }
    const issues = validateSchema(operation.requestBody.content["application/json"].schema, body, schemas, ["body"]);
    if (issues.length) return Response.json({ detail: issues }, { status: 422 });
    if (path === "/api/v1/evacuation/routes") {
      const route = body as RouteRequest;
      if (Math.abs(route.origin_latitude) > 90 || Math.abs(route.origin_longitude) > 180) {
        return Response.json({ detail: [{ loc: ["body"], msg: "Koordinat EPSG:4326 di luar batas.", type: "value_error" }] }, { status: 422 });
      }
    }
  }
  try {
    if (path === "/api/v1/assistant/chat" && body !== undefined) {
      body = await groundAssistantRequest(body as AssistantChatRequest);
    }
    const upstream = await fetchBackend(path + new URL(request.url).search, {
      method: request.method,
      headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: deadline(path, request.signal),
      cache: "no-store",
    });
    const replacement = upstreamFailure(path, upstream.status);
    if (replacement) return Response.json({ detail: replacement }, { status: upstream.status });
    const result: unknown = await upstream.json();
    const schema = operation.responses[String(upstream.status)]?.content?.["application/json"]?.schema;
    if (schema && validateSchema(schema, result, schemas).length) {
      return Response.json({ detail: "Respons backend tidak sesuai kontrak." }, { status: 502 });
    }
    return Response.json(result, { status: upstream.status });
  } catch {
    // A routing deadline lands here, and "connection failed" would misdescribe it.
    return Response.json({ detail: upstreamFailure(path, 503) ?? "Koneksi backend gagal." }, { status: 502 });
  }
}
