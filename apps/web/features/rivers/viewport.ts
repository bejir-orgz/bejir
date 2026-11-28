import type { FeatureCollection, MultiLineString } from "geojson";
import { riverDetail, riverViewportStatusMessage, type RiverBounds, type RiverViewportStatus } from "./data";
import type { RiverProperties } from "./types";

type RiverCollection = FeatureCollection<MultiLineString, RiverProperties> & RiverViewportStatus;
type LoadStatus = { message: string; retry?: () => void } | undefined;

function paddedBounds([west, south, east, north]: RiverBounds): RiverBounds {
  const dx = (east - west) / 8;
  const dy = (north - south) / 8;
  return [
    Math.max(-180, Math.floor((west - dx) * 1e5) / 1e5),
    Math.max(-90, Math.floor((south - dy) * 1e5) / 1e5),
    Math.min(180, Math.ceil((east + dx) * 1e5) / 1e5),
    Math.min(90, Math.ceil((north + dy) * 1e5) / 1e5),
  ];
}

function covers(bounds: RiverBounds, view: RiverBounds, detail: number) {
  return bounds[0] <= view[0] && bounds[1] <= view[1] &&
    bounds[2] >= view[2] && bounds[3] >= view[3] && riverDetail(bounds).simplifyM === detail;
}

export function riverViewportLoader(
  regionIds: string[],
  onData: (data: RiverCollection, signal: AbortSignal) => void | Promise<void>,
  onStatus: (status: LoadStatus) => void,
) {
  let loaded: { bounds: RiverBounds; status: LoadStatus } | undefined;
  let pending: { bounds: RiverBounds; controller: AbortController } | undefined;

  async function load(view: RiverBounds) {
    const bounds = paddedBounds(view);
    const { simplifyM } = riverDetail(bounds);
    if (loaded && covers(loaded.bounds, view, simplifyM)) {
      pending?.controller.abort();
      pending = undefined;
      onStatus(loaded.status);
      return;
    }
    if (pending && covers(pending.bounds, view, simplifyM)) return;
    pending?.controller.abort();
    const controller = new AbortController();
    const { signal } = controller;
    pending = { bounds, controller };
    const query = new URLSearchParams({ bbox: bounds.join(",") });
    for (const id of regionIds) query.append("region", id);
    onStatus({ message: "Memuat jaringan sungai…" });
    try {
      const response = await fetch(`/backend/web/rivers/layers?${query}`, { signal });
      if (!response.ok) throw new Error("Jaringan sungai belum dapat dimuat.");
      const data: RiverCollection = await response.json();
      if (signal.aborted) return;
      await onData(data, signal);
      if (signal.aborted) return;
      const status = riverViewportStatusMessage(data);
      loaded = { bounds, status };
      onStatus(status);
    } catch {
      if (!signal.aborted) onStatus({ message: "Jaringan sungai belum dapat dimuat.", retry: () => void load(view) });
    } finally {
      if (pending?.controller === controller) pending = undefined;
    }
  }

  return { load, abort: () => pending?.controller.abort() };
}
