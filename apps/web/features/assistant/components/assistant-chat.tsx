"use client";

import { useEffect, useRef, useState } from "react";
import { IconBoxMultiple, IconBrandTelegram, IconCaretUpFilled, IconFolders } from "@tabler/icons-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { assistantLayers, defaultAssistantLayerIds, type AssistantLayerId } from "../data/assistant-sources";

type Message = { role: "user" | "model"; content: string };
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export function AssistantChat() {
  const [question, setQuestion] = useState("");
  const [sourceIds, setSourceIds] = useState<AssistantLayerId[]>(defaultAssistantLayerIds);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestMessage = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLFormElement>(null);
  const sourceTrigger = useRef<HTMLButtonElement>(null);
  const [sourceMenuOffset, setSourceMenuOffset] = useState(48);

  useEffect(() => {
    if (messages.length) latestMessage.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, sending]);

  async function submitQuestion() {
    const text = question.trim();
    if (!text || sending || sourceIds.length === 0) return;

    const nextMessages = [...messages, { role: "user" as const, content: text }].slice(-12);
    if (nextMessages[0]?.role === "model") nextMessages.shift();
    setMessages(nextMessages);
    setQuestion("");
    setError(null);
    setSending(true);

    try {
      const response = await fetch(`${apiUrl}/api/v1/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, sources: sourceIds }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.detail === "string" ? result.detail : "Aji belum dapat menjawab. Coba lagi.");
      }
      if (typeof result.answer !== "string") throw new Error("Format jawaban dari API tidak dikenali.");
      setMessages([...nextMessages, { role: "model", content: result.answer }].slice(-12));
    } catch (requestError) {
      setMessages(messages);
      setQuestion(text);
      setError(requestError instanceof Error ? requestError.message : "Koneksi ke asisten AI gagal. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="gis-ai-assistant flex flex-1 flex-col min-w-0 min-h-0">
      <div className="gis-ai-conversation pr-1 flex-1 text-[12px] leading-[18px] wrap-anywhere [&:focus-visible]:[outline:2px_solid_var(--gis-blue)] [&:focus-visible]:[outline-offset:-2px] [&:focus-visible]:rounded-lg" tabIndex={0} role="region" aria-label="Percakapan Aji">
        {messages.length === 0 && (
          <div className="mb-5 rounded-2xl bg-[#f5f7fa] p-4">
            <p className="mb-1 font-medium">Halo, saya Aji.</p>
            <p className="m-0 text-[#525252]">Tanyakan data banjir, kerawanan, paparan penduduk, atau titik evakuasi yang tersedia di Bejir.</p>
          </div>
        )}
        <div className="gis-ai-exchanges" aria-live="polite" aria-relevant="additions">
          {messages.map((message, index) => (
            <div className="gis-ai-exchange mt-4 scroll-mb-36 scroll-mt-20" key={`${index}-${message.role}`} ref={index === messages.length - 1 ? latestMessage : undefined}>
              <p className={`m-0 mb-3 whitespace-pre-wrap ${message.role === "user" ? "ml-auto w-[min(352px,100%)] rounded-2xl bg-[#dbeafe] p-4" : "pb-2"}`}>
                {message.content}
              </p>
            </div>
          ))}
          {sending && <p ref={latestMessage} className="mt-4 text-[#737373]" role="status">Aji sedang mencari konteks data…</p>}
        </div>
        {error && <p className="mt-3 rounded-xl bg-[#fff1f0] p-3 text-[#b42318]" role="alert">{error}</p>}
      </div>
      <div className="gis-ai-footer after:content-[''] after:absolute after:inset-x-0 after:-bottom-4 after:h-4 after:bg-white sticky bottom-0 z-10 mt-auto flex shrink-0 flex-col gap-2 bg-white pt-2">
        <form ref={composer} className="gis-ai-composer shrink-0 p-2 [border:1px_solid_var(--gis-border)] rounded-2xl bg-[white] [&:focus-within]:border-[var(--gis-blue)] [&_textarea]:[field-sizing:content] [&_textarea]:min-h-6 [&_textarea]:h-auto [&_textarea]:max-h-24 [&_textarea]:p-0 [&_textarea]:border-0 [&_textarea]:rounded-none [&_textarea]:resize-none [&_textarea]:text-[16px] [&_textarea]:leading-[24px] [&_textarea]:bg-[white] [&_textarea:focus-visible]:[outline:none] [&_textarea::placeholder]:text-[#a1a1a1]" onSubmit={(event) => { event.preventDefault(); void submitQuestion(); }}>
          <Label className="sr-only" htmlFor="gis-question">Tanya Aji</Label>
          <Textarea id="gis-question" className="focus-visible:ring-0" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Tanya Aji" rows={1} maxLength={2000} aria-describedby="gis-ai-note" onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submitQuestion(); }
          }} />
          <div className="gis-ai-composer-actions flex items-center justify-between gap-2 mt-2 [&_button]:h-10 [&_button]:p-2 [&_button]:rounded-[10px] [&_button]:bg-[#e5e5e5] [&_button]:text-[#737373] [&_button:hover]:bg-[#d4d4d4] [&_.gis-ai-layer-trigger:is([data-has-sources=true],[data-state=open])]:bg-[#dbeafe] [&_.gis-ai-layer-trigger:is([data-has-sources=true],[data-state=open])]:text-[var(--gis-blue)] [&_.gis-ai-send]:w-10 [&_.gis-ai-send:not(:disabled)]:bg-[var(--gis-blue)] [&_.gis-ai-send:not(:disabled)]:text-[white]">
            <DropdownMenu onOpenChange={(open) => {
              if (open && composer.current && sourceTrigger.current) {
                setSourceMenuOffset(sourceTrigger.current.getBoundingClientRect().top - composer.current.getBoundingClientRect().top + 8);
              }
            }}>
              <DropdownMenuTrigger asChild>
                <Button ref={sourceTrigger} type="button" variant="secondary" className="gis-ai-layer-trigger gap-[10px] text-[16px] leading-[24px] font-medium [&[data-state=closed]_.gis-ai-source-caret]:[transform:rotate(180deg)]" data-has-sources={sourceIds.length > 0} aria-label={`Pilih sumber, ${sourceIds.length} dipilih`}>
                  <IconFolders className="size-6" aria-hidden="true" /><span>{sourceIds.length}</span><IconCaretUpFilled className="gis-ai-source-caret size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" alignOffset={-8} sideOffset={sourceMenuOffset} className="gis-ai-layer-menu flex flex-col gap-2 w-60 max-w-[calc(100vw_-_32px)] p-4 rounded-2xl">
                <DropdownMenuLabel className="gis-ai-source-title p-0 text-[16px] leading-[24px] font-normal">Sumber data</DropdownMenuLabel>
                {assistantLayers.map((source) => <DropdownMenuCheckboxItem className="gis-ai-source-item min-h-6 p-[0_24px_0_0] gap-4 rounded-sm text-[12px] leading-[16px] cursor-pointer [&[data-state=checked]]:text-[#000] [&[data-state=unchecked]]:text-[#a1a1a1] [&_>_span:first-child]:left-auto [&_>_span:first-child]:right-0 [&_>_span:first-child]:w-6 [&_>_span:first-child]:h-6 [&_>_span:first-child_svg]:w-6 [&_>_span:first-child_svg]:h-6" key={source.id} checked={sourceIds.includes(source.id)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => setSourceIds((previous) => checked ? [...previous, source.id] : previous.filter((id) => id !== source.id))}><IconBoxMultiple className="size-6" aria-hidden="true" /><span>{source.label}</span></DropdownMenuCheckboxItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="submit" size="icon" className="gis-ai-send" disabled={!question.trim() || sending || sourceIds.length === 0} aria-label="Kirim pertanyaan"><IconBrandTelegram className="size-6" aria-hidden="true" /></Button>
          </div>
        </form>
        <p className="shrink-0 m-0 text-[#737373] text-[10px] leading-[14px] text-center" id="gis-ai-note">Jawaban berbasis data yang dipilih · Tidak memuat informasi real-time</p>
      </div>
    </div>
  );
}
