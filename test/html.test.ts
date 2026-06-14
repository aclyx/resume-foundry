import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  baselineResumeTheme,
  parseResumeMarkdown,
  renderHtml,
  renderResume,
} from "../src/index.js";

const fixtureRoot = join(import.meta.dirname, "..", "fixtures");

function readFixture(name: string): string {
  return readFileSync(join(fixtureRoot, name), "utf8");
}

describe("HTML presentation themes", () => {
  it("renders a one-page baseline theme with print-first CSS and semantic HTML", () => {
    const resume = parseResumeMarkdown(readFixture("one-page.resume.md"));
    const html = renderHtml(resume, {
      theme: baselineResumeTheme,
      variant: "one-page",
      pageSize: "letter",
    });

    expect(html).toContain('<main class="resume"');
    expect(html).toContain('data-density="compact"');
    expect(html).toContain('data-page-size="letter"');
    expect(html).toContain('data-page-target="one-page"');
    expect(html).toContain("@page");
    expect(html).toContain("size: 8.5in 11in");
    expect(html).toContain('<address class="resume-contact" aria-label="Contact">');
    expect(html).toContain('href="mailto:one@example.com"');
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<canvas");
    expect(html).not.toContain("Archive Tools");
    expect(html).toMatchSnapshot();
  });

  it("renders a two-page baseline theme with selectable text links", () => {
    const resume = parseResumeMarkdown(readFixture("two-page.resume.md"));
    const html = renderResume(resume, {
      format: "html",
      theme: baselineResumeTheme,
      variant: "two-page",
      pageSize: "a4",
    });

    expect(html).toContain('data-density="standard"');
    expect(html).toContain('data-page-size="a4"');
    expect(html).toContain('data-page-target="two-page"');
    expect(html).toContain("size: 210mm 297mm");
    expect(html).toContain('<a class="resume-entry-link" href="https://github.com/aclyx/resume-foundry"');
    expect(html).toContain("<section");
    expect(html).toContain("<article");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<canvas");
    expect(html).toMatchSnapshot();
  });

  it("rejects unknown HTML variants", () => {
    const resume = parseResumeMarkdown(readFixture("one-page.resume.md"));

    expect(() => renderHtml(resume, { variant: "missing" })).toThrow(
      "Unknown resume variant: missing",
    );
  });

  it("uses the baseline theme when no HTML options are provided", () => {
    const resume = parseResumeMarkdown(readFixture("one-page.resume.md"));

    expect(renderHtml(resume)).toContain('data-theme="baseline"');
    expect(renderResume(resume, { format: "html" })).toContain('data-theme="baseline"');
  });
});
