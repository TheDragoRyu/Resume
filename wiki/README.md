# Project Wiki

This wiki is the product and technical guide for the Resume Website. It describes why the product exists, how it works, what visitors can do today, and what work remains.

## Core documents

- [Problem statement](problem-statement.md) — the audience, problem, goals, constraints, and measures of success.
- [Architecture](architecture.md) — the system boundaries, content and rendering pipelines, routes, 3D model, analytics, and deployment.
- [User-facing features](features.md) — every currently implemented capability described from a visitor's perspective.
- [Roadmap and known work](roadmap.md) — unresolved defects, production-readiness work, documented optional enhancements, and recurring maintenance.

## Product standards

- [Design pillars](design-pillars.md) — the product's UX constitution and decision filter. This document was moved from the repository root.
- [UX patterns and standards](ux-standards.md) — interaction, accessibility, fallback, and page-pattern requirements. This document was moved from the repository root.

## Operational and historical records

These records remain in `docs/` because repository policy assigns that directory to decision history and runbooks:

- [Architecture decisions](../docs/DECISIONS.md) — chronological decisions, rationales, and trade-offs.
- [Development and operations runbook](../docs/RUNBOOK.md) — local development, content authoring, deployment, and project-sync procedures.
- [Repository overview](../README.md) — setup instructions and a concise project introduction.
- [Repository policy](../CLAUDE.md) — mandatory implementation boundaries.

## Status language

- **Implemented** means the behavior is present in the current repository.
- **Known issue** means current behavior or content is incorrect or incomplete.
- **Planned** means the work is explicitly identified but not yet implemented.
- **Optional** means the product standards record the idea as a possible enhancement, not a committed deliverable.
- **Ongoing** means a recurring operational or editorial responsibility.

The roadmap is the canonical inventory of unfinished work. Historical decisions may describe work as deferred that was implemented later; those items are recorded as resolved in the roadmap rather than reopened.
