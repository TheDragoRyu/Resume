This repository is **policy-driven**: every change MUST comply with the rules below.

---

## 1) Enforced Stack

### Frontend
- MUST use **Next.js 15 (Static Export)** with `output: 'export'`.
- MUST use **React 19 + TypeScript** (strict mode).
- MUST use **Next.js App Router** for routing (file-based routes under `src/app/`).
- Styling MUST use **Tailwind CSS 4** exclusively. Do not mix with CSS Modules or styled-components.
- MUST ship **semantic HTML**, **SEO-friendly markup**, and **accessible interactions** (keyboard + screen reader support).
- 3D visualization uses **Three.js + React Three Fiber + @react-three/drei**, loaded client-side only.

### Backend
- This is a **100% static site**. DO NOT introduce any server, API routes, SSR, or ISR.
- Contact functionality uses **mailto links** and/or external form services only.

---

## 2) Enforced Repository Structure

```
/
├── src/
│   ├── app/                        # Next.js App Router (route pages ONLY)
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # / (landing)
│   │   ├── resume/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── projects/[slug]/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── not-found.tsx
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/                 # Reusable UI components ONLY
│   │   ├── layout/                 # Header, Footer, Nav, SkipLink
│   │   ├── ui/                     # Button, Card, Tag, etc.
│   │   └── three/                  # All React Three Fiber / 3D components
│   ├── sections/                   # Page section blocks ONLY (no routing)
│   │   ├── landing/
│   │   ├── resume/
│   │   └── projects/
│   ├── content/                    # Content loaders/validators ONLY (no raw data)
│   ├── data/                       # Source-of-truth .md content files ONLY
│   │   ├── intro/
│   │   ├── categories/
│   │   ├── projects/
│   │   └── pages/
│   ├── styles/                     # Global styles + Tailwind config
│   └── utils/                      # Pure utility functions ONLY
├── scripts/                        # Build/CI scripts
├── public/                         # Static assets
├── docs/                           # Architecture decisions + runbooks
│   ├── DECISIONS.md
│   └── RUNBOOK.md
├── wiki/                           # Product and current-state documentation
│   ├── README.md
│   ├── problem-statement.md
│   ├── architecture.md
│   ├── features.md
│   ├── roadmap.md
│   ├── design-pillars.md
│   └── ux-standards.md
├── .github/workflows/deploy.yml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .gitignore
├── .editorconfig
└── README.md
```

### Folder Boundaries (Strict)
- `src/app/` MUST contain **only** route-level pages and layout files.
- `src/components/` MUST contain **only** reusable components (no route logic, no page sections).
- `src/components/three/` MUST contain **all** React Three Fiber / 3D components.
- `src/sections/` MUST contain **only** page section blocks (no routing logic).
- `src/data/` MUST contain **only** the raw Markdown content source-of-truth files.
- `src/content/` MUST contain **only** loader/mapper/validator code that transforms raw content into typed objects.
- `src/utils/` MUST contain **only** pure functions (no React, no side effects).
- `wiki/` MUST contain **only** product, architecture, feature, roadmap, and UX documentation.
- `docs/DECISIONS.md` MUST be updated for any architectural or tooling decision.

---

## 3) Enforced Content Rules (Single Source of Truth)

- All resume/portfolio content MUST live in `src/data/` as **Markdown files**.
- UI MUST render content by reading typed objects produced by `src/content/` loaders.
- No resume/project content may be hardcoded inside React components.
- Content files MUST follow naming:
  - directories: `kebab-case`
  - Markdown files: `kebab-case.md`
- Every Markdown file MUST include frontmatter for at minimum: `id`, `slug`, `title`, `type`, `order`.
- `slug` MUST be unique across the site.
- `id` MUST be unique across the site.
- Projects MUST reference a valid `categoryId`.
- Build MUST fail on invalid/missing frontmatter (enforced by prebuild validation).

---

## 4) Enforced Routing Rules

- Next.js App Router MUST define these routes:
  - `/` (landing / home)
  - `/resume`
  - `/projects`
  - `/projects/[slug]` (dynamic, generated from Markdown)
  - `/contact`
- Route pages MUST NOT parse raw Markdown directly; they MUST use loader outputs from `src/content/`.
- All routes MUST be pre-generated at build time via static export.

---

## 5) Enforced Naming & Style Conventions

- React components MUST be **PascalCase** filenames (e.g., `ProjectCard.tsx`).
- Non-component files MUST be **kebab-case** (e.g., `content-loader.ts`).
- Exported types/interfaces MUST be **PascalCase**.
- Hooks MUST be prefixed with `use` (e.g., `useReducedMotion.ts`).
- Tailwind is the sole styling system. Do not introduce CSS Modules or styled-components.

---

## 6) Enforced Accessibility & SEO

Every page MUST:
- Have exactly one `h1`.
- Use semantic landmarks (`header`, `nav`, `main`, `footer`).
- Ensure all interactive elements are reachable by keyboard.
- Provide accessible names for inputs/buttons.
- Use meaningful `<title>` and `<meta name="description">` (via `generateMetadata`).
- Include Open Graph and Twitter Card meta tags.
- The 3D canvas MUST be `aria-hidden="true"` — it is a visual enhancement, not primary navigation.

---

## 7) Enforced Workflow for AI Changes

1. **Scan the repo first** — reuse existing patterns.
2. **One cohesive change at a time.**
3. **Update `docs/DECISIONS.md`** for architectural/tooling changes.
4. **Self-check:** no hardcoded content, folder boundaries respected, naming conventions followed.

---

## 8) Prohibited Actions (Hard Bans)

- DO NOT introduce a backend, API routes, SSR, or ISR.
- DO NOT mix styling systems (Tailwind only).
- DO NOT place route logic inside `components/` or `sections/`.
- DO NOT hardcode resume/project content in React components.
- DO NOT create additional top-level app directories.
- DO NOT skip content validation in the build pipeline.

---

## 9) Definition of Done for Any Change

- Repo structure remains compliant.
- Content remains single source of truth under `src/data/`.
- Routes render correctly via Next.js App Router.
- `npm run build` succeeds (includes content validation).
- Accessibility rules met for any touched UI.
- `docs/DECISIONS.md` updated when required.
