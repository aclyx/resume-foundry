import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  parseResumeMarkdown,
  renderPdf,
  staffSoftwareEngineeringTheme,
} from "../src/index.js";

const fixtureRoot = join(import.meta.dirname, "..", "fixtures");

interface PdfInfo {
  links: string[];
  pageCount: number;
  pageSizes: Array<{
    height: number;
    width: number;
  }>;
  selectableText: string;
  text: string;
}

interface PdfAnnotation {
  unsafeUrl?: string;
  url?: string;
}

function readFixture(name: string): string {
  return readFileSync(join(fixtureRoot, name), "utf8");
}

describe("PDF export", () => {
  let browser: Browser | undefined;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser?.close();
  });

  it("exports a one-page Staff PDF with selectable text, bullets, links, and letter print sizing", async () => {
    const resume = parseResumeMarkdown(readFixture("one-page.resume.md"));
    const pdf = await renderPdf(resume, {
      browser,
      pageSize: "letter",
      theme: staffSoftwareEngineeringTheme,
      variant: "one-page",
    });
    const info = await readPdfInfo(pdf);

    expect(pdf.length).toBeGreaterThan(10_000);
    expect(info.pageCount).toBe(1);
    expect(info.pageSizes[0]).toEqual({ height: 792, width: 612 });
    expect(info.selectableText).toContain("One Page Person");
    expect(info.text).toContain("EXPERIENCE");
    expect(info.text).toContain("• Shipped a schema-first import path");
    expect(info.links).toContain("mailto:one@example.com");
    expect(info.links).toContain("https://one.example.com/");
  });

  it("exports a two-page Staff PDF whose extracted text includes headings and bullets", async () => {
    const resume = parseResumeMarkdown(readFixture("pdf-two-page.resume.md"));
    const pdf = await renderPdf(resume, {
      browser,
      pageSize: "letter",
      theme: staffSoftwareEngineeringTheme,
      variant: "two-page",
    });
    const info = await readPdfInfo(pdf);

    expect(info.pageCount).toBe(2);
    expect(info.pageSizes).toEqual([
      { height: 792, width: 612 },
      { height: 792, width: 612 },
    ]);
    expect(info.selectableText).toContain("PDF Fixture Person");
    expect(info.text).toContain("EXPERIENCE");
    expect(info.text).toContain("SKILLS");
    expect(info.text).toContain("• Defined technical strategy across product, platform, and data workflows.");
    expect(info.links).toContain("mailto:pdf@example.com");
    expect(info.links).toContain("https://pdf.example.com/");
  });
});

async function readPdfInfo(pdf: Uint8Array): Promise<PdfInfo> {
  const loadingTask = pdfjs.getDocument({
    data: pdf.slice(),
  });
  const document = await loadingTask.promise;
  const pageCount = document.numPages;
  const pageSizes: PdfInfo["pageSizes"] = [];
  const pageText: string[] = [];
  const links = new Set<string>();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const width = page.view[2];
    const height = page.view[3];
    const text = await page.getTextContent();
    const annotations = (await page.getAnnotations()) as PdfAnnotation[];

    if (width === undefined || height === undefined) {
      throw new Error(`PDF page ${pageNumber} is missing dimensions.`);
    }

    pageSizes.push({
      height,
      width,
    });
    pageText.push(
      text.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    );

    for (const annotation of annotations) {
      const link = annotation.url ?? annotation.unsafeUrl;

      if (link) {
        links.add(link);
      }
    }
  }

  await loadingTask.destroy();
  const pdftotext = extractWithPdftotext(pdf);

  return {
    links: [...links],
    pageCount,
    pageSizes,
    selectableText: pageText.join("\n"),
    text: pdftotext ?? pageText.join("\n"),
  };
}

function extractWithPdftotext(pdf: Uint8Array): string | undefined {
  const tempDirectory = mkdtempSync(join(tmpdir(), "resume-foundry-pdf-"));
  const pdfPath = join(tempDirectory, "resume.pdf");

  try {
    writeFileSync(pdfPath, pdf);

    const result = spawnSync("pdftotext", ["-layout", pdfPath, "-"], {
      encoding: "utf8",
    });

    if (result.error) {
      const error = result.error as NodeJS.ErrnoException;

      if (error.code === "ENOENT") {
        return undefined;
      }

      throw error;
    }

    if (result.status !== 0) {
      throw new Error(`pdftotext failed: ${result.stderr}`);
    }

    return normalizeExtractedText(result.stdout);
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
}

function normalizeExtractedText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
