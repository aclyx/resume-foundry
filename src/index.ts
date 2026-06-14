export {
  ResumeMarkdownParseError,
  exportResumeMarkdown,
  normalizeResumeMarkdown,
  parseResumeMarkdown,
  parseResumeMarkdownResult,
  parseResumeMarkdownToJson,
} from "./markdown.js";

export type { ResumeMarkdownIssue, ResumeMarkdownParseResult } from "./markdown.js";

export {
  RESUME_DOCUMENT_SCHEMA_VERSION,
  ResumeBasicsSchema,
  ResumeDateRangeSchema,
  ResumeDocumentSchema,
  ResumeEntryOverrideSchema,
  ResumeEntrySchema,
  ResumeHighlightSchema,
  ResumeMetadataSchema,
  ResumeProfileSchema,
  ResumeSectionOverrideSchema,
  ResumeSectionSchema,
  ResumeSkillGroupSchema,
  ResumeSkillSchema,
  ResumeVariantSchema,
  formatResumeValidationErrors,
  parseResumeDocument,
  resumeDensityValues,
  resumeDocumentJsonSchema,
  resumePageTargetValues,
  resumeSectionKindValues,
  validateResumeDocument,
} from "./schema.js";

export type {
  ResumeBasics,
  ResumeDateRange,
  ResumeDensity,
  ResumeDocument,
  ResumeEntry,
  ResumeEntryOverride,
  ResumeHighlight,
  ResumeMetadata,
  ResumePageTarget,
  ResumeProfile,
  ResumeSection,
  ResumeSectionOverride,
  ResumeSkill,
  ResumeSkillGroup,
  ResumeValidationIssue,
  ResumeValidationResult,
  ResumeVariant,
} from "./schema.js";

import type { ResumeBasics, ResumeDateRange, ResumeDocument, ResumeSection } from "./schema.js";

export type ResumeOutputFormat = "html" | "pdf" | "markdown";

export interface ResumeTheme {
  name: string;
  accentColor?: string;
  fontFamily?: string;
}

export interface RenderOptions {
  format: ResumeOutputFormat;
  theme?: ResumeTheme;
}

export function renderResume(
  resume: ResumeDocument,
  options: RenderOptions,
): string {
  switch (options.format) {
    case "html":
      return renderHtml(resume, options.theme);
    case "markdown":
      return renderMarkdown(resume);
    case "pdf":
      throw new Error("PDF rendering is not implemented yet.");
  }
}

export function renderMarkdown(resume: ResumeDocument): string {
  const lines = [
    `# ${resume.basics.name}`,
    resume.basics.label,
    formatContactLine(resume.basics),
    resume.basics.summary,
    ...formatMarkdownSections(resume.sections),
  ];

  return lines.filter(isPresent).join("\n\n");
}

export function renderHtml(
  resume: ResumeDocument,
  theme: ResumeTheme = { name: "default" },
): string {
  const accentColor = theme.accentColor ?? "#2563eb";
  const fontFamily = theme.fontFamily ?? "Inter, system-ui, sans-serif";
  const contactLine = formatContactLine(resume.basics);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(resume.basics.name)}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        color: #111827;
        background: #ffffff;
        font-family: ${fontFamily};
        line-height: 1.5;
      }
      main {
        max-width: 760px;
        margin: 0 auto;
        padding: 48px 32px;
      }
      h1, h2, h3, p { margin: 0; }
      h1 { font-size: 2.25rem; line-height: 1.1; }
      h2 {
        margin-top: 2rem;
        border-bottom: 2px solid ${accentColor};
        padding-bottom: 0.25rem;
        font-size: 1rem;
        text-transform: uppercase;
      }
      h3 { margin-top: 1rem; font-size: 1.05rem; }
      .label, .contact, .meta { color: #4b5563; }
      ul { margin: 0.5rem 0 0; padding-left: 1.25rem; }
    </style>
  </head>
  <body>
    <main data-theme="${escapeHtml(theme.name)}">
      <header>
        <h1>${escapeHtml(resume.basics.name)}</h1>
        ${resume.basics.label ? `<p class="label">${escapeHtml(resume.basics.label)}</p>` : ""}
        ${contactLine ? `<p class="contact">${escapeHtml(contactLine)}</p>` : ""}
        ${resume.basics.summary ? `<p>${escapeHtml(resume.basics.summary)}</p>` : ""}
      </header>
      ${formatHtmlSections(resume.sections)}
    </main>
  </body>
</html>`;
}

function formatMarkdownSections(sections: ResumeSection[]): string[] {
  return sections.map((section) => {
    const items = getSectionItems(section).map(formatMarkdownItem).join("\n\n");
    return `## ${section.title}\n\n${items}`;
  });
}

function formatMarkdownItem(item: RenderableSectionItem): string {
  const lines = [
    `### ${item.title}`,
    [formatEntrySubtitle(item), formatDateRange(item.dateRange)].filter(isPresent).join(" | "),
    item.summary,
    ...(item.highlights ?? []).map((highlight) => `- ${highlight.text}`),
  ];

  return lines.filter(isPresent).join("\n");
}

function formatHtmlSections(sections: ResumeSection[]): string {
  return sections
    .map((section) => {
      const items = getSectionItems(section).map(formatHtmlItem).join("");

      return `<section>
        <h2>${escapeHtml(section.title)}</h2>
        ${items}
      </section>`;
    })
    .join("");
}

function formatHtmlItem(item: RenderableSectionItem): string {
  const meta = [formatEntrySubtitle(item), formatDateRange(item.dateRange)]
    .filter(isPresent)
    .join(" | ");
  const highlights = item.highlights?.length
    ? `<ul>${item.highlights.map((highlight) => `<li>${escapeHtml(highlight.text)}</li>`).join("")}</ul>`
    : "";

  return `<article>
        <h3>${escapeHtml(item.title)}</h3>
        ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ""}
        ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
        ${highlights}
      </article>`;
}

function formatContactLine(basics: ResumeBasics): string | undefined {
  const parts = [basics.email, basics.phone, basics.url, basics.location].filter(isPresent);
  return parts.length > 0 ? parts.join(" | ") : undefined;
}

function formatDateRange(dateRange: ResumeDateRange | undefined): string | undefined {
  if (!dateRange) {
    return undefined;
  }

  if (dateRange.label) {
    return dateRange.label;
  }

  if (dateRange.start && dateRange.isCurrent) {
    return `${dateRange.start} - Present`;
  }

  if (dateRange.start && dateRange.end) {
    return `${dateRange.start} - ${dateRange.end}`;
  }

  return dateRange.start ?? dateRange.end;
}

interface RenderableSectionItem {
  title: string;
  subtitle?: string;
  organization?: string;
  dateRange?: ResumeDateRange;
  summary?: string;
  highlights?: Array<{ text: string }>;
}

function getSectionItems(section: ResumeSection): RenderableSectionItem[] {
  if (section.kind === "skills") {
    return section.groups.map((group) => ({
      ...group,
      title: group.name,
      summary: group.skills.map((skill) => skill.name).join(", "),
    }));
  }

  return section.items;
}

function formatEntrySubtitle(item: RenderableSectionItem): string | undefined {
  return [item.subtitle, item.organization].filter(isPresent).join(" at ") || undefined;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isPresent(value: string | undefined): value is string {
  return Boolean(value);
}
