import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  exportResumeMarkdown,
  normalizeResumeMarkdown,
  parseResumeMarkdownResult,
  parseResumeMarkdownToJson,
} from "../src/index.js";

const fixtureRoot = join(import.meta.dirname, "..", "fixtures");

function readFixture(name: string): string {
  return readFileSync(join(fixtureRoot, name), "utf8");
}

describe("Markdown/frontmatter parser", () => {
  it("parses a one-page Markdown resume into validated JSON", () => {
    const result = parseResumeMarkdownResult(readFixture("one-page.resume.md"));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.basics.name).toBe("One Page Person");
    expect(result.data.variants?.["one-page"]?.pageTarget).toBe("one-page");
    expect(result.data.sections).toHaveLength(2);
    expect(result.data.sections[0]).toMatchObject({
      id: "experience",
      kind: "experience",
    });
    expect(result.data.sections[0]).toHaveProperty(
      "items",
      expect.arrayContaining([
        expect.objectContaining({
          id: "compact-systems-lead",
          dateRange: {
            start: "2023",
            isCurrent: true,
          },
        }),
        expect.objectContaining({ id: "archive-tools-engineer" }),
      ]),
    );
    expect(result.json).toContain("\"schemaVersion\": \"resume-foundry/v1\"");
  });

  it("parses a two-page Markdown resume with inferred skills groups", () => {
    const result = parseResumeMarkdownResult(readFixture("two-page.resume.md"));

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.variants?.["two-page"]?.pageTarget).toBe("two-page");
    expect(result.data.sections.map((section) => section.kind)).toEqual([
      "experience",
      "projects",
      "education",
      "skills",
    ]);

    const projects = result.data.sections.find((section) => section.kind === "projects");

    expect(projects).toMatchObject({
      items: [
        { id: "resume-foundry-parser" },
        {
          id: "projects-parser-notes",
          title: "Parser Notes",
          highlights: [
            {
              text: "Shows that structured YAML blocks are optional for ordinary section items.",
            },
          ],
        },
      ],
    });

    const skills = result.data.sections.find((section) => section.kind === "skills");

    expect(skills).toMatchObject({
      groups: [
        {
          id: "skills-languages",
          name: "Languages",
          skills: [{ name: "TypeScript" }, { name: "Python" }, { name: "SQL" }],
        },
        {
          id: "skills-platforms",
          name: "Platforms",
          skills: [{ name: "Node.js" }, { name: "Postgres" }, { name: "GitHub Actions" }],
        },
      ],
    });
  });

  it("exports normalized Markdown that parses back to the same document", () => {
    const result = parseResumeMarkdownResult(readFixture("two-page.resume.md"));
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const normalized = exportResumeMarkdown(result.data);
    const reparsed = parseResumeMarkdownResult(normalized);

    expect(normalized).toContain("---\nschemaVersion: resume-foundry/v1");
    expect(normalized).toContain("```resume-foundry");
    expect(reparsed.success).toBe(true);
    if (reparsed.success) {
      expect(reparsed.data).toEqual(result.data);
    }
  });

  it("normalizes Markdown directly from source input", () => {
    const normalized = normalizeResumeMarkdown(readFixture("one-page.resume.md"));
    const json = parseResumeMarkdownToJson(normalized);

    expect(normalized).toContain("## Experience");
    expect(json).toContain("\"name\": \"One Page Person\"");
  });

  it("returns helpful validation errors for invalid normalized documents", () => {
    const brokenMarkdown = readFixture("one-page.resume.md").replace(
      "      - skills",
      "      - missing-section",
    );
    const result = parseResumeMarkdownResult(brokenMarkdown);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual({
        path: "$.variants.one-page.sectionOrder[1]",
        code: "custom",
        message: 'Unknown section id "missing-section".',
      });
      expect(result.summary).toContain("$.variants.one-page.sectionOrder[1]");
    }
  });
});
