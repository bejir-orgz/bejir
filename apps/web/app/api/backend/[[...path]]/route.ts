import { proxyBackend } from "@/lib/api/proxy";

type Context = { params: Promise<{ path?: string[] }> };

async function handle(request: Request, context: Context) {
  const { path = [] } = await context.params;
  return proxyBackend(request, "/" + path.map(encodeURIComponent).join("/"));
}

export const GET = handle;
export const POST = handle;
