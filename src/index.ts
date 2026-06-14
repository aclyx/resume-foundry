export {
  ResumeMarkdownParseError,
  exportResumeMarkdown,
  normalizeResumeMarkdown,
  parseResumeMarkdown,
  parseResumeMarkdownResult,
  parseResumeMarkdownToJson,
} from "./markdown.js";

export type { ResumeMarkdownIssue, ResumeMarkdownParseResult } from "./markdown.js";

export { renderHtml } from "./html.js";

export type { HtmlRenderOptions } from "./html.js";

export { renderPdf } from "./pdf.js";

export type { PdfRenderOptions } from "./pdf.js";

export {
  baselineResumeTheme,
  normalizeResumeTheme,
  resolveResumePageSize,
  resumePageSizeValues,
  resumePageSizes,
  staffSoftwareEngineeringTheme,
} from "./theme.js";

export type {
  LegacyResumeTheme,
  ResumeColorTokens,
  ResumeDensityTokens,
  ResumePageSize,
  ResumePageSizeName,
  ResumePresentationControls,
  ResumeRuleTokens,
  ResumeSpacingTokens,
  ResumeSurfaceTokens,
  ResumeTheme,
  ResumeThemeInput,
  ResumeThemeTokens,
  ResumeTypographyTokens,
} from "./theme.js";

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

import { renderHtml } from "./html.js";
import type { HtmlRenderOptions } from "./html.js";
import { renderPdf } from "./pdf.js";
import type { ResumeBasics, ResumeDateRange, ResumeDocument, ResumeSection } from "./schema.js";

export type ResumeOutputFormat = "html" | "pdf" | "markdown";

export interface RenderOptions extends HtmlRenderOptions {
  format: ResumeOutputFormat;
}

export function renderResume(
  resume: ResumeDocument,
  options: RenderOptions,
): string {
  switch (options.format) {
    case "html":
      return renderHtml(resume, toHtmlRenderOptions(options));
    case "markdown":
      return renderMarkdown(resume);
    case "pdf":
      throw new Error("PDF rendering is asynchronous. Use renderPdf or renderResumeAsync.");
  }
}

export async function renderResumeAsync(
  resume: ResumeDocument,
  options: RenderOptions,
): Promise<string | Uint8Array> {
  switch (options.format) {
    case "html":
      return renderHtml(resume, toHtmlRenderOptions(options));
    case "markdown":
      return renderMarkdown(resume);
    case "pdf":
      return renderPdf(resume, toHtmlRenderOptions(options));
  }
}

function toHtmlRenderOptions(options: RenderOptions): HtmlRenderOptions {
  return {
    density: options.density,
    pageSize: options.pageSize,
    pageTarget: options.pageTarget,
    theme: options.theme,
    title: options.title,
    variant: options.variant,
  };
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

function isPresent(value: string | undefined): value is string {
  return Boolean(value);
}
