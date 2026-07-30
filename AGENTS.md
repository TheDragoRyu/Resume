# Repository Instructions for Codex Agents

This repository is policy-driven. Every change must preserve the constraints below. Use `CLAUDE.md` as the source reference if anything here needs clarification.

## Project Shape

- Static portfolio/resume site built with Next.js 15, React 19, TypeScript strict mode, and the App Router.
- Static export only: `next.config.ts` must keep `output: 'export'`.
- No backend, API routes, SSR, or ISR.
- Styling is Tailwind CSS only. Do not add CSS Modules, styled-components, or another styling system.
- 3D visualization uses Three.js, React Three Fiber, and `@react-three/drei`, loaded client-side only.

## Repository Boundaries

- `src/app/`: route-level pages, layouts, metadata, sitemap, robots, and not-found only.
- `src/components/`: reusable components only.
- `src/components/three/`: all React Three Fiber and 3D components.
- `src/sections/`: page section blocks only, with no routing logic.
- `src/data/`: raw Markdown content source of truth only.
- `src/content/`: loaders, mappers, validators, and content types only.
- `src/utils/`: pure utility functions only.
- `scripts/`: build, validation, and content sync scripts.
- `docs/`: architecture decisions and runbooks.

Update `docs/DECISIONS.md` for architectural or tooling decisions.

## Content Rules

- All resume, project, intro, category, and page content must live in `src/data/` Markdown files.
- React components must not hardcode resume or project content.
- UI should render typed objects produced by `src/content/` loaders.
- Markdown directories and filenames use `kebab-case`.
- Every Markdown file must include frontmatter with at least `id`, `slug`, `title`, `type`, and `order`.
- `id` and `slug` values must be unique across the site.
- Projects must reference a valid `categoryId`.
- Build validation must fail on invalid content; do not bypass it.

## Routing Rules

The App Router must define and statically export:

- `/`
- `/resume`
- `/projects`
- `/projects/[slug]`
- `/contact`

Route pages must not parse raw Markdown directly. Use loader outputs from `src/content/`.

## Naming and Style

- React component files use PascalCase, for example `ProjectCard.tsx`.
- Non-component files use kebab-case, for example `content-loader.ts`.
- Exported types and interfaces use PascalCase.
- Hooks must start with `use`.
- Prefer existing component, section, loader, and helper patterns before adding new abstractions.

## Accessibility and SEO

Every touched page must preserve:

- Exactly one `h1`.
- Semantic landmarks: `header`, `nav`, `main`, `footer`.
- Keyboard-reachable interactive elements.
- Accessible names for inputs and buttons.
- Meaningful metadata through `generateMetadata`, including Open Graph and Twitter Card fields.
- The 3D canvas as visual enhancement with `aria-hidden="true"`.

## Local Commands

- `npm run dev`: start the development server.
- `npm run validate`: validate Markdown content schemas.
- `npm run build`: validate content and build the static export.
- `npm run start`: serve the built `out/` directory.
- `npm run sync-projects`: fetch and generate project content from configured GitHub repos.

## Definition of Done

- Repository structure and folder boundaries remain compliant.
- Content remains single-source under `src/data/`.
- Routes render through the Next.js App Router and static export.
- `npm run build` succeeds for code or content changes.
- Accessibility and SEO requirements remain valid for touched UI.
- `docs/DECISIONS.md` is updated when a change affects architecture or tooling.

## Authoring Server and Generation Invariants

- Every writer of `src/data/projects/*.md` must resolve its destination through `scripts/project-paths.ts`. That module owns slug syntax, containment, symlink rejection, and atomic writes; do not join a slug into a path anywhere else.
- A project selection save must resolve every target path before persisting `.featured-repos.local.json` (`saveProjectConfiguration` in `scripts/project-selection.ts`), so a later failure cannot leave configuration and content disagreeing.
- Repository metadata and README text are untrusted prompt input. The generation subprocess must keep its environment allowlist, empty temporary HOME, empty working directory, and disabled tools. See `docs/RUNBOOK.md`, "Generation sandbox", and `docs/DECISIONS.md`, 2026-07-30.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
