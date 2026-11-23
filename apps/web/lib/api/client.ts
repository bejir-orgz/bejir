export async function requestBackend<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/backend${path === "/" ? "" : path}`, init);
  if (!response.ok) {
    let message = "Permintaan API gagal.";
    try {
      const body = await response.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail)) message = body.detail.map((item: { msg?: string }) => item.msg || "Input tidak valid.").join(" ");
    } catch { /* Use the fallback when the upstream response isn't JSON. */ }
    throw new Error(message);
  }
  return response.json();
}
