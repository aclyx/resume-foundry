---
schemaVersion: resume-foundry/v1
metadata:
  title: Staff Software Engineering Resume
  locale: en-US
  source: markdown-frontmatter
  density: standard
  tags:
    - pdf
    - two-page
    - staff-engineering
basics:
  name: Jordan Rivera
  label: Staff Software Engineer
  email: jordan.rivera@example.com
  phone: "+1 555 0142"
  url: https://jordan.example.com
  location: Seattle, WA
sections:
  - id: staff-scope
    kind: custom
    title: Staff-Level Scope
    priority: 98
  - id: experience
    kind: experience
    title: Experience
    priority: 100
  - id: projects
    kind: projects
    title: Selected Staff Impact
    priority: 75
  - id: education
    kind: education
    title: Education
    priority: 60
  - id: skills
    kind: skills
    title: Skills
    priority: 70
variants:
  two-page:
    name: Two-page Staff resume
    pageTarget: two-page
    density: standard
    sectionOrder:
      - staff-scope
      - experience
      - projects
      - education
      - skills
---

# Jordan Rivera

Staff engineer for product-platform organizations: turns ambiguous cross-team problems into durable architecture, operating models, and accountable execution.

## Staff-Level Scope

### Technical Direction

```resume-foundry
id: staff-scope-technical-direction
subtitle: Org-level platform strategy
priority: 100
tags:
  - strategy
  - architecture
```

Accountable for engineering direction across six product teams and the shared workflow platform beneath them.

- Set architecture roadmaps that connected product workflows, data contracts, release operations, and ownership boundaries.
- Converted recurring incidents and migration risk into platform standards, design review practices, and launch readiness gates.

### Engineering Leverage

```resume-foundry
id: staff-scope-engineering-leverage
subtitle: Cross-team leadership
priority: 95
tags:
  - mentorship
  - operating-model
```

Creates leverage by improving how senior engineers make decisions, sequence work, and own production systems.

- Facilitated Staff/Senior review forums and mentored engineers into independent technical ownership.
- Reframed platform investments in product terms so leaders could trade off velocity, reliability, and compliance risk.

## Experience

### Northstar Systems

```resume-foundry
id: northstar-systems-principal
subtitle: Principal Staff Engineer
organization: Northstar Systems
location: Seattle, WA
dateRange:
  start: 2022
  isCurrent: true
priority: 100
tags:
  - platform
  - leadership
```

Set engineering direction for the shared workflow platform used by product, data, and operations teams.

- Owned architecture decisions for a platform spanning six product lines and more than 20 services.
- Led a 14-engineer migration from bespoke job runners to an observable orchestration service.
- Reduced repeated incidents by introducing typed contracts, ownership reviews, and rollback playbooks.
- Coached senior engineers through architecture reviews, execution planning, and operational readiness.

### Atlas Cloud

```resume-foundry
id: atlas-cloud-staff
subtitle: Staff Software Engineer
organization: Atlas Cloud
location: New York, NY
dateRange:
  start: 2019
  end: 2022
priority: 90
tags:
  - developer-platform
  - systems
```

Owned developer productivity systems for a growing cloud infrastructure organization.

- Built a deployment control plane that improved release confidence across 70 services.
- Reworked service templates around explicit runtime, ownership, and compliance metadata.
- Partnered with security to move audit evidence collection into normal engineering workflows.
- Created engineering scorecards that surfaced reliability work without slowing product delivery.

### Finch Health

```resume-foundry
id: finch-health-senior
subtitle: Senior Software Engineer
organization: Finch Health
location: Remote
dateRange:
  start: 2016
  end: 2019
priority: 80
tags:
  - product-engineering
  - data
```

Led product engineering for clinical operations tooling and patient communication workflows.

- Rebuilt scheduling and intake flows with typed APIs, audit trails, and accessible UI patterns.
- Designed event-driven integrations between clinical systems, analytics pipelines, and support tools.
- Improved page performance and reduced support escalations by simplifying state management.
- Mentored a product squad on test strategy, incident response, and pragmatic system design.

### Signal Forge

```resume-foundry
id: signal-forge-engineer
subtitle: Software Engineer
organization: Signal Forge
location: Boston, MA
dateRange:
  start: 2013
  end: 2016
priority: 70
```

Built collaboration and reporting tools for enterprise analytics customers.

- Delivered customer-facing dashboards backed by resilient ingestion and query services.
- Introduced contract tests for data exports that protected enterprise reporting workflows.
- Supported early hiring loops, onboarding documentation, and technical design standards.

## Selected Staff Impact

### Delivery Operating Model

```resume-foundry
id: delivery-operating-model
subtitle: Engineering leadership system
priority: 85
tags:
  - leadership
  - planning
```

Codified planning, architecture review, launch readiness, and incident follow-up practices for cross-team programs.

- Made dependency risk, reliability investment, and ownership expectations visible before delivery commitments.

### Platform Migration Toolkit

```resume-foundry
id: platform-migration-toolkit
subtitle: Internal migration framework
url: https://github.com/example/platform-migration-toolkit
priority: 80
tags:
  - platform
  - migration
```

Reusable scripts, validation reports, and rollout dashboards for moving product services onto shared infrastructure.

- Preserved product velocity by making migration status inspectable by engineers, managers, and partner teams.

## Education

### Northeastern University

```resume-foundry
id: northeastern-cs
subtitle: B.S. Computer Science
organization: Northeastern University
dateRange:
  start: 2009
  end: 2013
priority: 60
```

- Coursework in distributed systems, databases, human-computer interaction, and software engineering.

## Skills

### Leadership

- Technical strategy
- Architecture review
- Staff mentorship
- Cross-team planning

### Systems

- TypeScript
- Node.js
- Python
- Postgres
- Event-driven systems

### Product

- Product engineering
- Accessibility
- Developer experience
- Data workflows

### Operations

- Observability
- Incident response
- Release engineering
- Compliance workflows
