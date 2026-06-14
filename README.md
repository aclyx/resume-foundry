# Resume Foundry

Resume Foundry is a TypeScript library and CLI for converting structured resume data into themed HTML, PDF, and Markdown outputs.

The project starts with a small, public-safe foundation: typed resume document models, renderer boundaries, basic HTML/Markdown rendering, and a CLI placeholder. It does not include any private resume content.

## Package Manager

This repository uses pnpm. It is fast, disk-efficient, and its strict dependency layout is a good fit for a library/CLI package where accidental transitive dependency usage should be caught early.

## Status

This is an initial scaffold. The renderer API is intentionally small while the project shape is established:

- Zod-backed canonical resume data model
- generated JSON Schema for the canonical model
- canonical JSON and Markdown/frontmatter fixtures
- print-first HTML presentation theme system
- Markdown output
- HTML output
- PDF output placeholder for a later HTML-to-PDF pipeline
- CLI entry point placeholder

The data layer is documented in [docs/data-layer.md](docs/data-layer.md).
The presentation theme system is documented in [docs/theme-system.md](docs/theme-system.md).

## Markdown Import

Resume Foundry can parse Markdown resumes with YAML frontmatter into the canonical `ResumeDocument` schema. Markdown body content is parsed through a Markdown AST, while frontmatter and fenced `resume-foundry` metadata blocks are parsed as YAML.

```ts
import {
  normalizeResumeMarkdown,
  parseResumeMarkdownResult,
  parseResumeMarkdownToJson,
} from "resume-foundry";

const result = parseResumeMarkdownResult(markdown);

if (result.success) {
  console.log(result.data);
  console.log(result.json);
  console.log(normalizeResumeMarkdown(markdown));
}
```

The CLI exposes the same parser:

```sh
pnpm build
pnpm resume-foundry parse fixtures/one-page.resume.md --format json
pnpm resume-foundry parse fixtures/one-page.resume.md --format markdown
```

## HTML Themes

```ts
import { baselineResumeTheme, renderHtml } from "resume-foundry";

const html = renderHtml(resume, {
  theme: baselineResumeTheme,
  variant: "one-page",
  pageSize: "letter",
});
```

The baseline theme renders semantic HTML with selectable text, accessible links, `@page`
print CSS, page-size controls, and compact/standard/spacious density tokens.

## Development

```sh
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm schema
```

## CLI

```sh
pnpm build
pnpm resume-foundry --help
```

The CLI currently prints help/version information and reserves the conversion workflow for the first implementation pass.

## License

MIT
