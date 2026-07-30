# Repository Instructions for Codex Agents

`CLAUDE.md` is the single authoritative policy for this repository. It owns the enforced
stack, the repository structure and folder boundaries, the content rules (single source of
truth under `src/data/`), the routing rules, the naming and style conventions, the
accessibility and SEO requirements, the prohibited actions, and the definition of done for
any change. Read it first and comply with every rule in it.

This file adds only what `CLAUDE.md` does not state. Do not copy policy from `CLAUDE.md`
into this file: a policy change must have exactly one place to edit. If the two ever appear
to conflict, `CLAUDE.md` wins.

## Local Commands

- `npm run dev`: start the development server.
- `npm run validate`: validate Markdown content schemas.
- `npm run build`: validate content and build the static export.
- `npm run start`: serve the built `out/` directory.
- `npm run sync-projects`: fetch and generate project content from configured GitHub repos.

## Working Conventions

- Prefer existing component, section, loader, and helper patterns before adding new abstractions.
- `scripts/` holds the build, validation, content sync, and private authoring server scripts.

## Authoring Server and Generation Invariants

- Every writer of `src/data/projects/*.md` must resolve its destination through `scripts/project-paths.ts`. That module owns slug syntax, containment, symlink rejection, and atomic writes; do not join a slug into a path anywhere else.
- A project selection save must resolve every target path before persisting `.featured-repos.local.json` (`saveProjectConfiguration` in `scripts/project-selection.ts`), so a later failure cannot leave configuration and content disagreeing.
- Repository metadata and README text are untrusted prompt input. `scripts/generation-worker.ts` owns the subprocess boundary — environment allowlist, empty temporary HOME, empty working directory, disabled tools, runtime tool attestation, and sandbox removal on interrupt — and must keep all of them. See `docs/RUNBOOK.md`, "Generation sandbox", and `docs/DECISIONS.md`, 2026-07-30.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
