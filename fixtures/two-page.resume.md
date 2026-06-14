---
schemaVersion: resume-foundry/v1
metadata:
  title: Two Page Example Resume
  locale: en-US
  source: markdown-frontmatter
  density: standard
  tags:
    - two-page
    - full-history
basics:
  name: Two Page Person
  label: Staff Software Engineer
  email: two@example.com
  phone: "+1 555 0200"
  url: https://two.example.com
  location: New York, NY
sections:
  - id: experience
    kind: experience
    title: Experience
    priority: 100
  - id: education
    kind: education
    title: Education
    priority: 60
  - id: projects
    kind: projects
    title: Projects
    priority: 75
  - id: skills
    kind: skills
    title: Skills
    priority: 65
variants:
  two-page:
    name: Two-page resume
    pageTarget: two-page
    density: standard
    sectionOrder:
      - experience
      - projects
      - education
      - skills
---

# Two Page Person

Builds durable systems across product engineering, data tooling, and developer platforms.

## Experience

### Durable Apps

```resume-foundry
id: durable-apps-staff
subtitle: Staff Software Engineer
organization: Durable Apps
dateRange:
  start: 2021-04
  isCurrent: true
priority: 100
```

Led platform work across authoring, validation, and publishing workflows.

- Designed reusable content models for multi-format publishing.
- Built validation reporting that mapped parser failures to source locations.

### Reliable Labs

```resume-foundry
id: reliable-labs-senior
subtitle: Senior Software Engineer
organization: Reliable Labs
dateRange:
  start: 2018
  end: 2021
priority: 85
```

- Migrated legacy document templates to structured resume data.
- Added import warnings for compatibility formats with lossy fields.

## Projects

### Resume Foundry

```resume-foundry
id: resume-foundry-parser
subtitle: Markdown/frontmatter parser
url: https://github.com/aclyx/resume-foundry
priority: 90
tags:
  - markdown
  - yaml
```

Parses author-friendly resumes into a canonical typed schema.

- Supports structured metadata blocks for experience, education, projects, and skills.

### Parser Notes

Documents the importer contract for author-friendly Markdown files.

- Shows that structured YAML blocks are optional for ordinary section items.

## Education

### Example University

```resume-foundry
id: example-university-bs
subtitle: B.S. Computer Science
organization: Example University
dateRange:
  start: 2014
  end: 2018
priority: 60
```

- Studied distributed systems and human-computer interaction.

## Skills

### Languages

- TypeScript
- Python
- SQL

### Platforms

- Node.js
- Postgres
- GitHub Actions
