# Roadmap and Known Work

This is the canonical inventory and recommended delivery sequence for unfinished work as of 2026-07-28. It combines known issues found in the current site, production-readiness gaps, optional enhancements recorded in the product standards, and ongoing maintenance responsibilities.

The sequence below communicates product and engineering priority, not delivery dates. Optional enhancements remain uncommitted unless user evidence or product needs justify promoting them.

## Current status

- The required application routes and static-export architecture are implemented.
- All 9 current Markdown files pass content schema, internal-link, and local-media validation.
- Contact fields, email format, HTTPS social links, and the empty Contact body are validated before builds.
- The deployed Home and Resume routes respond successfully.
- The current application completes lint, automated tests, content validation, and the production static build successfully.
- Markdown routes, inline local media, metadata, sitemap, robots, and structured images share deployment-safe base-path handling.
- Production analytics is intentionally disabled and no analytics SDK ships to visitors.
- There are no code `TODO`, `FIXME`, or `TBD` markers.
- There were no open GitHub issues or pull requests at the time of review.

## Recommended delivery sequence

### 1. Make content links deployment-safe — completed

Treat the two high-priority link items as one workstream:

1. make root-relative links in Markdown bodies work locally and under the GitHub Pages repository base path; and
2. extend build validation to reject unresolved internal links and missing inline local assets.

This is the first priority because it prevents production navigation failures and keeps future content changes from silently introducing broken links or media.

### 2. Add linting and focused automated tests — completed

Add documented lint and test commands and run them in CI. Initial coverage should focus on:

- content mapping and validation;
- Markdown link and asset handling;
- scene-graph construction;
- route and metadata generation;
- project filtering; and
- critical keyboard and fallback interactions.

This safety net should be in place before broader feature work.

### 3. Strengthen project case studies — awaiting evidence

Add truthful, specific outcomes to each project where evidence is available. Useful outcomes include scale, performance, delivery impact, responsibilities, technical constraints, and clearly stated learning outcomes.

This remains the highest-value content improvement for recruiters and hiring managers. Implementation is gated on user-supplied facts so no metrics or outcomes are invented.

### 4. Decide the production analytics policy — completed

Production analytics is intentionally disabled. PostHog, custom event calls, analytics environment variables, and analytics promises have been removed while all underlying interactions remain available.

### 5. Add demos and write-ups opportunistically

Add demo and write-up links only when polished, accurate, public resources exist. GitHub-only links remain acceptable when no strong additional destination is available.

### Deferred optional enhancements

Do not prioritize search, a dedicated featured-project section, a theme toggle, or additional performance controls without evidence that they solve a visitor problem. A solar-system legend or mini-map is the strongest candidate among the optional enhancements, but it should follow usability feedback showing that the existing hint and labels are insufficient.

## Known issues: content and navigation

### Make Markdown internal links base-path aware

- **Status:** Resolved
- **Priority:** High

Markdown links and images now pass through the shared deployment URL resolver. Authors keep root-relative source values, and production builds add `/Resume` exactly once.

**Complete when:** internal links work both at `/` locally and under the production repository base path.

## Production-readiness work

### Validate internal links and embedded local assets during the build

- **Status:** Resolved
- **Priority:** High

The validator checks structured images plus Markdown links and images. Unknown fixed routes, nonexistent project slugs, invalid Resume anchors, unsafe paths, unsupported schemes, and missing local media fail before deployment.

**Complete when:** validation rejects unresolved internal links and missing local assets anywhere in content.

### Production analytics intentionally disabled

- **Status:** Resolved
- **Priority:** Medium

PostHog and its custom events were removed from the application and documentation. The production site ships no analytics SDK or analytics environment contract.

**Complete when:** resolved; analytics is explicitly outside the promised deployment feature set.

### Add dedicated lint and test commands

- **Status:** Resolved
- **Priority:** Medium

Dedicated ESLint, Vitest, watch, and aggregate quality commands now run locally and in GitHub Actions before deployment.

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
- `NEXT_PUBLIC_SITE_URL` as the site origin.

After environment changes, verify absolute metadata URLs, sitemap entries, robots output, asset URLs, and links in the deployed site.

## Content quality improvements

### Add measurable results to project case studies

- **Status:** Awaiting user-supplied evidence
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

1. open the private Tailscale authoring server;
2. select a public repository and configure its featured state and overrides;
3. save, fetch, and generate through the fixed Build actions;
4. review the generated Markdown in Site content;
5. run the full quality gate from the authoring server; and
6. review and commit only approved Markdown, media, and code changes.

See the [runbook](../docs/RUNBOOK.md#github-project-ingestion) for access, security, and troubleshooting.

### Keep decisions and wiki pages synchronized

- Record architectural and tooling changes in `docs/DECISIONS.md`.
- Update [Architecture](architecture.md) when the current system shape changes.
- Update [User-facing features](features.md) when visible behavior ships or is removed.
- Move completed roadmap entries into the decision history or a resolved section.
- Keep product standards stable unless the intended experience changes.

## Resolved historical items

### July 28, 2026 engineering foundation

- Markdown links and inline local media became base-path-aware and build-validated.
- Site URL generation was unified across content, metadata, sitemap, and robots output.
- ESLint, Vitest, interaction coverage, and pull-request quality gates were added.
- PostHog and all analytics instrumentation were intentionally removed.

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
- Contact now uses validated structured content for its introduction, email, social profiles, location, availability, metadata, and responsive visual cards; and
- authoring-server-managed profile and project images now resolve under the GitHub Pages `/Resume` base path.
