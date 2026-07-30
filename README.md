# Portfolio Site

A static portfolio and resume website featuring an interactive 3D solar system as a navigation metaphor. Built with Next.js 15, React Three Fiber, and a cyberpunk aesthetic.

Planets represent resume categories (Experience, Skills, Education), moons represent individual projects, and the sun links to contact info. The 3D scene is a progressive enhancement — the full site works without WebGL via conventional navigation.

## Tech Stack

- **Framework:** Next.js 15 (Static Export) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4, Silkscreen pixel font, neon color palette
- **3D:** Three.js + React Three Fiber + @react-three/drei (client-side only)
- **Content:** Markdown with YAML frontmatter, parsed at build time
- **Deploy:** GitHub Actions → GitHub Pages

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run validate` | Validate Markdown schemas, internal links, and local media |
| `npm run lint` | Run ESLint with zero warnings |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run build` | Build the static site (runs validation first) |
| `npm run check` | Run lint, tests, validation, and the static build |
| `npm run start` | Serve the built `/out` directory locally |

## Project Structure

```
src/
├── app/             # Next.js App Router (route pages only)
├── components/
│   ├── layout/      # Header, Footer, Navigation, SkipLink
│   ├── ui/          # Button, Card, Tag, Breadcrumb
│   └── three/       # All React Three Fiber / 3D components
├── sections/        # Page section blocks (Landing, Resume, Projects)
├── content/         # Content loaders, validators, type definitions
├── data/            # Markdown source-of-truth files
├── styles/          # Global CSS + Tailwind config
└── utils/           # Pure utility functions
```

Strict folder boundaries are enforced — see [CLAUDE.md](CLAUDE.md) for the full policy.

## Documentation

- [Project wiki](wiki/README.md) — problem statement, current architecture, user-facing features, roadmap, and product standards.
- [Architecture decisions](docs/DECISIONS.md) — chronological technical and product decisions.
- [Operations runbook](docs/RUNBOOK.md) — development, content, deployment, and project-sync procedures.

The wiki is the canonical overview of current behavior and unfinished work. The decision log remains the historical record.

## Content System

All resume and project content lives in `src/data/` as Markdown files with required frontmatter (`id`, `slug`, `title`, `type`, `order`). The build pipeline validates every file against the schema, rejects broken internal links and local media, and fails on violations.

Routine updates are made through a loopback-only authoring server exposed to the owner's devices with Tailscale Serve. It edits the same Markdown, validates changes before accepting them, manages media and GitHub-backed projects, and never enters the public static export.

Follow the [private authoring runbook](docs/RUNBOOK.md#private-authoring-server-recommended) for access, security, and everyday use.

```
src/data/
├── intro/           # Site introduction metadata
├── categories/      # experience.md, skills.md, education.md
├── projects/        # One .md file per project
└── pages/           # contact.md and other page content
```

Use the private authoring workspace to update the profile, resume, projects, contact details, and images. Direct Markdown editing remains available as a maintainer fallback.

## Routes

| Path | Description |
|---|---|
| `/` | Landing page with hero + 3D solar system |
| `/resume` | Full resume with sticky table of contents |
| `/projects` | Filterable project grid |
| `/projects/[slug]` | Individual project case study |
| `/contact` | Contact information |

All routes are pre-generated at build time via static export.

## Key Design Decisions

- **3D as progressive enhancement** — full functionality without WebGL
- **Content-driven navigation** — header nav labels and ordering come from Markdown frontmatter
- **Two-state 3D navigation** — System View (all planets) and Planet View (focused planet + moons) with hash-based deep linking
- **Accessibility baseline** — full keyboard navigation, screen reader support, `prefers-reduced-motion` respected, 44px+ touch targets
- **Cyberpunk aesthetic** — neon glow effects, CRT scanlines, retro pixel font to reflect a game dev background

See the [architecture wiki](wiki/architecture.md) for the current system and [docs/DECISIONS.md](docs/DECISIONS.md) for its full decision history.

## Deployment

Deployed automatically via GitHub Actions on push to `main`. The workflow runs lint, tests, content validation, and the static export before deploying to GitHub Pages. Pull requests run the same quality gate without deploying.

### Environment Variables

Set these in your GitHub repository settings under **Settings > Secrets and variables > Actions**:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin, for example `https://example.com` |
| `NEXT_PUBLIC_BASE_PATH` | Base path for subdirectory deployments (optional) |
