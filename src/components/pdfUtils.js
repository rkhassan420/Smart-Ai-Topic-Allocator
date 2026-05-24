/* ══════════════════════════════════════════════════════
   PDF.js UTILITIES
══════════════════════════════════════════════════════ */
const PDFJS_VERSION = "5.7.284";
let _pdfjsLib = null;

export async function getPdfjsLib() {
  if (_pdfjsLib) return _pdfjsLib;
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
  _pdfjsLib = lib;
  return lib;
}

export async function readPDFText(file) {
  const { getDocument } = await getPdfjsLib();
  const buf = await file.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(buf) }).promise;
  let text = "";
  const max = Math.min(pdf.numPages, 40);
  for (let i = 1; i <= max; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((s) => s.str).join(" ") + "\n";
  }
  return text;
}
