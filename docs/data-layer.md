# Resume Data Layer

## Recommendation

Use `ResumeDocument` as the single canonical model for the library. Authors may write
canonical JSON, canonical YAML, or Markdown with YAML frontmatter, but every import path
must normalize to the same typed `ResumeDocument` before validation, variant selection, or
rendering.

The canonical model is intentionally content-first:

- `schemaVersion` identifies the data contract.
- `metadata` captures document-wide tags, source format, locale, and density hints.
- `basics` captures identity and contact details.
- `sections` is an ordered, typed list of resume sections with stable ids.
- `variants` captures one-page, two-page, and custom resume projections without copying
  the base content.

The Zod source of truth lives in [src/schema.ts](../src/schema.ts). The generated JSON
Schema artifact lives in [schemas/resume-document.schema.json](../schemas/resume-document.schema.json).
Example source data lives in [fixtures/example.resume.json](../fixtures/example.resume.json)
and [fixtures/example.resume.md](../fixtures/example.resume.md).

## Format Comparison

| Format | Strengths | Weaknesses | Recommendation |
| --- | --- | --- | --- |
| Markdown + YAML frontmatter | Good authoring ergonomics, readable diffs, natural long-form prose, friendly for hand edits. | Needs a strict importer grammar for headings, fenced metadata, item ids, and Markdown fragments. Weak as an interchange format because important structure can drift into prose. | Support as an authoring adapter. Normalize into `ResumeDocument`; do not treat the Markdown file as canonical. |
| JSON/YAML canonical schema | Precise validation, stable ids, clear variant support, direct library input, easy fixture generation, compatible with schema-aware editors. YAML is hand-editable while JSON is ideal for tooling. | Less natural for prose-heavy editing, and JSON comments are unavailable. | Use this as canonical. JSON is the primary interchange format; YAML can be parsed into the same schema. |
| JSON Resume compatibility | Existing ecosystem, useful import/export bridge, familiar field names for basics/work/education/skills. | The model is too broad and too shallow for density, priority, section-level variants, and renderer-specific selection rules. It also lacks a first-class variant concept. | Provide import/export adapters, not the internal model. Keep mappings explicit and document lossy fields. |
| MDX | Powerful for rich embedded components and custom presentation. | Couples content to rendering runtime, expands security surface, makes non-React targets harder, and works against presentation independence. | Do not support as canonical. Consider a future export target only if a React presentation package needs it. |

## Canonical Model

The current schema version is `resume-foundry/v1`.

Important conventions:

- Stable ids use `A-Za-z0-9._:-` and must be unique for sections and entries.
- Dates use `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. Current roles use
  `{ "start": "2022-03", "isCurrent": true }` instead of `"Present"` as a date.
- Text fields may contain Markdown fragments. Renderers decide which Markdown subset they
  support.
- `priority` is an integer from `0` to `100`; higher means more important.
- `density` is one of `compact`, `standard`, or `spacious`. It is a content selection hint,
  not a layout instruction.
- Tags are stable machine-readable labels used for targeting, filtering, or analysis.

Minimal canonical example:

```json
{
  "schemaVersion": "resume-foundry/v1",
  "metadata": {
    "title": "Example Person Resume",
    "source": "canonical-json",
    "density": "standard",
    "tags": ["software"]
  },
  "basics": {
    "name": "Example Person",
    "label": "Staff Software Engineer",
    "email": "example@example.com",
    "summary": "Builds reliable product systems from structured data."
  },
  "sections": [
    {
      "id": "experience",
      "kind": "experience",
      "title": "Experience",
      "priority": 100,
      "items": [
        {
          "id": "example-systems-staff",
          "title": "Example Systems",
          "subtitle": "Staff Software Engineer",
          "dateRange": {
            "start": "2022-03",
            "isCurrent": true
          },
          "highlights": [
            {
              "text": "Designed typed content contracts for shared rendering targets.",
              "priority": 100
            }
          ]
        }
      ]
    }
  ]
}
```

## JSON Schema

`resumeDocumentJsonSchema` is generated from `ResumeDocumentSchema` through Zod's JSON
Schema generator. Regenerate the checked-in artifact with:

```sh
pnpm schema
```

The generated schema is for editor and external tool integration. Runtime validation
should use Zod because semantic checks such as duplicate ids and variant references are
implemented in `superRefine` and are more precise than JSON Schema can express.

## Import Strategy

All importers should return `ResumeDocument` or a validation result from
`validateResumeDocument`.

- Canonical JSON: parse with `JSON.parse`, then validate with `ResumeDocumentSchema`.
- Canonical YAML: parse YAML to an object, then validate with `ResumeDocumentSchema`.
- Markdown + frontmatter: parse frontmatter for `metadata`, `basics`, declared sections,
  and variants. Parse the Markdown body into section items using `##` section headings,
  `###` item headings, and `resume-foundry` fenced YAML blocks for item or skills-group
  metadata. Then validate the normalized `ResumeDocument`.
- JSON Resume: map `basics`, `work`, `education`, `projects`, `skills`,
  `awards`, `certificates`, and `publications` into typed sections. Preserve unknown
  or lossy fields in `metadata.notes` or adapter warnings rather than silently dropping
  them.
- MDX: no importer for the canonical layer. If support is added later, it should be a
  presentation package concern.

Importers should accumulate adapter warnings separately from schema validation errors.
For example, a JSON Resume field with no canonical equivalent should be a warning, while
an invalid URL or duplicate entry id should be a validation error.

## Export Strategy

Exports should start from an already validated `ResumeDocument`.

- Canonical JSON: stable, pretty-printed JSON for interchange and fixtures.
- Canonical YAML: optional human-editable export with the same structure as JSON.
- Markdown + frontmatter: authoring export that places document metadata, basics,
  section declarations, and variants in frontmatter, then writes sections and items in
  Markdown with fenced `resume-foundry` metadata blocks. This is intended to be
  re-importable, but canonical JSON remains the lossless format.
- JSON Resume: compatibility export for external tools. Include adapter warnings when
  variants, density, priority, or custom section metadata cannot be represented.

Presentation exports such as HTML, PDF, and MDX should live above this layer. They should
not mutate content or become the source of truth for variants.

## Validation Errors

Use `validateResumeDocument(input)` for user-facing validation. It returns:

```ts
type ResumeValidationResult =
  | { success: true; data: ResumeDocument }
  | { success: false; issues: ResumeValidationIssue[]; summary: string };
```

Each issue has:

- `path`: JSONPath-style location, such as `$.variants.one-page.sectionOrder[0]`.
- `code`: Zod issue code, including `custom` for semantic validation.
- `message`: human-readable detail.

Validation currently covers:

- Required canonical fields and enum values.
- URL, email, id, date, density, and priority formats.
- Duplicate section ids.
- Duplicate entry ids.
- Unknown section references in variants.
- Unknown entry references in section and entry overrides.
- Date ranges with both `isCurrent` and `end`.

## Variant Support

Variants are projections of the same base content. They should never duplicate whole
sections or resume copies.

`variants[variantId]` supports:

- `pageTarget`: `one-page`, `two-page`, or `custom`.
- `density`: compactness hint for selection and rendering.
- `sectionOrder`: variant-specific section ordering.
- `includeSections` and `excludeSections`: coarse section filtering.
- `sectionOverrides`: per-section title, hidden, priority, density, max item count, and
  item include or exclude lists.
- `entryOverrides`: per-entry hidden, priority, density, summary, highlight, and tag
  overrides.

The expected selection pipeline is:

1. Validate the base document.
2. Choose a variant id.
3. Apply section include, exclude, and order rules.
4. Apply section overrides and item filters.
5. Apply entry overrides.
6. Pass the resolved document projection to presentation.

This keeps one-page and two-page resumes grounded in the same facts while allowing
different density and priority choices.

## Density, Priority, and Tags

Density and priority are metadata for selection, not visual design.

- Document-level `metadata.density` is the default hint.
- Variant-level `density` overrides the document default.
- Section-level `density` and `priority` guide section treatment.
- Entry-level and highlight-level `priority` guide truncation or ordering inside a
  variant.
- Tags support audience targeting such as `applied-ai`, `frontend`, `management`,
  `startup`, or `public-sector`.

Themes may read these hints, but themes should not require content authors to write
layout-specific fields such as columns, font sizes, or exact page measurements.
