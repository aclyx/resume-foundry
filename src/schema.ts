import { z } from "zod";

export const RESUME_DOCUMENT_SCHEMA_VERSION = "resume-foundry/v1";

export const resumeDensityValues = ["compact", "standard", "spacious"] as const;
export const resumePageTargetValues = ["one-page", "two-page", "custom"] as const;
const resumeItemSectionKindValues = [
  "experience",
  "education",
  "projects",
  "awards",
  "certifications",
  "publications",
  "volunteering",
  "custom",
] as const;
export const resumeSectionKindValues = [...resumeItemSectionKindValues, "skills"] as const;

const StableIdSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, {
    message:
      "Use a stable id starting with a letter or number and containing only letters, numbers, '.', '_', ':', or '-'.",
  });

const TagSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, {
    message:
      "Use a tag starting with a letter or number and containing only letters, numbers, '.', '_', ':', or '-'.",
  });

const TagListSchema = z.array(TagSchema).min(1);
const PrioritySchema = z.number().int().min(0).max(100);
const DensitySchema = z.enum(resumeDensityValues);
const PageTargetSchema = z.enum(resumePageTargetValues);
const MarkdownStringSchema = z.string().min(1);
const DateValueSchema = z.string().regex(/^\d{4}(?:-\d{2})?(?:-\d{2})?$/, {
  message: "Use YYYY, YYYY-MM, or YYYY-MM-DD.",
});

export const ResumeDateRangeSchema = z
  .object({
    start: DateValueSchema.optional(),
    end: DateValueSchema.optional(),
    isCurrent: z.boolean().optional(),
    label: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((dateRange, context) => {
    if (!dateRange.start && !dateRange.end && !dateRange.isCurrent && !dateRange.label) {
      context.addIssue({
        code: "custom",
        message: "Date ranges need a start, end, current marker, or display label.",
      });
    }

    if (dateRange.isCurrent && dateRange.end) {
      context.addIssue({
        code: "custom",
        path: ["end"],
        message: "Use isCurrent without an end date.",
      });
    }
  });

export const ResumeMetadataSchema = z
  .object({
    title: z.string().min(1).optional(),
    locale: z.string().min(2).optional(),
    source: z
      .enum(["canonical-json", "canonical-yaml", "markdown-frontmatter", "json-resume", "manual"])
      .optional(),
    density: DensitySchema.optional(),
    tags: TagListSchema.optional(),
    notes: MarkdownStringSchema.optional(),
  })
  .strict();

export const ResumeProfileSchema = z
  .object({
    network: z.string().min(1),
    username: z.string().min(1).optional(),
    url: z.string().url().optional(),
    tags: TagListSchema.optional(),
  })
  .strict();

export const ResumeBasicsSchema = z
  .object({
    name: z.string().min(1),
    label: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
    url: z.string().url().optional(),
    location: z.string().min(1).optional(),
    summary: MarkdownStringSchema.optional(),
    profiles: z.array(ResumeProfileSchema).min(1).optional(),
  })
  .strict();

export const ResumeHighlightSchema = z
  .object({
    id: StableIdSchema.optional(),
    text: MarkdownStringSchema,
    tags: TagListSchema.optional(),
    priority: PrioritySchema.optional(),
  })
  .strict();

export const ResumeEntrySchema = z
  .object({
    id: StableIdSchema,
    title: z.string().min(1),
    subtitle: z.string().min(1).optional(),
    organization: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    url: z.string().url().optional(),
    dateRange: ResumeDateRangeSchema.optional(),
    summary: MarkdownStringSchema.optional(),
    highlights: z.array(ResumeHighlightSchema).min(1).optional(),
    tags: TagListSchema.optional(),
    priority: PrioritySchema.optional(),
    density: DensitySchema.optional(),
  })
  .strict();

const ResumeSectionBaseSchema = z
  .object({
    id: StableIdSchema,
    title: z.string().min(1),
    summary: MarkdownStringSchema.optional(),
    tags: TagListSchema.optional(),
    priority: PrioritySchema.optional(),
    density: DensitySchema.optional(),
  })
  .strict();

const ResumeItemSectionSchema = ResumeSectionBaseSchema.extend({
  kind: z.enum(resumeItemSectionKindValues),
  items: z.array(ResumeEntrySchema).min(1),
}).strict();

export const ResumeSkillSchema = z
  .object({
    id: StableIdSchema.optional(),
    name: z.string().min(1),
    level: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
    tags: TagListSchema.optional(),
    priority: PrioritySchema.optional(),
  })
  .strict();

export const ResumeSkillGroupSchema = z
  .object({
    id: StableIdSchema,
    name: z.string().min(1),
    skills: z.array(ResumeSkillSchema).min(1),
    tags: TagListSchema.optional(),
    priority: PrioritySchema.optional(),
    density: DensitySchema.optional(),
  })
  .strict();

const ResumeSkillsSectionSchema = ResumeSectionBaseSchema.extend({
  kind: z.literal("skills"),
  groups: z.array(ResumeSkillGroupSchema).min(1),
}).strict();

export const ResumeSectionSchema = z.discriminatedUnion("kind", [
  ResumeItemSectionSchema,
  ResumeSkillsSectionSchema,
]);

export const ResumeSectionOverrideSchema = z
  .object({
    title: z.string().min(1).optional(),
    hidden: z.boolean().optional(),
    priority: PrioritySchema.optional(),
    density: DensitySchema.optional(),
    maxItems: z.number().int().min(0).optional(),
    includeItems: z.array(StableIdSchema).min(1).optional(),
    excludeItems: z.array(StableIdSchema).min(1).optional(),
  })
  .strict();

export const ResumeEntryOverrideSchema = z
  .object({
    hidden: z.boolean().optional(),
    priority: PrioritySchema.optional(),
    density: DensitySchema.optional(),
    summary: MarkdownStringSchema.optional(),
    highlights: z.array(ResumeHighlightSchema).min(1).optional(),
    tags: TagListSchema.optional(),
  })
  .strict();

export const ResumeVariantSchema = z
  .object({
    name: z.string().min(1),
    pageTarget: PageTargetSchema,
    description: MarkdownStringSchema.optional(),
    density: DensitySchema.optional(),
    tags: TagListSchema.optional(),
    includeSections: z.array(StableIdSchema).min(1).optional(),
    excludeSections: z.array(StableIdSchema).min(1).optional(),
    sectionOrder: z.array(StableIdSchema).min(1).optional(),
    sectionOverrides: z.record(StableIdSchema, ResumeSectionOverrideSchema).optional(),
    entryOverrides: z.record(StableIdSchema, ResumeEntryOverrideSchema).optional(),
  })
  .strict();

export const ResumeDocumentSchema = z
  .object({
    schemaVersion: z.literal(RESUME_DOCUMENT_SCHEMA_VERSION),
    metadata: ResumeMetadataSchema.optional(),
    basics: ResumeBasicsSchema,
    sections: z.array(ResumeSectionSchema).min(1),
    variants: z.record(StableIdSchema, ResumeVariantSchema).optional(),
  })
  .strict()
  .superRefine(validateResumeDocumentSemantics);

const generatedJsonSchema = z.toJSONSchema(ResumeDocumentSchema, {
  target: "draft-7",
});

export const resumeDocumentJsonSchema = {
  ...generatedJsonSchema,
  $id: "https://resume-foundry.dev/schemas/resume-document.schema.json",
  title: "Resume Foundry ResumeDocument",
  description:
    "Canonical, presentation-independent resume document schema for Resume Foundry.",
};

export type ResumeDensity = z.infer<typeof DensitySchema>;
export type ResumePageTarget = z.infer<typeof PageTargetSchema>;
export type ResumeDateRange = z.infer<typeof ResumeDateRangeSchema>;
export type ResumeMetadata = z.infer<typeof ResumeMetadataSchema>;
export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;
export type ResumeBasics = z.infer<typeof ResumeBasicsSchema>;
export type ResumeHighlight = z.infer<typeof ResumeHighlightSchema>;
export type ResumeEntry = z.infer<typeof ResumeEntrySchema>;
export type ResumeSkill = z.infer<typeof ResumeSkillSchema>;
export type ResumeSkillGroup = z.infer<typeof ResumeSkillGroupSchema>;
export type ResumeSection = z.infer<typeof ResumeSectionSchema>;
export type ResumeSectionOverride = z.infer<typeof ResumeSectionOverrideSchema>;
export type ResumeEntryOverride = z.infer<typeof ResumeEntryOverrideSchema>;
export type ResumeVariant = z.infer<typeof ResumeVariantSchema>;
export type ResumeDocument = z.infer<typeof ResumeDocumentSchema>;

export interface ResumeValidationIssue {
  path: string;
  code: string;
  message: string;
}

export type ResumeValidationResult =
  | {
      success: true;
      data: ResumeDocument;
    }
  | {
      success: false;
      issues: ResumeValidationIssue[];
      summary: string;
    };

export function parseResumeDocument(input: unknown): ResumeDocument {
  return ResumeDocumentSchema.parse(input);
}

export function validateResumeDocument(input: unknown): ResumeValidationResult {
  const result = ResumeDocumentSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    issues: formatResumeValidationErrors(result.error),
    summary: z.prettifyError(result.error),
  };
}

export function formatResumeValidationErrors(error: z.ZodError): ResumeValidationIssue[] {
  return error.issues.map((issue) => ({
    path: formatValidationPath(issue.path),
    code: issue.code,
    message: issue.message,
  }));
}

function validateResumeDocumentSemantics(
  document: {
    sections: ResumeSection[];
    variants?: Record<string, ResumeVariant>;
  },
  context: z.RefinementCtx,
): void {
  const sectionIds = new Set<string>();
  const entryIds = new Set<string>();
  const sectionEntryIds = new Map<string, Set<string>>();

  for (const [sectionIndex, section] of document.sections.entries()) {
    if (sectionIds.has(section.id)) {
      context.addIssue({
        code: "custom",
        path: ["sections", sectionIndex, "id"],
        message: `Duplicate section id "${section.id}".`,
      });
    }

    sectionIds.add(section.id);
    const localEntryIds = new Set<string>();
    sectionEntryIds.set(section.id, localEntryIds);

    if (section.kind === "skills") {
      for (const [groupIndex, group] of section.groups.entries()) {
        addEntryId(group.id, ["sections", sectionIndex, "groups", groupIndex, "id"]);
      }
    } else {
      for (const [itemIndex, item] of section.items.entries()) {
        addEntryId(item.id, ["sections", sectionIndex, "items", itemIndex, "id"]);
      }
    }

    function addEntryId(id: string, path: Array<string | number>): void {
      if (entryIds.has(id)) {
        context.addIssue({
          code: "custom",
          path,
          message: `Duplicate entry id "${id}".`,
        });
      }

      if (localEntryIds.has(id)) {
        context.addIssue({
          code: "custom",
          path,
          message: `Duplicate entry id "${id}" within section "${section.id}".`,
        });
      }

      entryIds.add(id);
      localEntryIds.add(id);
    }
  }

  for (const [variantId, variant] of Object.entries(document.variants ?? {})) {
    validateSectionReferences(variant.includeSections, [
      "variants",
      variantId,
      "includeSections",
    ]);
    validateSectionReferences(variant.excludeSections, [
      "variants",
      variantId,
      "excludeSections",
    ]);
    validateSectionReferences(variant.sectionOrder, ["variants", variantId, "sectionOrder"]);

    for (const [sectionId, override] of Object.entries(variant.sectionOverrides ?? {})) {
      if (!sectionIds.has(sectionId)) {
        context.addIssue({
          code: "custom",
          path: ["variants", variantId, "sectionOverrides", sectionId],
          message: `Unknown section id "${sectionId}".`,
        });
        continue;
      }

      const allowedEntryIds = sectionEntryIds.get(sectionId) ?? new Set<string>();
      validateEntryReferences(override.includeItems, allowedEntryIds, [
        "variants",
        variantId,
        "sectionOverrides",
        sectionId,
        "includeItems",
      ]);
      validateEntryReferences(override.excludeItems, allowedEntryIds, [
        "variants",
        variantId,
        "sectionOverrides",
        sectionId,
        "excludeItems",
      ]);
    }

    for (const entryId of Object.keys(variant.entryOverrides ?? {})) {
      if (!entryIds.has(entryId)) {
        context.addIssue({
          code: "custom",
          path: ["variants", variantId, "entryOverrides", entryId],
          message: `Unknown entry id "${entryId}".`,
        });
      }
    }
  }

  function validateSectionReferences(
    references: string[] | undefined,
    path: Array<string | number>,
  ): void {
    for (const [index, sectionId] of (references ?? []).entries()) {
      if (!sectionIds.has(sectionId)) {
        context.addIssue({
          code: "custom",
          path: [...path, index],
          message: `Unknown section id "${sectionId}".`,
        });
      }
    }
  }

  function validateEntryReferences(
    references: string[] | undefined,
    allowedEntryIds: Set<string>,
    path: Array<string | number>,
  ): void {
    for (const [index, entryId] of (references ?? []).entries()) {
      if (!allowedEntryIds.has(entryId)) {
        context.addIssue({
          code: "custom",
          path: [...path, index],
          message: `Unknown entry id "${entryId}" for this section.`,
        });
      }
    }
  }
}

function formatValidationPath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "$";
  }

  return path.reduce<string>((formattedPath, segment) => {
    if (typeof segment === "number") {
      return `${formattedPath}[${segment}]`;
    }

    return `${formattedPath}.${String(segment)}`;
  }, "$");
}
