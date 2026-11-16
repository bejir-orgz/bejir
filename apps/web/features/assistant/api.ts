import { requestBackend } from "../../lib/api/client";
import type { AssistantChatRequest, AssistantChatResponse } from "../../lib/api/schemas";
import type { AssistantLayerId } from "./data/sources";

export function assistantSources(ids: AssistantLayerId[]): AssistantChatRequest["sources"] {
  const sources = new Set<AssistantChatRequest["sources"][number]>();
  for (const id of ids) {
    if (id === "rivers") sources.add("rivers");
    if (id === "evacuation") sources.add("evacuation_sites");
    if (id === "flood-area") sources.add("flood_history");
    if (["rainfall", "dem", "susceptibility", "land-cover"].includes(id)) sources.add("flood_susceptibility");
    if (id === "susceptibility") sources.add("population_exposure");
  }
  return [...sources];
}

export function askAssistant(payload: AssistantChatRequest, signal?: AbortSignal) {
  return requestBackend<AssistantChatResponse>("/api/v1/assistant/chat", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal,
  });
}
