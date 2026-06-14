import { chromium, type Browser } from "playwright";

import { renderHtml, type HtmlRenderOptions } from "./html.js";
import type { ResumeDocument } from "./schema.js";

export interface PdfRenderOptions extends HtmlRenderOptions {
  browser?: Browser;
}

export async function renderPdf(
  resume: ResumeDocument,
  options: PdfRenderOptions = {},
): Promise<Uint8Array> {
  const html = renderHtml(resume, options);
  const ownsBrowser = !options.browser;
  const browser = options.browser ?? (await chromium.launch({ headless: true }));

  try {
    const page = await browser.newPage();

    try {
      await page.emulateMedia({ media: "print" });
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);

      const pdf = await page.pdf({
        preferCSSPageSize: true,
        printBackground: true,
      });

      return new Uint8Array(pdf);
    } finally {
      await page.close();
    }
  } finally {
    if (ownsBrowser) {
      await browser.close();
    }
  }
}
