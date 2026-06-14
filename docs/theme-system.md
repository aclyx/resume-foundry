# Presentation Theme System

Resume Foundry keeps presentation above the canonical `ResumeDocument` data layer. The HTML
renderer accepts validated resume content plus presentation controls, resolves the requested
variant, and emits semantic, selectable HTML with print-first CSS.

## Theme Interface

Themes implement `ResumeTheme`:

```ts
interface ResumeTheme {
  name: string;
  tokens: ResumeThemeTokens;
}
```

`ResumeThemeTokens` groups the visual contract into:

- `typography`: font stack, type sizes, line heights, weights, and letter spacing.
- `spacing`: page rhythm, section gaps, item gaps, paragraph gaps, and list indentation.
- `color`: background, text, muted text, accent, link, and rule colors.
- `rules`: section and item rule widths/styles.
- `density`: `compact`, `standard`, and `spacious` token overrides for section, item,
  paragraph, and list spacing.
- `surface`: screen-preview background, padding, and shadow. Print output remains governed
  by `@page` and the resume text tokens.

The included `baselineResumeTheme` is intentionally minimal and print-oriented.
The included `staffSoftwareEngineeringTheme` is denser and more typographic, optimized
for Staff-level software engineering resumes that need ATS-visible text, subtle rules, and
a restrained PDF/print appearance without cards, badges, icons, gradients, or dark
backgrounds.

The Staff theme stays content-neutral: it does not invent Staff-level claims from ordinary
resume entries. Staff-specific resumes should lead with scope and leverage before chronology,
such as technical direction, architecture ownership, cross-team operating models, mentorship,
incident/reliability accountability, and business-facing tradeoffs. The PDF fixture demonstrates
this with a `Staff-Level Scope` section and `Selected Staff Impact` section ahead of supporting
experience, education, and skills.

## Render Controls

`renderHtml(resume, options)` accepts:

- `theme`: a `ResumeTheme`; legacy `{ name, accentColor, fontFamily }` objects are also
  normalized for compatibility.
- `variant`: a key from `resume.variants`, such as `one-page` or `two-page`.
- `pageSize`: `letter`, `a4`, or a custom `{ name, width, height, margin }` object.
- `density`: explicit `compact`, `standard`, or `spacious` override.
- `pageTarget`: explicit `one-page`, `two-page`, or `custom` override.

Variant resolution happens before rendering:

1. Filter sections with `includeSections` and `excludeSections`.
2. Apply `sectionOrder`.
3. Apply section overrides, including title, hidden, density, priority, item filters, and
   `maxItems`.
4. Apply entry overrides for item/group visibility and density.

## HTML Contract

The baseline renderer emits:

- `<main>` with data attributes for theme, density, page size, and page target.
- `<header>` for identity and contact details.
- `<address>` for contact links.
- `<section>` for resume sections.
- `<article>` for entries and skill groups.
- Accessible text links for email, phone, profiles, and entry URLs.

The renderer does not use images, canvas, or non-selectable content. CSS is print-first:
the base output targets paged media, `@page` defines size and margins, and screen-only
styles add a lightweight paper preview.
