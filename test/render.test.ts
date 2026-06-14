import { describe, expect, it } from "vitest";

import { renderHtml, renderMarkdown, renderResume, type ResumeDocument } from "../src/index.js";

const sampleResume: ResumeDocument = {
  basics: {
    name: "Example Person",
    label: "Software Engineer",
    email: "example@example.com",
    summary: "Builds useful tools from structured data.",
  },
  sections: [
    {
      title: "Experience",
      items: [
        {
          heading: "Example Company",
          subheading: "Engineer",
          startDate: "2024",
          endDate: "Present",
          highlights: ["Rendered Markdown", "Rendered HTML"],
        },
      ],
    },
  ],
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

  it("reserves PDF rendering for a later pipeline", () => {
    expect(() => renderResume(sampleResume, { format: "pdf" })).toThrow(
      "PDF rendering is not implemented yet.",
    );
  });
});
