"use client";

import { useEffect, useRef, useState } from "react";
import { IconBoxMultiple, IconBrandTelegram, IconCaretUpFilled, IconFolders } from "@tabler/icons-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assistantLayers, defaultAssistantLayerIds, demoPrompt, demoReport, type AssistantLayerId, type DemoExchange } from "../data/demo-conversation";

function DemoReport({ report }: { report: typeof demoReport }) {
  return (
    <article className="gis-ai-report [&_section]:py-4 [&_section]:[border-bottom:1px_solid_var(--gis-border)] [&_section:first-child]:pt-0 [&_section:last-child]:[border-bottom:0] [&_h2]:mb-2 [&_h2]:text-[14px] [&_h2]:leading-[20px] [&_h2]:font-medium [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-3 [&_[data-slot=table]]:text-[12px] [&_[data-slot=table]]:leading-[16px] [&_[data-slot=table-row]]:border-0 [&_[data-slot=table-row]]:bg-[transparent] [&_:is([data-slot=table-head],[data-slot=table-cell])]:h-auto [&_:is([data-slot=table-head],[data-slot=table-cell])]:p-[0_8px_0_0] [&_:is([data-slot=table-head],[data-slot=table-cell])]:font-normal" aria-label="Contoh jawaban AI dengan data dummy">
      <section><h2>Rangkuman Kondisi</h2><p>{report.summary}</p></section>
      <section><h2>Analisis Curah Hujan</h2><p>{report.rainfall}</p></section>
      <section>
        <h2>Faktor Risiko Utama</h2><p>Faktor yang meningkatkan risiko:</p>
        <ol>{report.risks.map((risk) => <li key={risk}>{risk}</li>)}</ol>
        <p>Kesimpulan: kerawanan tinggi.</p>
      </section>
      <section>
        <h2>Prioritas Wilayah</h2>
        <Table aria-label="Contoh prioritas wilayah, data dummy">
          <TableHeader><TableRow><TableHead>Wilayah</TableHead><TableHead>Risiko</TableHead><TableHead>Fokus</TableHead></TableRow></TableHeader>
          <TableBody>{report.regions.map((region) => <TableRow key={region.name}><TableCell>{region.name}</TableCell><TableCell>{region.risk}</TableCell><TableCell>{region.focus}</TableCell></TableRow>)}</TableBody>
        </Table>
        <p>Pembaruan data: {report.updatedAt}</p>
      </section>
      <section><h2>Rekomendasi Tindak Lanjut</h2><p>Prioritas 30 hari:</p><ul>{report.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul></section>
    </article>
  );
}

export function DemoAssistant() {
  const [question, setQuestion] = useState("");
  const [layerIds, setLayerIds] = useState<AssistantLayerId[]>(defaultAssistantLayerIds);
  const [exchanges, setExchanges] = useState<DemoExchange[]>([]);
  const latestExchange = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLFormElement>(null);
  const sourceTrigger = useRef<HTMLButtonElement>(null);
  const [sourceMenuOffset, setSourceMenuOffset] = useState(48);

  useEffect(() => {
    if (exchanges.length) latestExchange.current?.scrollIntoView({ block: "nearest" });
  }, [exchanges.length]);

  function submitQuestion() {
    const text = question.trim();
    if (!text) return;
    setExchanges((previous) => [...previous, { id: previous.length + 1, question: text, layerIds: [...layerIds] }]);
    setQuestion("");
  }

  return (
    <div className="gis-ai-assistant flex flex-1 flex-col min-w-0 min-h-0">
      <div className="gis-ai-conversation pr-1 flex-1 text-[12px] leading-[16px] wrap-anywhere [&:focus-visible]:[outline:2px_solid_var(--gis-blue)] [&:focus-visible]:[outline-offset:-2px] [&:focus-visible]:rounded-lg" tabIndex={0} role="region" aria-label="Percakapan Aji, contoh data dummy">
        <p className="gis-ai-question w-[min(352px,100%)] m-[0_0_16px_auto] p-4 rounded-2xl bg-[#dbeafe] whitespace-pre-wrap">{demoPrompt}</p>
        <DemoReport report={demoReport} />
        <div className="gis-ai-exchanges" aria-live="polite" aria-relevant="additions">
          {exchanges.map((exchange, index) => (
            <div className="gis-ai-exchange mt-4 scroll-mb-36 scroll-mt-20" key={exchange.id} ref={index === exchanges.length - 1 ? latestExchange : undefined}>
              <p className="gis-ai-question w-[min(352px,100%)] m-[0_0_16px_auto] p-4 rounded-2xl bg-[#dbeafe] whitespace-pre-wrap">{exchange.question}</p>
              <p className="gis-ai-demo-reply pb-4">Jawaban demo — {exchange.layerIds.length ? `konteks: ${assistantLayers.filter((layer) => exchange.layerIds.includes(layer.id)).map((layer) => layer.label).join(", ")}.` : "tanpa layer dipilih."} Percakapan ini belum terhubung ke AI atau data aktual. Rangkuman di atas adalah contoh dari desain, bukan hasil analisis pertanyaan ini.</p>
            </div>
          ))}
        </div>
      </div>
      <div className="gis-ai-footer after:content-[''] after:absolute after:inset-x-0 after:-bottom-4 after:h-4 after:bg-white sticky bottom-0 z-10 mt-auto flex shrink-0 flex-col gap-2 bg-white pt-2">
        <form ref={composer} className="gis-ai-composer shrink-0 p-2 [border:1px_solid_var(--gis-border)] rounded-2xl bg-[white] [&:focus-within]:border-[var(--gis-blue)] [&_textarea]:[field-sizing:content] [&_textarea]:min-h-6 [&_textarea]:h-auto [&_textarea]:max-h-24 [&_textarea]:p-0 [&_textarea]:border-0 [&_textarea]:rounded-none [&_textarea]:resize-none [&_textarea]:text-[16px] [&_textarea]:leading-[24px] [&_textarea]:bg-[white] [&_textarea:focus-visible]:[outline:none] [&_textarea::placeholder]:text-[#a1a1a1]" onSubmit={(event) => { event.preventDefault(); submitQuestion(); }}>
          <Label className="sr-only" htmlFor="gis-question">Tanya Aji</Label>
          <Textarea id="gis-question" className="focus-visible:ring-0" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Tanya Aji" rows={1} maxLength={1000} aria-describedby="gis-ai-demo-note" onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submitQuestion(); }
          }} />
          <div className="gis-ai-composer-actions flex items-center justify-between gap-2 mt-2 [&_button]:h-10 [&_button]:p-2 [&_button]:rounded-[10px] [&_button]:bg-[#e5e5e5] [&_button]:text-[#737373] [&_button:hover]:bg-[#d4d4d4] [&_.gis-ai-layer-trigger:is([data-has-sources=true],[data-state=open])]:bg-[#dbeafe] [&_.gis-ai-layer-trigger:is([data-has-sources=true],[data-state=open])]:text-[var(--gis-blue)] [&_.gis-ai-send]:w-10 [&_.gis-ai-send:not(:disabled)]:bg-[var(--gis-blue)] [&_.gis-ai-send:not(:disabled)]:text-[white]">
            <DropdownMenu onOpenChange={(open) => {
              if (open && composer.current && sourceTrigger.current) {
                // Keep the menu above the whole composer, including multiline drafts.
                setSourceMenuOffset(sourceTrigger.current.getBoundingClientRect().top - composer.current.getBoundingClientRect().top + 8);
              }
            }}>
              <DropdownMenuTrigger asChild>
                <Button ref={sourceTrigger} type="button" variant="secondary" className="gis-ai-layer-trigger gap-[10px] text-[16px] leading-[24px] font-medium [&[data-state=closed]_.gis-ai-source-caret]:[transform:rotate(180deg)]" data-has-sources={layerIds.length > 0} aria-label={`Pilih sumber, ${layerIds.length} dipilih`}>
                  <IconFolders className="size-6" aria-hidden="true" /><span>{layerIds.length}</span><IconCaretUpFilled className="gis-ai-source-caret size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" alignOffset={-8} sideOffset={sourceMenuOffset} className="gis-ai-layer-menu flex flex-col gap-2 w-52 max-w-[calc(100vw_-_32px)] p-4 rounded-2xl">
                <DropdownMenuLabel className="gis-ai-source-title p-0 text-[16px] leading-[24px] font-normal">Sumber</DropdownMenuLabel>
                {assistantLayers.map((layer) => <DropdownMenuCheckboxItem className="gis-ai-source-item min-h-6 p-[0_24px_0_0] gap-4 rounded-sm text-[12px] leading-[16px] cursor-pointer [&[data-state=checked]]:text-[#000] [&[data-state=unchecked]]:text-[#a1a1a1] [&_>_span:first-child]:left-auto [&_>_span:first-child]:right-0 [&_>_span:first-child]:w-6 [&_>_span:first-child]:h-6 [&_>_span:first-child_svg]:w-6 [&_>_span:first-child_svg]:h-6" key={layer.id} checked={layerIds.includes(layer.id)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => setLayerIds((previous) => checked ? [...previous, layer.id] : previous.filter((id) => id !== layer.id))}><IconBoxMultiple className="size-6" aria-hidden="true" /><span>{layer.label}</span></DropdownMenuCheckboxItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="submit" size="icon" className="gis-ai-send" disabled={!question.trim()} aria-label="Kirim pertanyaan demo"><IconBrandTelegram className="size-6" aria-hidden="true" /></Button>
          </div>
        </form>
        <p className="gis-ai-demo-note shrink-0 m-0 text-[#737373] text-[10px] leading-[14px] text-center" id="gis-ai-demo-note">Contoh percakapan · Data dummy · Tanpa koneksi AI</p>
      </div>
    </div>
  );
}
