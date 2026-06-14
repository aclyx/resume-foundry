export type ResumeOutputFormat = "html" | "pdf" | "markdown";

export interface ResumeDocument {
  basics: ResumeBasics;
  sections?: ResumeSection[];
}

export interface ResumeBasics {
  name: string;
  label?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: string;
}

export interface ResumeSection {
  title: string;
  items: ResumeSectionItem[];
}

export interface ResumeSectionItem {
  heading: string;
  subheading?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

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
    ...formatMarkdownSections(resume.sections ?? []),
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
      ${formatHtmlSections(resume.sections ?? [])}
    </main>
  </body>
</html>`;
}

function formatMarkdownSections(sections: ResumeSection[]): string[] {
  return sections.map((section) => {
    const items = section.items.map(formatMarkdownItem).join("\n\n");
    return `## ${section.title}\n\n${items}`;
  });
}

function formatMarkdownItem(item: ResumeSectionItem): string {
  const lines = [
    `### ${item.heading}`,
    [item.subheading, formatDateRange(item)].filter(isPresent).join(" | "),
    item.summary,
    ...(item.highlights ?? []).map((highlight) => `- ${highlight}`),
  ];

  return lines.filter(isPresent).join("\n");
}

function formatHtmlSections(sections: ResumeSection[]): string {
  return sections
    .map((section) => {
      const items = section.items.map(formatHtmlItem).join("");

      return `<section>
        <h2>${escapeHtml(section.title)}</h2>
        ${items}
      </section>`;
    })
    .join("");
}

function formatHtmlItem(item: ResumeSectionItem): string {
  const meta = [item.subheading, formatDateRange(item)].filter(isPresent).join(" | ");
  const highlights = item.highlights?.length
    ? `<ul>${item.highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("")}</ul>`
    : "";

  return `<article>
        <h3>${escapeHtml(item.heading)}</h3>
        ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ""}
        ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
        ${highlights}
      </article>`;
}

function formatContactLine(basics: ResumeBasics): string | undefined {
  const parts = [basics.email, basics.phone, basics.url, basics.location].filter(isPresent);
  return parts.length > 0 ? parts.join(" | ") : undefined;
}

function formatDateRange(item: ResumeSectionItem): string | undefined {
  if (item.startDate && item.endDate) {
    return `${item.startDate} - ${item.endDate}`;
  }

  return item.startDate ?? item.endDate;
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
