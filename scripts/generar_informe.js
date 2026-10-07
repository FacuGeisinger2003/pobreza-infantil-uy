// Genera docs/informe.pdf a partir de informe.html (versión de informe para A4).
// Uso: python3 -m http.server 8000   (en la raíz del repo)  y en otra terminal:
//      node scripts/generar_informe.js http://localhost:8000/
const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const base = (process.argv[2] || "http://localhost:8000/").replace(/\/?$/, "/");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, colorScheme: "light" });
  await page.goto(base + "informe.html", { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.listo === "1" && document.querySelector("#glosario-siglas div"), null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: "print" });
  const pie = (izq, der) => `<div style="font-family:Inter,sans-serif;font-size:7px;color:#767b84;width:100%;padding:0 18mm;display:flex;justify-content:space-between;">${izq}${der}</div>`;
  const fs = require("fs"), os = require("os"), { execFileSync } = require("child_process");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "informe-"));
  // portada sin encabezado ni pie
  await page.pdf({ path: path.join(tmp, "a.pdf"), preferCSSPageSize: true, printBackground: true, pageRanges: "1" });
  await page.pdf({
    path: path.join(tmp, "b.pdf"),
    pageRanges: "2-",
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: pie("<span>Uruguay en datos · Informe</span>", "<span>Facundo Geisinger</span>"),
    footerTemplate: pie("<span>datos-criticos-uy.vercel.app</span>", '<span><span class="pageNumber"></span> / <span class="totalPages"></span></span>'),
  });
  // unir (requiere pdfunite, de poppler-utils)
  execFileSync("pdfunite", [path.join(tmp, "a.pdf"), path.join(tmp, "b.pdf"), path.join(__dirname, "..", "docs", "informe.pdf")]);
  await browser.close();
  console.log("OK: docs/informe.pdf");
})();
