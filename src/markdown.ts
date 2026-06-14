import type {
  Code,
  Heading,
  List,
  ListItem,
  PhrasingContent,
  Root,
  RootContent,
} from "mdast";
import { toMarkdown } from "mdast-util-to-markdown";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import { unified } from "unified";
import YAML from "yaml";

import {
  RESUME_DOCUMENT_SCHEMA_VERSION,
  parseResumeDocument,
  validateResumeDocument,
  type ResumeDocument,
  type ResumeSection,
  type ResumeValidationIssue,
} from "./schema.js";

const RESUME_BLOCK_LANGUAGE = "resume-foundry";

export interface ResumeMarkdownIssue extends ResumeValidationIssue {
  line?: number;
  column?: number;
}

export type ResumeMarkdownParseResult =
  | {
      success: true;
      data: ResumeDocument;
      markdown: string;
      json: string;
    }
  | {
      success: false;
      issues: ResumeMarkdownIssue[];
      summary: string;
    };

export class ResumeMarkdownParseError extends Error {
  readonly issues: ResumeMarkdownIssue[];

  constructor(issues: ResumeMarkdownIssue[]) {
    super(formatIssueSummary(issues));
    this.name = "ResumeMarkdownParseError";
    this.issues = issues;
  }
}

interface YamlNode {
  type: "yaml";
  value: string;
  position?: RootContent["position"];
}

type ParsedRootContent = RootContent | YamlNode;
type ParsedRoot = Omit<Root, "children"> & { children: ParsedRootContent[] };

interface MarkdownSection {
  heading: Heading;
  children: RootContent[];
}

type RecordValue = Record<string, unknown>;

export function parseResumeMarkdown(markdown: string): ResumeDocument {
  const result = parseResumeMarkdownResult(markdown);

  if (!result.success) {
    throw new ResumeMarkdownParseError(result.issues);
  }

  return result.data;
}

export function parseResumeMarkdownResult(markdown: string): ResumeMarkdownParseResult {
  const issues: ResumeMarkdownIssue[] = [];
  const root = parseMarkdownAst(markdown);
  const frontmatter = parseFrontmatter(root, issues);

  if (!frontmatter) {
    return failure(issues);
  }

  const document = buildResumeDocument(root, frontmatter, issues);

  if (issues.length > 0) {
    return failure(issues);
  }

  const validation = validateResumeDocument(document);

  if (!validation.success) {
    return failure(validation.issues);
  }

  const normalizedMarkdown = exportResumeMarkdown(validation.data);

  return {
    success: true,
    data: validation.data,
    markdown: normalizedMarkdown,
    json: `${JSON.stringify(validation.data, null, 2)}\n`,
  };
}

export function parseResumeMarkdownToJson(markdown: string): string {
  const result = parseResumeMarkdownResult(markdown);

  if (!result.success) {
    throw new ResumeMarkdownParseError(result.issues);
  }

  return result.json;
}

export function normalizeResumeMarkdown(markdown: string): string {
  const result = parseResumeMarkdownResult(markdown);

  if (!result.success) {
    throw new ResumeMarkdownParseError(result.issues);
  }

  return result.markdown;
}

export function exportResumeMarkdown(input: ResumeDocument): string {
  const document = parseResumeDocument(input);
  const frontmatter = {
    schemaVersion: document.schemaVersion,
    metadata: document.metadata,
    basics: omitUndefined({
      ...document.basics,
      summary: undefined,
    }),
    sections: document.sections.map(toFrontmatterSection),
    variants: document.variants,
  };

  const lines = [
    "---",
    stringifyYaml(frontmatter).trimEnd(),
    "---",
    "",
    `# ${document.basics.name}`,
  ];

  if (document.basics.summary) {
    lines.push("", document.basics.summary);
  }

  for (const section of document.sections) {
    lines.push("", `## ${section.title}`);

    if (section.summary) {
      lines.push("", section.summary);
    }

    if (section.kind === "skills") {
      lines.push("", fencedResumeYaml({ groups: section.groups }));
      continue;
    }

    for (const item of section.items) {
      lines.push("", `### ${item.title}`, "", fencedResumeYaml(toEntryMetadata(item)));

      if (item.summary) {
        lines.push("", item.summary);
      }

      if (item.highlights?.length) {
        lines.push("", ...item.highlights.map((highlight) => `- ${highlight.text}`));
      }
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function parseMarkdownAst(markdown: string): ParsedRoot {
  return unified().use(remarkParse).use(remarkFrontmatter, ["yaml"]).parse(markdown) as ParsedRoot;
}

function parseFrontmatter(root: ParsedRoot, issues: ResumeMarkdownIssue[]): RecordValue | undefined {
  const yamlNode = root.children.find(isYamlNode);

  if (!yamlNode) {
    issues.push({
      path: "$",
      code: "missing_frontmatter",
      message: "Markdown resume must start with YAML frontmatter.",
    });
    return undefined;
  }

  const parsed = parseYamlValue(yamlNode.value, "$", yamlNode, issues);

  if (!isRecord(parsed)) {
    issues.push({
      path: "$",
      code: "invalid_frontmatter",
      message: "YAML frontmatter must be an object.",
      line: yamlNode.position?.start.line,
      column: yamlNode.position?.start.column,
    });
    return undefined;
  }

  return parsed;
}

function buildResumeDocument(
  root: ParsedRoot,
  frontmatter: RecordValue,
  issues: ResumeMarkdownIssue[],
): unknown {
  const bodyChildren = root.children.filter((child): child is RootContent => !isYamlNode(child));
  const h1Index = bodyChildren.findIndex(
    (child): child is Heading => child.type === "heading" && child.depth === 1,
  );
  const h2Index = bodyChildren.findIndex(
    (child): child is Heading => child.type === "heading" && child.depth === 2,
  );
  const summaryNodes =
    h1Index >= 0 && h2Index > h1Index
      ? bodyChildren.slice(h1Index + 1, h2Index)
      : h2Index > 0
        ? bodyChildren.slice(0, h2Index)
        : [];
  const sections = splitSections(bodyChildren);
  const sectionDeclarations = parseSectionDeclarations(frontmatter.sections);

  return omitUndefined({
    ...frontmatter,
    schemaVersion: frontmatter.schemaVersion ?? RESUME_DOCUMENT_SCHEMA_VERSION,
    metadata: frontmatter.metadata,
    basics: omitUndefined({
      ...(isRecord(frontmatter.basics) ? frontmatter.basics : {}),
      summary:
        isRecord(frontmatter.basics) && typeof frontmatter.basics.summary === "string"
          ? frontmatter.basics.summary
          : serializeNodes(summaryNodes),
    }),
    sections: sections.map((section) =>
      buildSection(section, sectionDeclarations.get(normalizeSectionTitle(headingText(section.heading))), issues),
    ),
  });
}

function splitSections(children: RootContent[]): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  let currentSection: MarkdownSection | undefined;

  for (const child of children) {
    if (child.type === "heading" && child.depth === 2) {
      currentSection = {
        heading: child,
        children: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (currentSection) {
      currentSection.children.push(child);
    }
  }

  return sections;
}

function parseSectionDeclarations(value: unknown): Map<string, RecordValue> {
  const sections = new Map<string, RecordValue>();

  if (!Array.isArray(value)) {
    return sections;
  }

  for (const section of value) {
    if (!isRecord(section)) {
      continue;
    }

    if (typeof section.title === "string") {
      sections.set(normalizeSectionTitle(section.title), section);
    }
  }

  return sections;
}

function buildSection(
  section: MarkdownSection,
  declaration: RecordValue | undefined,
  issues: ResumeMarkdownIssue[],
): unknown {
  const title = headingText(section.heading);
  const kind = typeof declaration?.kind === "string" ? declaration.kind : inferSectionKind(title);
  const baseSection = omitUndefined({
    id: typeof declaration?.id === "string" ? declaration.id : slugify(title),
    kind,
    title: typeof declaration?.title === "string" ? declaration.title : title,
    summary: typeof declaration?.summary === "string" ? declaration.summary : undefined,
    tags: declaration?.tags,
    priority: declaration?.priority,
    density: declaration?.density,
  });

  if (kind === "skills") {
    return {
      ...baseSection,
      groups: buildSkillGroups(section.children, issues),
    };
  }

  return {
    ...baseSection,
    items: buildEntries(section.children, String(baseSection.id), issues),
  };
}

function buildEntries(
  children: RootContent[],
  sectionId: string,
  issues: ResumeMarkdownIssue[],
): unknown[] {
  return splitEntries(children).map((entry) => buildEntry(entry, sectionId, issues));
}

function splitEntries(children: RootContent[]): MarkdownSection[] {
  const entries: MarkdownSection[] = [];
  let currentEntry: MarkdownSection | undefined;

  for (const child of children) {
    if (child.type === "heading" && child.depth === 3) {
      currentEntry = {
        heading: child,
        children: [],
      };
      entries.push(currentEntry);
      continue;
    }

    if (currentEntry) {
      currentEntry.children.push(child);
    }
  }

  return entries;
}

function buildEntry(
  entry: MarkdownSection,
  sectionId: string,
  issues: ResumeMarkdownIssue[],
): unknown {
  const title = headingText(entry.heading);
  const metadata = mergeResumeBlocks(entry.children, `$.sections.${sectionId}.${slugify(title)}`, issues);
  const contentNodes = entry.children.filter((child) => !isResumeYamlCode(child));
  const summary = serializeNodes(contentNodes.filter((child) => child.type !== "list"));
  const bulletHighlights = contentNodes
    .filter((child): child is List => child.type === "list")
    .flatMap((list) => list.children.map(listItemToHighlightText));
  const {
    highlights,
    summary: metadataSummary,
    title: metadataTitle,
    ...entryFields
  } = metadata;

  return omitUndefined({
    id: `${sectionId}-${slugify(title)}`,
    ...entryFields,
    title: typeof metadataTitle === "string" ? metadataTitle : title,
    summary: typeof metadataSummary === "string" ? metadataSummary : summary,
    highlights: normalizeHighlights(highlights, bulletHighlights),
  });
}

function buildSkillGroups(children: RootContent[], issues: ResumeMarkdownIssue[]): unknown[] {
  const metadata = mergeResumeBlocks(children, "$.sections.skills", issues);

  if (Array.isArray(metadata.groups)) {
    return metadata.groups;
  }

  return splitEntries(children)
    .map((group) => {
      const name = headingText(group.heading);
      const groupMetadata = mergeResumeBlocks(group.children, `$.sections.skills.${slugify(name)}`, issues);
      const { name: metadataName, skills: metadataSkills, ...groupFields } = groupMetadata;
      const skills = group.children
        .filter((child): child is List => child.type === "list")
        .flatMap((list) =>
          list.children.map((item) => ({
            name: listItemToHighlightText(item),
          })),
        );

      return omitUndefined({
        id: `skills-${slugify(name)}`,
        ...groupFields,
        name: typeof metadataName === "string" ? metadataName : name,
        skills: Array.isArray(metadataSkills) ? metadataSkills : skills,
      });
    })
    .filter((group) => isRecord(group) && Array.isArray(group.skills) && group.skills.length > 0);
}

function mergeResumeBlocks(
  children: RootContent[],
  path: string,
  issues: ResumeMarkdownIssue[],
): RecordValue {
  const metadata: RecordValue = {};

  for (const [index, child] of children.filter(isResumeYamlCode).entries()) {
    const value = parseYamlValue(child.value, `${path}.metadataBlocks[${index}]`, child, issues);

    if (isRecord(value)) {
      Object.assign(metadata, value);
    } else if (value !== undefined) {
      issues.push({
        path: `${path}.metadataBlocks[${index}]`,
        code: "invalid_metadata_block",
        message: "Resume metadata blocks must contain a YAML object.",
        line: child.position?.start.line,
        column: child.position?.start.column,
      });
    }
  }

  return metadata;
}

function parseYamlValue(
  value: string,
  path: string,
  node: { position?: RootContent["position"] },
  issues: ResumeMarkdownIssue[],
): unknown {
  try {
    return coerceDateRangeValues(YAML.parse(value));
  } catch (error) {
    issues.push({
      path,
      code: "invalid_yaml",
      message: error instanceof Error ? error.message : "Invalid YAML.",
      line: node.position?.start.line,
      column: node.position?.start.column,
    });
    return undefined;
  }
}

function coerceDateRangeValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(coerceDateRangeValues);
  }

  if (!isRecord(value)) {
    return value;
  }

  if (isRecord(value.dateRange)) {
    return {
      ...Object.fromEntries(
        Object.entries(value).map(([entryKey, entryValue]) => [
          entryKey,
          entryKey === "dateRange" ? entryValue : coerceDateRangeValues(entryValue),
        ]),
      ),
      dateRange: {
        ...value.dateRange,
        start:
          typeof value.dateRange.start === "number"
            ? String(value.dateRange.start)
            : value.dateRange.start,
        end:
          typeof value.dateRange.end === "number" ? String(value.dateRange.end) : value.dateRange.end,
      },
    };
  }

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [entryKey, coerceDateRangeValues(entryValue)]),
  );
}

function normalizeHighlights(metadataHighlights: unknown, bulletHighlights: string[]): unknown[] | undefined {
  if (!Array.isArray(metadataHighlights)) {
    return bulletHighlights.length > 0
      ? bulletHighlights.map((highlight) => ({ text: highlight }))
      : undefined;
  }

  return metadataHighlights.map((highlight, index) => {
    if (typeof highlight === "string") {
      return { text: highlight };
    }

    if (isRecord(highlight)) {
      return omitUndefined({
        ...highlight,
        text:
          typeof highlight.text === "string"
            ? highlight.text
            : bulletHighlights[index] ?? undefined,
      });
    }

    return highlight;
  });
}

function listItemToHighlightText(item: ListItem): string {
  return (serializeNodes(item.children) ?? "").replace(/\n+/g, " ").trim();
}

function serializeNodes(children: RootContent[]): string | undefined {
  if (children.length === 0) {
    return undefined;
  }

  const markdown = toMarkdown(
    {
      type: "root",
      children,
    },
    {
      bullet: "-",
      fences: true,
    },
  ).trim();

  return markdown.length > 0 ? markdown : undefined;
}

function headingText(heading: Heading): string {
  return heading.children.map(phrasingText).join("").trim();
}

function phrasingText(node: PhrasingContent): string {
  if ("value" in node && typeof node.value === "string") {
    return node.value;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map((child) => phrasingText(child as PhrasingContent)).join("");
  }

  if (node.type === "break") {
    return " ";
  }

  return "";
}

function inferSectionKind(title: string): Exclude<ResumeSection["kind"], "skills"> | "skills" {
  const normalized = normalizeSectionTitle(title);

  if (normalized.includes("education")) {
    return "education";
  }

  if (normalized.includes("project")) {
    return "projects";
  }

  if (normalized.includes("skill")) {
    return "skills";
  }

  if (normalized.includes("award")) {
    return "awards";
  }

  if (normalized.includes("certification")) {
    return "certifications";
  }

  if (normalized.includes("publication")) {
    return "publications";
  }

  if (normalized.includes("volunteer")) {
    return "volunteering";
  }

  return "experience";
}

function toFrontmatterSection(section: ResumeSection): RecordValue {
  return omitUndefined({
    id: section.id,
    kind: section.kind,
    title: section.title,
    summary: section.summary,
    tags: section.tags,
    priority: section.priority,
    density: section.density,
  });
}

function toEntryMetadata(item: Exclude<ResumeSection, { kind: "skills" }>["items"][number]): RecordValue {
  return omitUndefined({
    id: item.id,
    subtitle: item.subtitle,
    organization: item.organization,
    location: item.location,
    url: item.url,
    dateRange: item.dateRange,
    tags: item.tags,
    priority: item.priority,
    density: item.density,
    highlights: item.highlights?.some(hasHighlightMetadata)
      ? item.highlights.map((highlight) =>
          omitUndefined({
            id: highlight.id,
            tags: highlight.tags,
            priority: highlight.priority,
          }),
        )
      : undefined,
  });
}

function hasHighlightMetadata(highlight: { id?: string; tags?: string[]; priority?: number }): boolean {
  return Boolean(highlight.id ?? highlight.tags ?? highlight.priority);
}

function fencedResumeYaml(value: unknown): string {
  return ["```resume-foundry", stringifyYaml(value).trimEnd(), "```"].join("\n");
}

function stringifyYaml(value: unknown): string {
  return YAML.stringify(omitUndefined(value), {
    lineWidth: 0,
  });
}

function normalizeSectionTitle(title: string): string {
  return title.trim().toLowerCase();
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "item";
}

function isYamlNode(node: ParsedRootContent): node is YamlNode {
  return node.type === "yaml";
}

function isResumeYamlCode(node: RootContent): node is Code {
  return node.type === "code" && node.lang === RESUME_BLOCK_LANGUAGE;
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function omitUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(omitUndefined) as T;
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([entryKey, entryValue]) => [entryKey, omitUndefined(entryValue)]),
  ) as T;
}

function failure(issues: ResumeMarkdownIssue[]): ResumeMarkdownParseResult {
  return {
    success: false,
    issues,
    summary: formatIssueSummary(issues),
  };
}

function formatIssueSummary(issues: ResumeMarkdownIssue[]): string {
  return issues
    .map((issue) => {
      const location =
        issue.line === undefined ? issue.path : `${issue.path} at ${issue.line}:${issue.column ?? 1}`;
      return `${location}: ${issue.message}`;
    })
    .join("\n");
}
