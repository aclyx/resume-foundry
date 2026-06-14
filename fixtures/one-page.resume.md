---
schemaVersion: resume-foundry/v1
metadata:
  title: One Page Example Resume
  locale: en-US
  source: markdown-frontmatter
  density: compact
  tags:
    - one-page
    - product-engineering
basics:
  name: One Page Person
  label: Product Engineer
  email: one@example.com
  url: https://one.example.com
  location: San Francisco, CA
sections:
  - id: experience
    kind: experience
    title: Experience
    priority: 100
    density: compact
  - id: skills
    kind: skills
    title: Skills
    priority: 70
    density: compact
variants:
  one-page:
    name: One-page resume
    pageTarget: one-page
    density: compact
    sectionOrder:
      - experience
      - skills
    sectionOverrides:
      experience:
        maxItems: 1
---

# One Page Person

Builds focused product systems with typed content workflows.

## Experience

### Compact Systems

```resume-foundry
id: compact-systems-lead
subtitle: Lead Engineer
organization: Compact Systems
location: San Francisco, CA
dateRange:
  start: 2023
  isCurrent: true
priority: 100
tags:
  - product
  - leadership
```

Led a small team building resume authoring and rendering infrastructure.

- Shipped a schema-first import path for Markdown-authored resumes.
- Kept the one-page variant concise through section priority metadata.

## Skills

```resume-foundry
groups:
  - id: languages
    name: Languages
    priority: 90
    skills:
      - name: TypeScript
        level: expert
      - name: Python
        level: advanced
  - id: practices
    name: Practices
    priority: 80
    skills:
      - name: Schema design
      - name: Content validation
```
