"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function DemoAssistant() {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState("");
  return (
    <div className="gis-demo-assistant">
      <h2>Bejir AI</h2><p>Pratinjau antarmuka. Tidak terhubung ke AI, API, atau data banjir.</p>
      {submitted ? <div className="gis-demo-messages" aria-live="polite"><p><strong>Pertanyaan:</strong> {submitted}</p><p><strong>Jawaban demo:</strong> Informasi pada halaman ini adalah data dummy dari desain. Jawaban berbasis data akan tersedia setelah integrasi backend.</p></div> : null}
      <form onSubmit={(event) => { event.preventDefault(); if (question.trim()) { setSubmitted(question.trim()); setQuestion(""); } }}>
        <Label htmlFor="gis-question">Tanyakan tentang tampilan ini</Label><Textarea id="gis-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Tulis pertanyaan..." rows={4} maxLength={500} />
        <Button type="submit" disabled={!question.trim()} className="gis-demo-send">Kirim pertanyaan demo</Button>
      </form>
    </div>
  );
}
