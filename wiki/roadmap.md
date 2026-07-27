# Roadmap and Known Work

This is the canonical inventory of unfinished work as of 2026-07-27. It combines known issues found in the current site, production-readiness gaps, optional enhancements recorded in the product standards, and ongoing maintenance responsibilities.

It is an inventory, not a delivery schedule.

## Current status

- The required application routes and static-export architecture are implemented.
- All 8 current Markdown files pass the existing content validator.
- Contact fields, email format, HTTPS social links, and the empty Contact body are validated before builds.
- The deployed Home and Resume routes respond successfully.
- The current application completes the production static build successfully.
- There are no code `TODO`, `FIXME`, or `TBD` markers.
- There were no open GitHub issues or pull requests at the time of review.

## Known issues: content and navigation

### Make Markdown internal links base-path aware

- **Status:** Known issue
- **Priority:** High

Markdown bodies are converted to raw HTML. Root-relative links such as `/projects/example` bypass Next.js base-path handling on the GitHub Pages `/Resume` deployment.

Adopt a content-link convention or transformation that produces deployment-safe links without sacrificing local development.

**Complete when:** internal links work both at `/` locally and under the production repository base path.

## Production-readiness work

### Validate internal links and embedded local assets during the build

- **Status:** Planned
- **Priority:** High

The validator now checks configured profile and project-cover image paths, allowed image extensions, missing files, project-cover alt text, and structured Contact fields and links. It still does not inspect routes or images embedded inside rich Markdown bodies. Extend validation so nonexistent project slugs and broken inline media fail before deployment.

**Complete when:** validation rejects unresolved internal links and missing local assets anywhere in content.

### Enable PostHog in the deployment build

- **Status:** Planned
- **Priority:** Medium

The application expects `NEXT_PUBLIC_POSTHOG_KEY` and optionally `NEXT_PUBLIC_POSTHOG_HOST`, but the GitHub Pages workflow currently maps only the base path and site URL into `next build`.

Add the analytics variables to the build environment, configure them in the deployment environment, and verify pageview and custom-event delivery. If production analytics is not desired, update the project documentation to state that it is intentionally disabled.

**Complete when:** production analytics is verified or explicitly removed from the promised deployment feature set.

### Add dedicated lint and test commands

- **Status:** Planned
- **Priority:** Medium

The current scripts validate content and run the Next.js build, but no dedicated lint or automated test command exists.

Add proportionate coverage for:

- content mapping and validation;
- scene-graph construction;
- route and metadata generation;
- internal link/asset integrity;
- project filtering; and
- critical keyboard and fallback interactions.

**Complete when:** documented lint and test commands run locally and in CI.

### Verify production environment variables

- **Status:** Ongoing
- **Priority:** Medium

Maintain correct GitHub deployment values for:

- `NEXT_PUBLIC_BASE_PATH`;
- `NEXT_PUBLIC_SITE_URL`;
- `NEXT_PUBLIC_POSTHOG_KEY`, if analytics remains enabled; and
- `NEXT_PUBLIC_POSTHOG_HOST`, when a non-default host is used.

After environment changes, verify absolute metadata URLs, sitemap entries, robots output, asset URLs, links, and analytics in the deployed site.

## Content quality improvements

### Add measurable results to project case studies

- **Status:** Planned
- **Priority:** Medium

The UX standard recommends Problem/Context, Approach, Results, Tech Stack, and Links. Current case studies provide Problem, Solution, Highlights, and Tech Stack, but generally lack measurable outcomes.

Add results, scale, performance figures, delivery impact, or clearly stated learning outcomes where truthful and available.

### Add demos and write-ups where available

- **Status:** Planned
- **Priority:** Low

Project frontmatter supports GitHub, demo, and write-up links. Current projects provide GitHub links only. Add the other destinations when real public resources exist.

### Review generated project content before every commit

- **Status:** Ongoing
- **Priority:** Medium

The project-sync pipeline uses AI-assisted copy. Generated Markdown must be checked for factual accuracy, useful context, consistent voice, valid links, unique ordering, and required case-study sections before validation and commit.

## Optional product enhancements

These ideas are recorded in [UX patterns and standards](ux-standards.md), but are not committed requirements.

### Search

**Status:** Optional

Add content search that can route a term such as a skill to the relevant Resume section or project. Any implementation must work with the static-export constraint and remain keyboard accessible.

### Solar-system legend or mini-map

**Status:** Optional

Add a concise explanation of the sun/planet/moon mapping if user evidence shows the existing hint and labels are insufficient.

### Dedicated featured-project section

**Status:** Optional

The current Projects page sorts featured cards first and marks them with a badge. The UX standard also allows a distinct, content-driven Featured Projects section at the top.

### Additional performance reductions

**Status:** Optional

Performance mode currently freezes motion and reduces star particles. If future scene complexity adds post-processing, higher draw distances, or detailed assets, extend the mode to reduce those costs as well.

### Theme toggle

**Status:** Optional, not currently planned

The UX standard permits a theme toggle “if present,” but does not require one. The current product intentionally uses a fixed cyberpunk dark theme.

## Ongoing operations

### Maintain project content from GitHub

When featuring a new repository:

1. update `scripts/featured-repos.json` with a unique order and approved context;
2. fetch repository metadata;
3. inspect the cache;
4. generate or manually write the Markdown;
5. review the content;
6. run validation and the production build; and
7. commit the Markdown source.

See the [runbook](../docs/RUNBOOK.md#syncing-github-projects) for commands and troubleshooting.

### Keep decisions and wiki pages synchronized

- Record architectural and tooling changes in `docs/DECISIONS.md`.
- Update [Architecture](architecture.md) when the current system shape changes.
- Update [User-facing features](features.md) when visible behavior ships or is removed.
- Move completed roadmap entries into the decision history or a resolved section.
- Keep product standards stable unless the intended experience changes.

## Resolved historical items

The March 3 decision record initially deferred these items:

- mobile 3D interaction;
- invisible hit colliders;
- the onboarding pulse and hint; and
- tag filtering.

All four were implemented in the March 4 UX audit work. That audit also completed the documented keyboard scene navigation, context-panel focus handling, loading feedback, performance particle reduction, active Resume TOC, fallback navigation, Open Graph image, 404 improvements, and related accessibility fixes.

The optional loading status line and manual Performance mode described in the UX standards are also implemented.

### July 2026 resume and Contact updates

The previously recorded resume-content issues are resolved:

- the profile role is now `Senior Game Developer`;
- Experience now records the LILA and Audify roles supplied from LinkedIn, including progression to Senior Unity Engineer;
- the placeholder employer and unresolved placeholder project links were removed; and
- Contact now uses validated structured content for its introduction, email, social profiles, location, availability, metadata, and responsive visual cards.
