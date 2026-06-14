# Resume Foundry

Resume Foundry is a TypeScript library and CLI for converting structured resume data into themed HTML, PDF, and Markdown outputs.

The project starts with a small, public-safe foundation: typed resume document models, renderer boundaries, basic HTML/Markdown rendering, and a CLI placeholder. It does not include any private resume content.

## Package Manager

This repository uses pnpm. It is fast, disk-efficient, and its strict dependency layout is a good fit for a library/CLI package where accidental transitive dependency usage should be caught early.

## Status

This is an initial scaffold. The renderer API is intentionally small while the project shape is established:

- structured resume data model
- theme-aware render options
- Markdown output
- HTML output
- PDF output placeholder for a later HTML-to-PDF pipeline
- CLI entry point placeholder

## Development

```sh
pnpm install
pnpm lint
pnpm test
pnpm build
```

## CLI

```sh
pnpm build
pnpm resume-foundry --help
```

The CLI currently prints help/version information and reserves the conversion workflow for the first implementation pass.

## License

MIT
