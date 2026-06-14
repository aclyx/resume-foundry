---
schemaVersion: resume-foundry/v1
metadata:
  title: Example Person Resume
  locale: en-US
  source: markdown-frontmatter
  density: standard
  tags:
    - software
    - product-engineering
basics:
  name: Example Person
  label: Staff Software Engineer
  email: example@example.com
  phone: "+1 555 0100"
  url: https://example.com
  location: San Francisco, CA
  profiles:
    - network: GitHub
      username: example
      url: https://github.com/example
sections:
  - id: experience
    kind: experience
    title: Experience
    priority: 100
    density: standard
  - id: projects
    kind: projects
    title: Selected Projects
    priority: 70
  - id: skills
    kind: skills
    title: Skills
    priority: 60
    density: compact
variants:
  one-page:
    name: One-page product engineering
    pageTarget: one-page
    density: compact
    sectionOrder:
      - experience
      - projects
      - skills
    sectionOverrides:
      experience:
        maxItems: 1
        includeItems:
          - example-systems-staff
  two-page:
    name: Two-page full history
    pageTarget: two-page
    density: standard
    sectionOrder:
      - experience
      - projects
      - skills
---

# Example Person

Builds reliable product systems and applied AI tools from structured data.

## Experience

### Example Systems

```resume-foundry
id: example-systems-staff
subtitle: Staff Software Engineer
organization: Example Systems
location: San Francisco, CA
dateRange:
  start: 2022-03
  isCurrent: true
priority: 100
tags:
  - leadership
  - data-modeling
```

Led data-heavy product engineering across authoring, validation, and rendering workflows.

- Designed typed content contracts that let rendering targets share one normalized resume source.
- Reduced manual resume variant editing by centralizing section priority and density metadata.

### Sample Labs

```resume-foundry
id: sample-labs-senior
subtitle: Senior Software Engineer
organization: Sample Labs
dateRange:
  start: 2019
  end: 2022
priority: 80
```

- Built import pipelines for Markdown and JSON authoring sources.

## Selected Projects

### Resume Foundry

```resume-foundry
id: resume-foundry
subtitle: Typed resume rendering library
url: https://github.com/example/resume-foundry
priority: 85
tags:
  - typescript
  - zod
```

A presentation-independent data layer for resume rendering.

## Skills

```resume-foundry
groups:
  - id: languages
    name: Languages
    priority: 80
    skills:
      - name: TypeScript
        level: expert
        priority: 100
      - name: Python
        level: advanced
        priority: 80
  - id: systems
    name: Systems
    priority: 70
    skills:
      - name: Schema design
      - name: Validation pipelines
```
