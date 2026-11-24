import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const componentUrl = new URL("./assistant-markdown.tsx", import.meta.url).href;
registerHooks({ load(url, context, nextLoad) {
  if (url !== componentUrl) return nextLoad(url, context);
  return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText };
} });
const { AssistantMarkdown } = await import("./assistant-markdown.tsx");
const render = (text) => renderToStaticMarkup(createElement(AssistantMarkdown, { text }));

test("AI Markdown renders headings, emphasis, lists, tables, links and code", () => {
  const html = render("## Ringkasan\n\n**Banjir** dan *hujan*.\n\n- Bogor\n- Depok\n\n1. Periksa data\n2. Pilih daerah\n\n| Daerah | Jumlah |\n| --- | ---: |\n| Bogor | 3 |\n\n[Dokumentasi](https://example.com)\n\n```js\nconst total = 3;\n```\n\nGunakan `total`.");
  for (const tag of ["h2", "strong", "em", "ul", "ol", "table", "th", "td", "pre", "code"]) assert.match(html, new RegExp(`<${tag}[ >]`));
  assert.match(html, /href="https:\/\/example.com"/);
  assert.doesNotMatch(html, /\*\*Banjir\*\*/);
});

test("AI Markdown blocks raw HTML, executable links and remote images", () => {
  const html = render('<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n[Klik](javascript:alert%281%29)\n\n![Peta](https://example.com/tracker.png)');
  assert.doesNotMatch(html, /<script|<img|onerror|javascript:/i);
  assert.match(html, /Peta/);
  assert.match(render("Jawaban biasa."), /<p>Jawaban biasa\.<\/p>/);
});
