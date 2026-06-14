import { describe, expect, it } from "vitest";

import {
  RESUME_DOCUMENT_SCHEMA_VERSION,
  renderHtml,
  renderMarkdown,
  renderResume,
  resumeDocumentJsonSchema,
  validateResumeDocument,
  type ResumeDocument,
} from "../src/index.js";

const sampleResume: ResumeDocument = {
  schemaVersion: RESUME_DOCUMENT_SCHEMA_VERSION,
  metadata: {
    title: "Example Resume",
    density: "standard",
    tags: ["software"],
  },
  basics: {
    name: "Example Person",
    label: "Software Engineer",
    email: "example@example.com",
    url: "https://example.com",
    summary: "Builds useful tools from structured data.",
  },
  sections: [
    {
      id: "experience",
      kind: "experience",
      title: "Experience",
      priority: 100,
      items: [
        {
          id: "example-company",
          title: "Example Company",
          subtitle: "Engineer",
          dateRange: {
            start: "2024",
            isCurrent: true,
          },
          highlights: [{ text: "Rendered Markdown" }, { text: "Rendered HTML" }],
        },
      ],
    },
  ],
  variants: {
    concise: {
      name: "Concise one-page",
      pageTarget: "one-page",
      density: "compact",
      sectionOrder: ["experience"],
    },
  },
};

describe("resume renderers", () => {
  it("renders Markdown output", () => {
    expect(renderMarkdown(sampleResume)).toContain("# Example Person");
    expect(renderResume(sampleResume, { format: "markdown" })).toContain("## Experience");
  });

  it("renders themed HTML output", () => {
    const html = renderHtml(sampleResume, {
      name: "test",
      accentColor: "#0f766e",
      fontFamily: "system-ui",
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("data-theme=\"test\"");
    expect(html).toContain("#0f766e");
  });

  it("points synchronous PDF rendering to the async pipeline", () => {
    expect(() => renderResume(sampleResume, { format: "pdf" })).toThrow(
      "PDF rendering is asynchronous. Use renderPdf or renderResumeAsync.",
    );
  });

  it("validates canonical resume documents", () => {
    expect(validateResumeDocument(sampleResume).success).toBe(true);
  });

  it("returns path-aware validation errors", () => {
    const result = validateResumeDocument({
      ...sampleResume,
      variants: {
        broken: {
          name: "Broken",
          pageTarget: "one-page",
          sectionOrder: ["missing-section"],
        },
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual({
        path: "$.variants.broken.sectionOrder[0]",
        code: "custom",
        message: 'Unknown section id "missing-section".',
      });
    }
  });

  it("exports a generated JSON Schema object", () => {
    expect(resumeDocumentJsonSchema).toMatchObject({
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "https://resume-foundry.dev/schemas/resume-document.schema.json",
      title: "Resume Foundry ResumeDocument",
    });
  });
});
