import type { AssistantChatRequest } from "../../lib/api/schemas";
import { fetchBackend } from "../../lib/api/backend";

export async function groundAssistantRequest(payload: AssistantChatRequest): Promise<AssistantChatRequest> {
  const facts = ["Metadata terverifikasi dari API Bejir. Gunakan metadata total berikut untuk pertanyaan jumlah seluruh dataset. Sampel retrieval dapat memuat sebagian baris."];
  if (payload.sources.includes("evacuation_sites")) {
    const response = await fetchBackend("/api/v1/evacuation/sites?limit=1", { cache: "no-store" });
    if (!response.ok) throw new Error("Metadata titik evakuasi gagal dimuat.");
    const data = await response.json() as { total: number };
    if (!Number.isSafeInteger(data.total) || data.total < 0) throw new Error("Metadata titik evakuasi tidak valid.");
    facts.push(`Total titik evakuasi pada endpoint /evacuation/sites adalah ${data.total}.`);
  }
  if (payload.sources.includes("flood_history")) {
    const response = await fetchBackend("/api/v1/flood/statistics", { cache: "no-store" });
    if (!response.ok) throw new Error("Metadata histori gagal dimuat.");
    const data = await response.json() as { summary: { total_events: number } };
    if (!Number.isSafeInteger(data.summary.total_events)) throw new Error("Metadata histori tidak valid.");
    facts.push(`Total kejadian pada endpoint /flood/statistics adalah ${data.summary.total_events}.`);
  }
  facts.push("Periode Spatial Analysis dan pemetaan resmi kode kelas kerawanan belum dikonfirmasi. Paparan penduduk dan hasil simulasi harus dijelaskan sesuai jenis datanya.");
  const messages = payload.messages.slice(-9);
  return {
    ...payload,
    messages: [
      { role: "user", content: facts.join("\n") },
      { role: "model", content: "Metadata API diterima sebagai acuan jumlah seluruh dataset." },
      ...messages,
    ],
  };
}
