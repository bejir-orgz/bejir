"use client";

import { useEffect, useRef, useState } from "react";
import { IconBoxMultiple, IconBrandTelegram, IconCaretUpFilled, IconFolders } from "@tabler/icons-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { assistantLayers } from "../data/sources";
import { askAssistant, assistantSources } from "../api";
import type { AssistantMessage } from "../../../lib/api/schemas";
import { AssistantMarkdown } from "./assistant-markdown";

const starterQuestions = [
  "Daerah mana di Jawa Barat yang paling sering mengalami banjir?",
  "Bagaimana pengaruh jaringan sungai dan elevasi terhadap kerawanan banjir?",
  "Apa langkah kesiapsiagaan warga di kecamatan berkerawanan tinggi?",
];

export function BejirAssistant({ defaultLayerIds }: { defaultLayerIds: readonly string[] }) {
  const [question, setQuestion] = useState("");
  const [selectedLayerIds, setSelectedLayerIds] = useState<readonly string[] | null>(null);
  const sourceLayerIds = assistantLayers.filter((layer) => (selectedLayerIds ?? defaultLayerIds).includes(layer.id)).map((layer) => layer.id);
  const [exchanges, setExchanges] = useState<{ id: number; question: string; answer: string; error?: boolean }[]>([]);
  const [pending, setPending] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const latestExchange = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLFormElement>(null);
  const sourceTrigger = useRef<HTMLButtonElement>(null);
  const [sourceMenuOffset, setSourceMenuOffset] = useState(48);

  useEffect(() => {
    if (exchanges.length) latestExchange.current?.scrollIntoView({ block: "nearest" });
  }, [exchanges.length]);

  async function submitQuestion(overrideQuestion?: string, overrideLayerIds?: typeof sourceLayerIds) {
    const text = (overrideQuestion ?? question).trim();
    const activeIds = overrideLayerIds ?? sourceLayerIds;
    const sources = assistantSources(activeIds);
    if (!text || pending || !sources.length) return;
    const history: AssistantMessage[] = exchanges.filter((item) => !item.error).flatMap((item) => [
      { role: "user" as const, content: item.question },
      { role: "model" as const, content: item.answer.slice(0, 2000) },
    ]).slice(-10);
    const id = Date.now();
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setQuestion("");
    setExchanges((previous) => [...previous, { id, question: text, answer: "Memuat jawaban..." }]);
    try {
      const response = await askAssistant({ messages: [...history, { role: "user", content: text }], sources }, controller.signal);
      if (!controller.signal.aborted) setExchanges((previous) => previous.map((item) => item.id === id ? { ...item, answer: response.answer } : item));
    } catch (error) {
      if (!controller.signal.aborted) setExchanges((previous) => previous.map((item) => item.id === id ? { ...item, error: true, answer: error instanceof Error ? error.message : "Jawaban belum dapat dimuat." } : item));
    } finally {
      if (!controller.signal.aborted) setPending(false);
    }
  }

  function handleStarterClick(prompt: string) {
    if (!sourceLayerIds.length) {
      const allIds = assistantLayers.map((layer) => layer.id);
      setSelectedLayerIds(allIds);
      void submitQuestion(prompt, allIds);
      return;
    }
    void submitQuestion(prompt);
  }

  return (
    <div className="gis-ai-assistant flex flex-1 flex-col min-w-0 min-h-0">
      <div className="gis-ai-conversation pr-1 flex-1 text-[12px] leading-[16px] wrap-anywhere [&:focus-visible]:[outline:2px_solid_var(--gis-blue)] [&:focus-visible]:[outline-offset:-2px] [&:focus-visible]:rounded-lg" tabIndex={0} role="region" aria-label="Percakapan Aji">
        {exchanges.length === 0 ? (
          <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/55 p-4 text-neutral-800">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Tanya Aji, Asisten Geospasial SIBAJAWA</h3>
              <p className="mt-1 text-xs leading-5 text-neutral-600">
                Aji menjawab pertanyaan berdasarkan sumber data SIBAJAWA yang kamu pilih (histori banjir, curah hujan, jaringan sungai, kerawanan, dan evakuasi).
              </p>
            </div>

            {sourceLayerIds.length === 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                <span>Pilih minimal 1 sumber data, atau klik pertanyaan di bawah untuk mengaktifkan semua sumber.</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100 hover:text-amber-950"
                  onClick={() => setSelectedLayerIds(assistantLayers.map((layer) => layer.id))}
                >
                  Aktifkan semua sumber
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-neutral-500">Contoh pertanyaan siap pakai:</span>
              {starterQuestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={pending}
                  onClick={() => handleStarterClick(prompt)}
                  className="cursor-pointer rounded-xl border border-blue-200 bg-white px-3 py-2 text-left text-xs leading-4 font-medium text-blue-900 transition-[background-color,border-color,transform] duration-150 ease-[var(--ease-out-strong)] hover:border-blue-400 hover:bg-blue-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="gis-ai-exchanges" aria-live="polite" aria-relevant="additions">
            {exchanges.map((exchange, index) => (
              <div className="gis-ai-exchange mt-4 scroll-mb-36 scroll-mt-20 transition-opacity duration-200 starting:opacity-0" key={exchange.id} ref={index === exchanges.length - 1 ? latestExchange : undefined}>
                <p className="gis-ai-question w-[min(352px,100%)] m-[0_0_16px_auto] p-4 rounded-2xl bg-[#dbeafe] text-neutral-900 whitespace-pre-wrap">{exchange.question}</p>
                {exchange.error ? <p className="gis-ai-demo-reply pb-4 text-red-700 whitespace-pre-wrap">{exchange.answer}</p> : <AssistantMarkdown text={exchange.answer} />}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="gis-ai-footer after:content-[''] after:absolute after:inset-x-0 after:-bottom-4 after:h-4 after:bg-white sticky bottom-0 z-10 mt-auto flex shrink-0 flex-col gap-2 bg-white pt-2">
        <form ref={composer} className="gis-ai-composer shrink-0 p-2 [border:1px_solid_var(--gis-border)] rounded-2xl bg-[white] [&:focus-within]:border-[var(--gis-blue)] [&_textarea]:[field-sizing:content] [&_textarea]:min-h-6 [&_textarea]:h-auto [&_textarea]:max-h-24 [&_textarea]:p-0 [&_textarea]:border-0 [&_textarea]:rounded-none [&_textarea]:resize-none [&_textarea]:text-[12px] [&_textarea]:leading-[16px] [&_textarea]:bg-[white] [&_textarea:focus-visible]:[outline:none] [&_textarea::placeholder]:text-[#737373]" onSubmit={(event) => { event.preventDefault(); void submitQuestion(); }}>
          <Label className="sr-only" htmlFor="gis-question">Tanya Aji</Label>
          <Textarea id="gis-question" name="gis-question" className="focus-visible:ring-0" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={sourceLayerIds.length ? "Tanya Aji seputar banjir Jawa Barat..." : "Pilih sumber data di bawah lalu tanya Aji..."} rows={1} maxLength={2000} onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submitQuestion(); }
          }} />
          <div className="gis-ai-composer-actions flex items-center justify-between gap-2 mt-2 [&_button]:h-10 [&_button]:p-2 [&_button]:rounded-[10px] [&_button]:bg-[#e5e5e5] [&_button]:text-[#525252] [&_button:hover]:bg-[#d4d4d4] [&_.gis-ai-layer-trigger:is([data-has-sources=true],[data-state=open])]:bg-[#dbeafe] [&_.gis-ai-layer-trigger:is([data-has-sources=true],[data-state=open])]:text-[var(--gis-blue)] [&_.gis-ai-send]:w-10 [&_.gis-ai-send:not(:disabled)]:bg-[var(--gis-blue)] [&_.gis-ai-send:not(:disabled)]:text-[white]">
            <DropdownMenu onOpenChange={(open) => {
              if (open && composer.current && sourceTrigger.current) {
                setSourceMenuOffset(sourceTrigger.current.getBoundingClientRect().top - composer.current.getBoundingClientRect().top + 8);
              }
            }}>
              <DropdownMenuTrigger asChild>
                <Button ref={sourceTrigger} type="button" variant="secondary" className="gis-ai-layer-trigger gap-[10px] text-[16px] leading-[24px] font-medium [&[data-state=closed]_.gis-ai-source-caret]:[transform:rotate(180deg)]" data-has-sources={sourceLayerIds.length > 0} aria-label={`Pilih sumber, ${sourceLayerIds.length} dipilih`}>
                  <IconFolders className="size-6" aria-hidden="true" /><span>{sourceLayerIds.length}</span><IconCaretUpFilled className="gis-ai-source-caret size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" alignOffset={-8} sideOffset={sourceMenuOffset} className="gis-ai-layer-menu flex flex-col gap-2 w-52 max-w-[calc(100vw_-_32px)] p-4 rounded-2xl">
                <DropdownMenuLabel className="gis-ai-source-title p-0 text-[16px] leading-[24px] font-normal">Sumber</DropdownMenuLabel>
                {assistantLayers.map((layer) => <DropdownMenuCheckboxItem className="gis-ai-source-item min-h-6 p-[0_24px_0_0] gap-4 rounded-sm text-[12px] leading-[16px] cursor-pointer [&[data-state=checked]]:text-[#000] [&[data-state=unchecked]]:text-[#737373] [&_>_span:first-child]:left-auto [&_>_span:first-child]:right-0 [&_>_span:first-child]:w-6 [&_>_span:first-child]:h-6 [&_>_span:first-child_svg]:w-6 [&_>_span:first-child_svg]:h-6" key={layer.id} checked={sourceLayerIds.includes(layer.id)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => setSelectedLayerIds(checked ? [...sourceLayerIds, layer.id] : sourceLayerIds.filter((id) => id !== layer.id))}><IconBoxMultiple className="size-6" aria-hidden="true" /><span>{layer.label}</span></DropdownMenuCheckboxItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="submit" size="icon" className="gis-ai-send" disabled={!question.trim() || pending || !assistantSources(sourceLayerIds).length} aria-label="Kirim pertanyaan"><IconBrandTelegram className="size-6" aria-hidden="true" /></Button>
          </div>
        </form>
      </div>
    </div>
  );
}
