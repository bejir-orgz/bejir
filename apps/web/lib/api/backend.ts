export function fetchBackend(path: string, init: RequestInit = {}): Promise<Response> {
  const origin = (process.env.BEJIR_API_URL || "http://80.43.0.180:8000").replace(/\/+$/, "");
  return fetch(`${origin}${path}`, {
    ...init,
    signal: init.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(60_000)])
      : AbortSignal.timeout(60_000),
  });
}
