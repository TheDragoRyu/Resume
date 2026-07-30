# Problem Statement

## Context

Sanchith needs a public portfolio that communicates game-development experience, technical skills, education, and project work to recruiters, hiring managers, collaborators, and other developers.

A conventional resume is fast to scan but does little to demonstrate interactive engineering or personal style. A highly visual portfolio can demonstrate those qualities, but it can also hide important information behind animation, require capable hardware, perform poorly on mobile, or become inaccessible to keyboard and screen-reader users.

## Core problem

Build a portfolio that is immediately useful as a resume and project archive while using an interactive 3D solar system to demonstrate game-development identity and invite exploration.

The visual experience must never become the only way to find information. Every 3D destination must also be available through ordinary pages and navigation, and the complete site must remain publishable as static files without a backend.

## Intended users and jobs

### Recruiters and hiring managers

- Understand the candidate's role, experience, skills, and education quickly.
- Find representative projects and supporting source links.
- Reach the candidate without learning the 3D interface.

### Technical interviewers and engineering peers

- Inspect project context, approach, results, and technology choices.
- See evidence of game, simulation, frontend, and systems engineering.
- Navigate directly to source repositories or demos when provided.

### Visitors exploring the portfolio

- Discover content through a distinctive, playful interface.
- Understand what is interactive without hidden gestures.
- Use an equivalent conventional experience if they prefer or if WebGL is unavailable.

### The site owner

- Maintain resume and project content as version-controlled Markdown.
- Add projects without duplicating data across pages, menus, and the 3D scene.
- Validate and publish the entire site through a repeatable static build.
- Optionally generate draft project case studies from configured GitHub repositories.

## Product goals

1. Put Resume, Projects, and Contact within one conventional navigation action.
2. Make the candidate's value understandable within a short scan.
3. Provide a memorable 3D exploration layer without making it a dependency.
4. Keep navigation labels, routes, resume sections, projects, and scene nodes synchronized from one content source.
5. Support desktop, mobile, keyboard, screen-reader, reduced-motion, low-performance, and no-WebGL use cases.
6. Produce SEO-friendly, shareable static pages for every public route.
7. Keep operation simple enough for a personal site: Markdown, private Tailscale authoring, build-time validation, and GitHub Pages.

## Constraints

- The application is a static Next.js export. It has no server, API routes, SSR, ISR, database, or first-party form handler.
- Resume, project, intro, category, and standalone page content lives under `src/data/` as Markdown with validated frontmatter.
- Route pages consume typed loader output; they do not parse Markdown directly.
- Styling uses the existing Tailwind-based theme and global Tailwind layer.
- Three.js and React Three Fiber run only in the browser and remain a progressive enhancement.
- Contact uses `mailto:` and external profile links.
- The canvas is hidden from assistive technology; semantic DOM navigation provides the accessible path.
- GitHub Pages subdirectory deployment must work through the configured base path.

## Non-goals

- A backend, CMS runtime, database, authentication system, or admin dashboard in the deployed portfolio. The loopback-only authoring service is an operations tool, not a production dependency.
- Server-side contact processing.
- Making the 3D canvas the only or primary accessible navigation surface.
- Replacing readable case studies with purely visual project presentations.
- Real-time GitHub synchronization at page-request time.

## Success criteria

The product succeeds when:

- all required routes are available as static HTML and pass the production build;
- a visitor can reach every destination without using WebGL;
- 3D labels and conventional navigation match the Markdown content;
- keyboard-only and mobile visitors can use every core path;
- reduced-motion and performance preferences produce a stable experience;
- invalid content stops the build before deployment;
- project and resume content is accurate, complete, and free of broken assets or links;
- search and social previews receive meaningful metadata; and
- the production site operates without analytics or tracking dependencies.

The interaction principles behind these criteria are defined in the [design pillars](design-pillars.md) and [UX standards](ux-standards.md).
