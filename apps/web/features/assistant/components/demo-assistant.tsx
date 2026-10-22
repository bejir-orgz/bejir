"use client";

import { useEffect, useRef, useState } from "react";
import { IconBoxMultiple, IconBrandTelegram, IconCaretUpFilled, IconFolders } from "@tabler/icons-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assistantLayers, defaultAssistantLayerIds, demoPrompt, demoReport, type AssistantLayerId, type DemoExchange } from "../data/demo-conversation";
import "./assistant.css";

function DemoReport({ report }: { report: typeof demoReport }) {
  return (
    <article className="gis-ai-report" aria-label="Contoh jawaban AI dengan data dummy">
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
    <div className="gis-ai-assistant">
      <div className="gis-ai-conversation" tabIndex={0} role="region" aria-label="Percakapan Aji, contoh data dummy">
        <p className="gis-ai-question">{demoPrompt}</p>
        <DemoReport report={demoReport} />
        <div className="gis-ai-exchanges" aria-live="polite" aria-relevant="additions">
          {exchanges.map((exchange, index) => (
            <div className="gis-ai-exchange" key={exchange.id} ref={index === exchanges.length - 1 ? latestExchange : undefined}>
              <p className="gis-ai-question">{exchange.question}</p>
              <p className="gis-ai-demo-reply">Jawaban demo — {exchange.layerIds.length ? `konteks: ${assistantLayers.filter((layer) => exchange.layerIds.includes(layer.id)).map((layer) => layer.label).join(", ")}.` : "tanpa layer dipilih."} Percakapan ini belum terhubung ke AI atau data aktual. Rangkuman di atas adalah contoh dari desain, bukan hasil analisis pertanyaan ini.</p>
            </div>
          ))}
        </div>
      </div>
      <form ref={composer} className="gis-ai-composer" onSubmit={(event) => { event.preventDefault(); submitQuestion(); }}>
        <Label className="sr-only" htmlFor="gis-question">Tanya Aji</Label>
        <Textarea id="gis-question" className="focus-visible:ring-0" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Tanya Aji" rows={1} maxLength={1000} aria-describedby="gis-ai-demo-note" onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submitQuestion(); }
        }} />
        <div className="gis-ai-composer-actions">
          <DropdownMenu onOpenChange={(open) => {
            if (open && composer.current && sourceTrigger.current) {
              // Keep the menu above the whole composer, including multiline drafts.
              setSourceMenuOffset(sourceTrigger.current.getBoundingClientRect().top - composer.current.getBoundingClientRect().top + 8);
            }
          }}>
            <DropdownMenuTrigger asChild>
              <Button ref={sourceTrigger} type="button" variant="secondary" className="gis-ai-layer-trigger" data-has-sources={layerIds.length > 0} aria-label={`Pilih sumber, ${layerIds.length} dipilih`}>
                <IconFolders className="size-6" aria-hidden="true" /><span>{layerIds.length}</span><IconCaretUpFilled className="gis-ai-source-caret size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" alignOffset={-8} sideOffset={sourceMenuOffset} className="gis-ai-layer-menu">
              <DropdownMenuLabel className="gis-ai-source-title">Sumber</DropdownMenuLabel>
              {assistantLayers.map((layer) => <DropdownMenuCheckboxItem className="gis-ai-source-item" key={layer.id} checked={layerIds.includes(layer.id)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => setLayerIds((previous) => checked ? [...previous, layer.id] : previous.filter((id) => id !== layer.id))}><IconBoxMultiple className="size-6" aria-hidden="true" /><span>{layer.label}</span></DropdownMenuCheckboxItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="submit" variant="secondary" size="icon" className="gis-ai-send" disabled={!question.trim()} aria-label="Kirim pertanyaan demo"><IconBrandTelegram className="size-6" aria-hidden="true" /></Button>
        </div>
      </form>
      <p className="gis-ai-demo-note" id="gis-ai-demo-note">Contoh percakapan · Data dummy · Tanpa koneksi AI</p>
    </div>
  );
}
