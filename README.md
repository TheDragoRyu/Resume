# Portfolio Site

A static portfolio and resume website featuring an interactive 3D solar system as a navigation metaphor. Built with Next.js 15, React Three Fiber, and a cyberpunk aesthetic.

Planets represent resume categories (Experience, Skills, Education), moons represent individual projects, and the sun links to contact info. The 3D scene is a progressive enhancement — the full site works without WebGL via conventional navigation.

## Tech Stack

- **Framework:** Next.js 15 (Static Export) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4, Silkscreen pixel font, neon color palette
- **3D:** Three.js + React Three Fiber + @react-three/drei (client-side only)
- **Content:** Markdown with YAML frontmatter, parsed at build time
- **Analytics:** PostHog (12 custom engagement events)
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
| `npm run validate` | Validate all Markdown content schemas |
| `npm run build` | Build the static site (runs validation first) |
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

## Content System

All resume and project content lives in `src/data/` as Markdown files with required frontmatter (`id`, `slug`, `title`, `type`, `order`). The build pipeline validates every file against the schema and fails on violations.

```
src/data/
├── intro/           # Site introduction metadata
├── categories/      # experience.md, skills.md, education.md
├── projects/        # One .md file per project
└── pages/           # contact.md and other page content
```

To add a project, create a new `.md` file in `src/data/projects/` with valid frontmatter and a `categoryId` referencing an existing category.

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

See [docs/DECISIONS.md](docs/DECISIONS.md) for the full architectural decision log.

## Deployment

Deployed automatically via GitHub Actions on push to `main`. The workflow runs content validation, builds the static export, and deploys to GitHub Pages.

### Environment Variables

Set these in your GitHub repository settings under **Settings > Secrets and variables > Actions**:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for OpenGraph meta tags |
| `NEXT_PUBLIC_BASE_PATH` | Base path for subdirectory deployments (optional) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog instance URL |
