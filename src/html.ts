import type {
  ResumeBasics,
  ResumeDateRange,
  ResumeDensity,
  ResumeDocument,
  ResumeEntry,
  ResumeEntryOverride,
  ResumePageTarget,
  ResumeSection,
  ResumeSectionOverride,
  ResumeSkillGroup,
  ResumeVariant,
} from "./schema.js";
import {
  normalizeResumeTheme,
  resolveResumePageSize,
  type ResumePageSize,
  type ResumePresentationControls,
  type ResumeTheme,
  type ResumeThemeInput,
} from "./theme.js";

export interface HtmlRenderOptions extends ResumePresentationControls {
  theme?: ResumeThemeInput;
  variant?: string;
  title?: string;
}

interface ResolvedHtmlOptions {
  theme: ResumeTheme;
  density: ResumeDensity;
  pageSize: ResumePageSize;
  pageTarget: ResumePageTarget;
  variant?: ResumeVariant;
  title?: string;
}

export function renderHtml(
  resume: ResumeDocument,
  optionsOrTheme: HtmlRenderOptions | ResumeThemeInput = {},
): string {
  const options = normalizeHtmlRenderOptions(optionsOrTheme);
  const resolvedOptions = resolveHtmlOptions(resume, options);
  const sections = resolveVariantSections(resume.sections, resolvedOptions.variant);
  const title = resolvedOptions.title ?? resume.metadata?.title ?? `${resume.basics.name} Resume`;
  const locale = resume.metadata?.locale ?? "en";

  return stripTrailingWhitespace(`<!doctype html>
<html lang="${escapeAttribute(locale)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
${renderThemeCss(resolvedOptions)}
    </style>
  </head>
  <body>
    <main class="resume" aria-label="${escapeAttribute(`${resume.basics.name} resume`)}" data-theme="${escapeAttribute(resolvedOptions.theme.name)}" data-density="${resolvedOptions.density}" data-page-size="${escapeAttribute(resolvedOptions.pageSize.name)}" data-page-target="${resolvedOptions.pageTarget}">
      ${renderHeader(resume.basics)}
      ${renderSections(sections)}
    </main>
  </body>
</html>`);
}

function normalizeHtmlRenderOptions(
  optionsOrTheme: HtmlRenderOptions | ResumeThemeInput,
): HtmlRenderOptions {
  if (Object.keys(optionsOrTheme).length === 0) {
    return {};
  }

  if (
    "theme" in optionsOrTheme ||
    "variant" in optionsOrTheme ||
    "pageSize" in optionsOrTheme ||
    "density" in optionsOrTheme ||
    "pageTarget" in optionsOrTheme ||
    "title" in optionsOrTheme
  ) {
    return optionsOrTheme as HtmlRenderOptions;
  }

  return {
    theme: optionsOrTheme as ResumeThemeInput,
  };
}

function resolveHtmlOptions(resume: ResumeDocument, options: HtmlRenderOptions): ResolvedHtmlOptions {
  const variant = options.variant ? resume.variants?.[options.variant] : undefined;

  if (options.variant && !variant) {
    throw new Error(`Unknown resume variant: ${options.variant}`);
  }

  const density = options.density ?? variant?.density ?? resume.metadata?.density ?? "standard";

  return {
    theme: normalizeResumeTheme(options.theme),
    density,
    pageSize: resolveResumePageSize(options.pageSize),
    pageTarget: options.pageTarget ?? variant?.pageTarget ?? "custom",
    variant,
    title: options.title,
  };
}

function resolveVariantSections(sections: ResumeSection[], variant: ResumeVariant | undefined): ResumeSection[] {
  if (!variant) {
    return sections;
  }

  const includeSections = new Set(variant.includeSections ?? sections.map((section) => section.id));
  const excludeSections = new Set(variant.excludeSections ?? []);
  const resolvedSections = sections
    .filter((section) => includeSections.has(section.id) && !excludeSections.has(section.id))
    .map((section) =>
      applySectionOverride(section, variant.sectionOverrides?.[section.id], variant.entryOverrides),
    )
    .filter((section): section is ResumeSection => Boolean(section));

  if (!variant.sectionOrder?.length) {
    return resolvedSections;
  }

  const sectionPositions = new Map(
    variant.sectionOrder.map((sectionId, index) => [sectionId, index] as const),
  );

  return [...resolvedSections].sort((left, right) => {
    const leftPosition = sectionPositions.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightPosition = sectionPositions.get(right.id) ?? Number.MAX_SAFE_INTEGER;

    return leftPosition - rightPosition;
  });
}

function applySectionOverride(
  section: ResumeSection,
  override: ResumeSectionOverride | undefined,
  entryOverrides: Record<string, ResumeEntryOverride> | undefined,
): ResumeSection | undefined {
  if (override?.hidden) {
    return undefined;
  }

  const sectionFields = omitUndefined({
    title: override?.title ?? section.title,
    priority: override?.priority ?? section.priority,
    density: override?.density ?? section.density,
  });

  if (section.kind === "skills") {
    const groups = filterItems(section.groups, override)
      .map((group) => applySkillGroupOverride(group, entryOverrides?.[group.id]))
      .filter((group): group is ResumeSkillGroup => Boolean(group));

    return {
      ...section,
      ...sectionFields,
      groups,
    };
  }

  const items = filterItems(section.items, override)
    .map((item) => applyEntryOverride(item, entryOverrides?.[item.id]))
    .filter((item): item is ResumeEntry => Boolean(item));

  return {
    ...section,
    ...sectionFields,
    items,
  };
}

function filterItems<T extends { id: string }>(
  items: T[],
  override: ResumeSectionOverride | undefined,
): T[] {
  const includeItems = override?.includeItems ? new Set(override.includeItems) : undefined;
  const excludeItems = new Set(override?.excludeItems ?? []);
  const filtered = items.filter(
    (item) => (!includeItems || includeItems.has(item.id)) && !excludeItems.has(item.id),
  );

  return override?.maxItems === undefined ? filtered : filtered.slice(0, override.maxItems);
}

function applyEntryOverride(
  item: ResumeEntry,
  override: ResumeEntryOverride | undefined,
): ResumeEntry | undefined {
  if (override?.hidden) {
    return undefined;
  }

  return omitUndefined({
    ...item,
    priority: override?.priority ?? item.priority,
    density: override?.density ?? item.density,
    summary: override?.summary ?? item.summary,
    highlights: override?.highlights ?? item.highlights,
    tags: override?.tags ?? item.tags,
  });
}

function applySkillGroupOverride(
  group: ResumeSkillGroup,
  override: ResumeEntryOverride | undefined,
): ResumeSkillGroup | undefined {
  if (override?.hidden) {
    return undefined;
  }

  return omitUndefined({
    ...group,
    priority: override?.priority ?? group.priority,
    density: override?.density ?? group.density,
    tags: override?.tags ?? group.tags,
  });
}

function renderHeader(basics: ResumeBasics): string {
  const contactItems = renderContactItems(basics);

  return `<header class="resume-header">
        <h1>${escapeHtml(basics.name)}</h1>
        ${basics.label ? `<p class="resume-label">${escapeHtml(basics.label)}</p>` : ""}
        ${contactItems.length > 0 ? `<address class="resume-contact" aria-label="Contact">${joinInlineItems(contactItems)}</address>` : ""}
        ${basics.summary ? `<p class="resume-summary">${escapeHtml(basics.summary)}</p>` : ""}
      </header>`;
}

function renderContactItems(basics: ResumeBasics): string[] {
  const items = [
    basics.email
      ? `<a href="mailto:${escapeAttribute(basics.email)}">${escapeHtml(basics.email)}</a>`
      : undefined,
    basics.phone
      ? `<a href="tel:${escapeAttribute(formatPhoneHref(basics.phone))}">${escapeHtml(basics.phone)}</a>`
      : undefined,
    basics.url
      ? `<a href="${escapeAttribute(basics.url)}">${escapeHtml(formatUrlLabel(basics.url))}</a>`
      : undefined,
    basics.location ? `<span>${escapeHtml(basics.location)}</span>` : undefined,
    ...(basics.profiles ?? []).map((profile) => {
      const label = profile.username ? `${profile.network} ${profile.username}` : profile.network;

      return profile.url
        ? `<a href="${escapeAttribute(profile.url)}" aria-label="${escapeAttribute(label)}">${escapeHtml(label)}</a>`
        : `<span>${escapeHtml(label)}</span>`;
    }),
  ];

  return items.filter(isPresent);
}

function renderSections(sections: ResumeSection[]): string {
  return sections.map(renderSection).join("\n      ");
}

function renderSection(section: ResumeSection): string {
  const headingId = `${section.id}-heading`;

  if (section.kind === "skills") {
    return `<section id="${escapeAttribute(section.id)}" class="resume-section resume-section--skills" aria-labelledby="${escapeAttribute(headingId)}" data-section-kind="${section.kind}"${section.density ? ` data-density="${section.density}"` : ""}>
        <h2 id="${escapeAttribute(headingId)}">${escapeHtml(section.title)}</h2>
        ${section.summary ? `<p class="resume-section-summary">${escapeHtml(section.summary)}</p>` : ""}
        ${section.groups.map(renderSkillGroup).join("\n        ")}
      </section>`;
  }

  return `<section id="${escapeAttribute(section.id)}" class="resume-section resume-section--${escapeAttribute(section.kind)}" aria-labelledby="${escapeAttribute(headingId)}" data-section-kind="${section.kind}"${section.density ? ` data-density="${section.density}"` : ""}>
        <h2 id="${escapeAttribute(headingId)}">${escapeHtml(section.title)}</h2>
        ${section.summary ? `<p class="resume-section-summary">${escapeHtml(section.summary)}</p>` : ""}
        ${section.items.map(renderEntry).join("\n        ")}
      </section>`;
}

function renderEntry(entry: ResumeEntry): string {
  const meta = renderEntryMeta(entry);
  const entryHeaderClass = entry.url
    ? "resume-entry-header resume-entry-header--with-link"
    : "resume-entry-header";

  return `<article id="${escapeAttribute(entry.id)}" class="resume-entry"${entry.density ? ` data-density="${entry.density}"` : ""}>
          <header class="${entryHeaderClass}">
            <div>
              <h3>${escapeHtml(entry.title)}</h3>
              ${meta ? `<p class="resume-entry-meta">${meta}</p>` : ""}
            </div>
            ${entry.url ? `<a class="resume-entry-link" href="${escapeAttribute(entry.url)}" aria-label="${escapeAttribute(`${entry.title} link`)}">${escapeHtml(formatUrlLabel(entry.url))}</a>` : ""}
          </header>
          ${entry.summary ? `<p>${escapeHtml(entry.summary)}</p>` : ""}
          ${entry.highlights?.length ? `<ul class="resume-highlights">${entry.highlights.map((highlight) => `<li><span class="resume-bullet" aria-hidden="true">•</span><span>${escapeHtml(highlight.text)}</span></li>`).join("")}</ul>` : ""}
        </article>`;
}

function renderSkillGroup(group: ResumeSkillGroup): string {
  return `<article id="${escapeAttribute(group.id)}" class="resume-entry resume-skill-group"${group.density ? ` data-density="${group.density}"` : ""}>
          <h3>${escapeHtml(group.name)}</h3>
          <ul class="resume-skills-list" aria-label="${escapeAttribute(`${group.name} skills`)}">
            ${group.skills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("")}
          </ul>
        </article>`;
}

function renderEntryMeta(entry: ResumeEntry): string | undefined {
  const subtitle = [entry.subtitle, entry.organization].filter(isPresent).join(" at ") || undefined;
  const items = [
    subtitle ? escapeHtml(subtitle) : undefined,
    entry.location ? escapeHtml(entry.location) : undefined,
    renderDateRange(entry.dateRange),
  ].filter(isPresent);

  return items.length > 0 ? joinInlineItems(items.map((item) => `<span>${item}</span>`)) : undefined;
}

function renderDateRange(dateRange: ResumeDateRange | undefined): string | undefined {
  if (!dateRange) {
    return undefined;
  }

  if (dateRange.label) {
    return escapeHtml(dateRange.label);
  }

  if (dateRange.start && dateRange.isCurrent) {
    return `<time datetime="${escapeAttribute(dateRange.start)}">${escapeHtml(dateRange.start)}</time><span aria-hidden="true"> - </span><span>Present</span>`;
  }

  if (dateRange.start && dateRange.end) {
    return `<time datetime="${escapeAttribute(dateRange.start)}">${escapeHtml(dateRange.start)}</time><span aria-hidden="true"> - </span><time datetime="${escapeAttribute(dateRange.end)}">${escapeHtml(dateRange.end)}</time>`;
  }

  const value = dateRange.start ?? dateRange.end;
  return value ? `<time datetime="${escapeAttribute(value)}">${escapeHtml(value)}</time>` : undefined;
}

function joinInlineItems(items: string[]): string {
  return items.join('<span class="resume-separator" aria-hidden="true"> | </span>');
}

function renderThemeCss({ theme, density, pageSize, pageTarget }: ResolvedHtmlOptions): string {
  const { tokens } = theme;
  const densityTokens = tokens.density[density];

  return `      :root {
        color-scheme: light;
        --rf-page-width: ${pageSize.width};
        --rf-page-height: ${pageSize.height};
        --rf-page-margin: ${pageSize.margin};
        --rf-font-family: ${tokens.typography.fontFamily};
        --rf-font-size: ${tokens.typography.baseSize};
        --rf-small-size: ${tokens.typography.smallSize};
        --rf-h1-size: ${tokens.typography.h1Size};
        --rf-h2-size: ${tokens.typography.h2Size};
        --rf-h3-size: ${tokens.typography.h3Size};
        --rf-line-height: ${tokens.typography.lineHeight};
        --rf-heading-line-height: ${tokens.typography.headingLineHeight};
        --rf-regular-weight: ${tokens.typography.regularWeight};
        --rf-medium-weight: ${tokens.typography.mediumWeight};
        --rf-bold-weight: ${tokens.typography.boldWeight};
        --rf-letter-spacing: ${tokens.typography.letterSpacing};
        --rf-color-background: ${tokens.color.background};
        --rf-color-text: ${tokens.color.text};
        --rf-color-muted: ${tokens.color.muted};
        --rf-color-subtle: ${tokens.color.subtle};
        --rf-color-accent: ${tokens.color.accent};
        --rf-color-link: ${tokens.color.link};
        --rf-color-rule: ${tokens.color.rule};
        --rf-header-gap: ${tokens.spacing.headerGap};
        --rf-contact-gap: ${tokens.spacing.contactGap};
        --rf-section-title-gap: ${tokens.spacing.sectionTitleGap};
        --rf-list-indent: ${tokens.spacing.listIndent};
        --rf-section-gap: ${densityTokens.sectionGap};
        --rf-item-gap: ${densityTokens.itemGap};
        --rf-list-gap: ${densityTokens.listGap};
        --rf-paragraph-gap: ${densityTokens.paragraphGap};
        --rf-density-font-scale: ${densityTokens.fontScale};
        --rf-section-rule-width: ${tokens.rules.sectionWidth};
        --rf-section-rule-style: ${tokens.rules.sectionStyle};
        --rf-item-rule-width: ${tokens.rules.itemWidth};
        --rf-item-rule-style: ${tokens.rules.itemStyle};
        --rf-rule-radius: ${tokens.rules.radius};
        --rf-screen-background: ${tokens.surface.screenBackground};
        --rf-screen-padding: ${tokens.surface.screenPadding};
        --rf-screen-shadow: ${tokens.surface.screenShadow};
      }

      @page {
        size: ${pageSize.width} ${pageSize.height};
        margin: ${pageSize.margin};
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
        background: var(--rf-color-background);
      }

      body {
        color: var(--rf-color-text);
        font-family: var(--rf-font-family);
        font-size: calc(var(--rf-font-size) * var(--rf-density-font-scale));
        font-weight: var(--rf-regular-weight);
        line-height: var(--rf-line-height);
      }

      .resume {
        width: 100%;
        max-width: var(--rf-page-width);
        margin: 0 auto;
        padding: var(--rf-page-margin);
        background: var(--rf-color-background);
      }

      .resume[data-page-target="${pageTarget}"] {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1,
      h2,
      h3 {
        color: var(--rf-color-text);
        font-weight: var(--rf-bold-weight);
        letter-spacing: var(--rf-letter-spacing);
        line-height: var(--rf-heading-line-height);
      }

      h1 {
        font-size: var(--rf-h1-size);
      }

      h2 {
        border-bottom: var(--rf-section-rule-width) var(--rf-section-rule-style) var(--rf-color-accent);
        color: var(--rf-color-accent);
        font-size: var(--rf-h2-size);
        padding-bottom: var(--rf-section-title-gap);
        text-transform: uppercase;
      }

      h3 {
        font-size: var(--rf-h3-size);
      }

      a {
        color: var(--rf-color-link);
        text-decoration: underline;
        text-underline-offset: 0.08em;
      }

      address {
        font-style: normal;
      }

      ul {
        margin: var(--rf-paragraph-gap) 0 0;
        padding-left: var(--rf-list-indent);
      }

      li + li {
        margin-top: var(--rf-list-gap);
      }

      .resume-highlights {
        list-style: none;
        padding-left: 0;
      }

      .resume-highlights li {
        display: grid;
        gap: 0.055in;
        grid-template-columns: auto 1fr;
      }

      .resume-header {
        display: grid;
        gap: var(--rf-contact-gap);
        margin-bottom: var(--rf-header-gap);
      }

      .resume-label,
      .resume-contact,
      .resume-entry-meta,
      .resume-entry-link {
        color: var(--rf-color-muted);
      }

      .resume-summary,
      .resume-section-summary,
      .resume-entry p {
        margin-top: var(--rf-paragraph-gap);
      }

      .resume-section {
        break-inside: avoid-page;
        margin-top: var(--rf-section-gap);
      }

      .resume-section > h2 + * {
        margin-top: var(--rf-item-gap);
      }

      .resume-entry {
        break-inside: avoid-page;
        border-top: var(--rf-item-rule-width) var(--rf-item-rule-style) var(--rf-color-rule);
      }

      .resume-entry + .resume-entry {
        margin-top: var(--rf-item-gap);
      }

      .resume-entry-header {
        align-items: baseline;
        display: flex;
        gap: var(--rf-contact-gap);
        justify-content: space-between;
      }

      .resume-entry-meta,
      .resume-entry-link,
      .resume-contact {
        font-size: var(--rf-small-size);
      }

      .resume-skills-list {
        columns: 2;
        list-style-position: outside;
      }

${theme.name === "staff-software-engineering" ? renderStaffThemeCss() : ""}

      @media screen {
        body {
          background: var(--rf-screen-background);
          padding: var(--rf-screen-padding);
        }

        .resume {
          box-shadow: var(--rf-screen-shadow);
        }
      }

      @media print {
        html,
        body {
          background: var(--rf-color-background);
        }

        body {
          padding: 0;
        }

        .resume {
          max-width: none;
          padding: 0;
        }
      }`;
}

function renderStaffThemeCss(): string {
  return `      .resume[data-theme="staff-software-engineering"] {
        border-top: 1.5pt solid var(--rf-color-text);
      }

      .resume[data-theme="staff-software-engineering"] .resume-header {
        align-items: start;
        border-bottom: 0.7pt solid var(--rf-color-rule);
        column-gap: 0.28in;
        grid-template-columns: minmax(0, 1fr) auto;
        margin-bottom: 0;
        padding-bottom: 0.11in;
        row-gap: 0.025in;
      }

      .resume[data-theme="staff-software-engineering"] .resume-header h1 {
        grid-column: 1;
      }

      .resume[data-theme="staff-software-engineering"] .resume-label {
        color: var(--rf-color-text);
        font-size: 10.2pt;
        font-weight: var(--rf-medium-weight);
        grid-column: 1;
      }

      .resume[data-theme="staff-software-engineering"] .resume-contact {
        display: grid;
        gap: 0.018in;
        grid-column: 2;
        grid-row: 1 / span 2;
        justify-items: end;
        line-height: 1.22;
        text-align: right;
      }

      .resume[data-theme="staff-software-engineering"] .resume-contact .resume-separator {
        display: none;
      }

      .resume[data-theme="staff-software-engineering"] .resume-summary {
        color: var(--rf-color-text);
        font-weight: var(--rf-medium-weight);
        grid-column: 1 / -1;
        max-width: 6.55in;
      }

      .resume[data-theme="staff-software-engineering"] h2 {
        align-items: center;
        border-bottom: 0;
        display: grid;
        gap: 0.09in;
        grid-template-columns: auto 1fr;
        padding-bottom: 0;
      }

      .resume[data-theme="staff-software-engineering"] h2::after {
        border-top: var(--rf-section-rule-width) var(--rf-section-rule-style) var(--rf-color-rule);
        content: "";
      }

      .resume[data-theme="staff-software-engineering"] .resume-section > h2 + * {
        margin-top: 0.055in;
      }

      .resume[data-theme="staff-software-engineering"] .resume-entry-header {
        display: grid;
        gap: 0.08in;
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .resume[data-theme="staff-software-engineering"] .resume-entry-header > div {
        align-items: baseline;
        column-gap: 0.14in;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
      }

      .resume[data-theme="staff-software-engineering"] .resume-entry-meta {
        justify-self: end;
        text-align: right;
      }

      .resume[data-theme="staff-software-engineering"] .resume-entry-header--with-link > div {
        display: block;
      }

      .resume[data-theme="staff-software-engineering"] .resume-entry-header--with-link .resume-entry-meta {
        justify-self: start;
        margin-top: 0.012in;
        text-align: left;
      }

      .resume[data-theme="staff-software-engineering"] .resume-entry p {
        color: var(--rf-color-text);
      }

      .resume[data-theme="staff-software-engineering"] .resume-bullet {
        color: var(--rf-color-muted);
      }

      .resume[data-theme="staff-software-engineering"] .resume-highlights li {
        gap: 0.045in;
      }

      .resume[data-theme="staff-software-engineering"] .resume-section--skills .resume-entry {
        align-items: start;
        border-top: 0;
        display: grid;
        grid-template-columns: 1.15in minmax(0, 1fr);
        column-gap: 0.16in;
      }

      .resume[data-theme="staff-software-engineering"] .resume-section--skills .resume-entry + .resume-entry {
        margin-top: 0.045in;
      }

      .resume[data-theme="staff-software-engineering"] .resume-skill-group h3 {
        color: var(--rf-color-muted);
        font-size: var(--rf-small-size);
        text-transform: uppercase;
      }

      .resume[data-theme="staff-software-engineering"] .resume-skills-list {
        columns: unset;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 0;
      }

      @media screen and (max-width: 560px) {
        .resume[data-theme="staff-software-engineering"] .resume-header,
        .resume[data-theme="staff-software-engineering"] .resume-entry-header,
        .resume[data-theme="staff-software-engineering"] .resume-entry-header > div,
        .resume[data-theme="staff-software-engineering"] .resume-section--skills .resume-entry,
        .resume[data-theme="staff-software-engineering"] .resume-skills-list {
          display: block;
        }

        .resume[data-theme="staff-software-engineering"] .resume-contact,
        .resume[data-theme="staff-software-engineering"] .resume-entry-meta {
          justify-items: start;
          text-align: left;
        }

        .resume[data-theme="staff-software-engineering"] .resume-contact .resume-separator {
          display: inline;
        }

        .resume[data-theme="staff-software-engineering"] .resume-entry-meta {
          justify-self: start;
          width: 100%;
        }
      }

      @media screen {
        .resume[data-theme="staff-software-engineering"] {
          min-height: var(--rf-page-height);
        }
      }
`;
}

function formatPhoneHref(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

function formatUrlLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function isPresent(value: string | undefined): value is string {
  return Boolean(value);
}

function omitUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(omitUndefined) as T;
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([entryKey, entryValue]) => [entryKey, omitUndefined(entryValue)]),
  ) as T;
}

function stripTrailingWhitespace(value: string): string {
  return value
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}
