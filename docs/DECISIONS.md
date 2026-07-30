# Architecture Decisions

## 2026-03-03: Initial Stack Selection

**Decision:** Use Next.js 15 (Static Export) + Tailwind CSS 4 + React Three Fiber instead of React Router + CSS Modules.

**Rationale:**
- Next.js App Router provides file-based routing, built-in metadata API, and static export (`output: 'export'`) for GitHub Pages.
- Tailwind CSS 4 offers utility-first styling with zero-runtime CSS, better DX than CSS Modules for a solo project.
- React Three Fiber wraps Three.js with React's component model, making 3D scene management declarative.
- Static export ensures the entire site is pre-rendered HTML — no server needed.

**Trade-offs:**
- Next.js adds build complexity vs. plain Vite + React Router.
- Tailwind requires learning utility classes but eliminates naming bikeshedding.
- R3F/Three.js adds ~150KB gzipped to the client bundle but is loaded lazily (dynamic import, ssr: false).

## 2026-03-03: Content Architecture

**Decision:** Markdown files with frontmatter as single source of truth, parsed at build time by gray-matter + remark.

**Rationale:**
- Markdown is human-readable, version-controllable, and easily editable.
- Frontmatter provides structured metadata (id, slug, title, type, order, orbit data) without a separate database.
- Build-time parsing means zero runtime overhead — content becomes static props.
- Prebuild validation script catches errors before they reach production.

## 2026-03-03: 3D as Progressive Enhancement

**Decision:** The WebGL solar system is a visual enhancement layer, never a navigation requirement.

**Rationale:**
- Follows Pillar 1 (Utility First, Magic Second) from the [design pillars](../wiki/design-pillars.md).
- 3D is loaded via `dynamic(() => import(...), { ssr: false })` — static HTML renders first.
- Canvas is `aria-hidden="true"` — screen readers skip it entirely.
- WebGL unavailability shows a fallback gradient; all navigation remains functional.
- `prefers-reduced-motion` freezes orbits and uses instant camera transitions.

## 2026-03-03: Content-Driven Sub-Navigation (Pillar 3)

**Decision:** Header nav items for Resume and Projects now expose sub-destinations (resume categories and individual projects) via dropdown menus, driven by content data loaded at build time.

**Rationale:**
- Design Pillar 3 requires the overlay to offer identical destinations to the 3D scene.
- The 3D scene exposes 3 resume categories as planets and individual projects as moons, but the header only had flat links.
- `getNavData()` in content-loader maps existing categories and projects to `NavSubItem[]` at build time.
- Layout passes this data as a serializable prop to the Header component.
- Desktop uses hover-activated dropdowns; mobile uses chevron-toggled accordions.
- Parent items remain clickable links to `/resume` and `/projects`.

**Trade-offs:**
- Layout becomes an async Server Component — safe for static export since it only runs at build time.
- Slightly more complex Header component, but all sub-items are content-driven (no hardcoding).

## 2026-03-03: Always-Visible 3D Labels (Pillar 4)

**Decision:** 3D scene labels for planets, moons, and the sun are now always visible, with a two-tier visual treatment (subtle default, prominent on hover/select).

**Rationale:**
- Design Pillar 4 requires labels to always be visible, not just on hover/select.
- Default state uses small, low-opacity text (`text-[10px] text-gray-400/70` for planets/sun, `text-[9px] text-gray-500/60` for moons) to provide identification without visual clutter.
- Hover/select state uses the existing prominent treatment (background panel, full white, shadow).
- Moon labels are intentionally smaller to maintain planet > moon visual hierarchy.
- Sun now uses an `Html` label instead of the previous inert transparent sprite.

## 2026-03-03: UX Standards Compliance Fixes

**Decision:** Five changes to align the implementation with the [UX standards](../wiki/ux-standards.md), filtered through the [design pillars](../wiki/design-pillars.md).

**Changes:**

1. **@tailwindcss/typography installed** (Pillar 8). The `prose` classes used in CategorySection, CaseStudyBody, and ContactPage had no effect without this plugin. Added via `@plugin` directive in globals.css per Tailwind v4 conventions.

2. **Breadcrumb component added** (Pillar 5). Created `src/components/ui/Breadcrumb.tsx` and added to `/resume`, `/projects`, `/projects/[slug]`, and `/contact`. Removed the duplicate "← Back to Projects" link from CaseStudyBody since the breadcrumb replaces it.

3. **Mobile TOC for resume** (Pillars 8 & 9). Created `src/sections/resume/ResumeTocMobile.tsx` — a collapsible "Jump to section" panel shown below `lg` breakpoint. The desktop sticky sidebar TOC remains unchanged.

4. **Sun "Click to open" tooltip** (Pillar 4). Added the same hover subtext that planets already had to the Sun component, eliminating a "Where do I click?" gap.

5. **Performance mode toggle** (Pillar 9). Created `src/components/three/helpers/usePerformanceMode.ts` with localStorage persistence. Toggle button appears in the 3D scene overlay. When enabled, freezes orbit motion (same as `reducedMotion`).

**Rationale:**
- Items were filtered against the north star: only violations of explicit pillar requirements were fixed.
- Dropped items (mobile 3D interaction, hit colliders, onboarding pulse, tag filtering) were deferred as delight-layer polish or optional UX enhancements that don't violate the pillars.

## 2026-03-03: Cyberpunk Space Theme Restyle

**Decision:** Restyle the entire portfolio from a clean dark theme (Inter font, indigo accents) to a cyberpunk space aesthetic (Silkscreen pixel font, neon cyan/pink/green palette) to emphasize the user's game development career.

**Changes:**

1. **Font:** Replaced Inter/JetBrains Mono with Silkscreen (8-bit pixel font via `next/font/google`, weights 400/700). Both `sans` and `mono` font families map to Silkscreen with `Courier New` fallback.

2. **Color palette:** Replaced indigo accent (`#6366f1`) with neon cyan (`#00fff0`). Added neon pink (`#ff00ff`) and neon green (`#39ff14`). Darkened surface colors for deeper space feel (`#0a0a12` base). Body text shifted to `text-cyan-100`.

3. **CSS effects:** Added `.text-glow-cyan/pink/green` (neon text-shadow), `.border-glow-cyan/pink` (neon box-shadow), `.scanlines` (CRT scanline overlay), `.crt-vignette` (radial edge darkening), `.glitch-text` (hover jitter animation). All effects disabled under `prefers-reduced-motion`.

4. **3D scene:** Added `Starfield.tsx` component (~1500 colored particles: cyan/pink/green/white). Updated orbit colors in data files to neon variants. Increased emissive intensity across Sun (0.8→1.2), Planet (0.15→0.3), Moon (0.1→0.25). Orbit line opacity increased (0.15→0.25). Ambient light reduced (0.2→0.15) for higher contrast.

5. **Component restyling:** All layout, section, and UI components updated to use new palette. Featured badges use neon pink, CTAs use neon pink/cyan, headers have `text-glow-cyan`, borders use `border-accent/20`.

**Rationale:**
- A cyberpunk pixel aesthetic better represents a game developer's identity than a generic corporate dark theme.
- Silkscreen evokes retro gaming while remaining readable at UI sizes.
- Neon glow effects create visual depth without compromising accessibility (cyan on dark surface ≈ 15.5:1 contrast ratio, WCAG AAA).
- All effects are progressive enhancements — disabled under `prefers-reduced-motion`.

**Trade-offs:**
- Silkscreen is less readable than Inter for dense body text, but acceptable for a portfolio with short content blocks.
- CRT/scanline overlays add fixed-position pseudo-elements, but use `pointer-events: none` and are purely decorative.
- Starfield adds ~1500 particles to the 3D scene but uses a single `<points>` geometry for minimal draw calls.

## 2026-03-04: Design Pillars Audit — Compliance Fixes

**Decision:** Fix 12 violations found during an audit against the [design pillars](../wiki/design-pillars.md), covering Pillars 2, 7, 8, and 9.

**Changes:**

1. **Touch targets ≥44px (Pillar 9).** Added `min-h-[44px] min-w-[44px]` to icon-only buttons (Header mobile menu, chevron toggle, ContextPanel close) and `min-h-[44px]` to text buttons (ContextPanel primary/back, SceneCanvas back/performance, HeroSection CTAs). Changed mobile nav link padding from `py-2` → `py-3` and sub-nav from `py-1.5` → `py-2.5`.

2. **Landing page metadata (Pillar 8).** Added `generateMetadata` to `src/app/page.tsx` that reads intro frontmatter to produce page-specific `<title>` and `<meta description>`.

3. **Desktop dropdown arrow key navigation (Pillar 7).** Added `onKeyDown` handler to `DesktopDropdown` supporting `ArrowDown`, `ArrowUp`, `Home`, `End`, and `Escape` with roving tabindex on dropdown links. Dropdown items now have `role="menu"` / `role="menuitem"`.

4. **3D canvas gated by media query (Pillar 9).** `SolarSystemSection` now uses a `useMediaQuery('(min-width: 768px)')` hook. On mobile, the component returns `null` instead of mounting a hidden WebGL context.

5. **Content-driven nav labels (Pillar 2).** Extended `NavData` with `siteTitle` (from intro frontmatter) and `contactLabel` (from contact page frontmatter). Header brand text and contact nav label are now content-driven. Footer accepts `siteTitle` as a prop.

6. **Footer rendered in layout.** Imported `Footer` in `layout.tsx` and rendered it after `<main>`, passing `navData.siteTitle`.

7. **Removed hardcoded fallback email (Pillar 2).** Contact page now uses `getPageOrThrow('contact')` instead of a fallback branch with `hello@example.com`. Build fails if the contact page is missing.

8. **Hero CTA touch targets (Pillar 9).** Added `min-h-[44px]` to all three HeroSection CTA buttons.

**Rationale:**
- Each fix addresses a specific, measurable violation of the design pillars.
- Touch target fixes follow WCAG 2.5.5 (≥44×44px).
- Arrow key navigation follows WAI-ARIA Menu pattern.
- Media query guard prevents unnecessary WebGL context on mobile, saving memory and GPU.

## 2026-03-03: 2-State Solar System Navigation

**Decision:** Implement two explicit camera/UI states — System View (Sun + Planets) and Planet View (focused Planet + its Moons) — using a `useReducer` state machine with hash-based deep linking.

**Changes:**

1. **State machine (`useSceneNavigation`):** Discriminated union types (`SystemViewState` / `PlanetViewState`) with a reducer handling `SELECT_NODE`, `EXPLORE_PLANET`, `BACK_TO_SYSTEM`, `CLOSE_PANEL`, and `SYNC_HASH` actions. This replaces the previous flat `useState<SceneNode | null>`.

2. **CameraControls replacing OrbitControls:** drei's `CameraControls` (backed by the `camera-controls` library) replaces `OrbitControls` to enable animated `setLookAt` transitions between system overview and planet close-up positions. Transitions respect `prefers-reduced-motion` (instant jump when enabled).

3. **Hash-based deep linking:** URL hash `#planet/<slug>` encodes planet view state. Supports browser back/forward via `popstate` listener. Compatible with static export (no server-side routing needed).

4. **Conditional rendering by view mode:** In Planet View, sibling planets remain mounted but only the focused planet is rendered. Sun is hidden. Moons are only rendered when their parent planet is focused. This keeps the scene clean and camera-focused.

5. **Dynamic ContextPanel actions:** Panel primary button shows "Explore" for planets in System View (triggers zoom-in) and "Open" for navigation in Planet View. Optional "Back to System" secondary button appears in Planet View.

**Rationale:**
- The solar system metaphor (planets = categories, moons = projects) requires spatial hierarchy — users should "enter" a planet to discover its projects.
- A flat view showing all objects simultaneously dilutes the metaphor and creates visual clutter.
- Hash-based state preserves static export compatibility while enabling shareable deep links.
- `useReducer` with discriminated unions provides type-safe, predictable state transitions.

**Trade-offs:**
- `CameraControls` adds the `camera-controls` library (already a transitive dep of drei, ~8KB gzipped).
- Hash-based routing is simpler than URL path routing but less SEO-friendly (acceptable since 3D scene is `aria-hidden` and not indexed).
- Focused planet freezes its orbit to provide a stable camera target — slight departure from the "living system" feel, but necessary for usability.

## 2026-03-04: UX Audit — 26-Gap Fix

**Decision:** Address all 26 gaps found during a project-wide audit against the [UX standards](../wiki/ux-standards.md).

**Changes:**

1. **Mobile 3D support (Gap 1).** Removed desktop-only gate from `SolarSystemSection`. 3D scene renders at all viewports (`h-[50vh] md:h-[70vh]`). On mobile, tap-select flow shows ContextPanel with "Explore" button instead of auto-zooming into planets.

2. **Invisible hit colliders (Gap 2).** Added transparent `<mesh>` with `visible={false}` material and enlarged sphere (`Math.max(size * 1.5, 0.8)`) to Planet, Moon, and Sun. Pointer handlers moved to hit mesh; visible mesh is now inert.

3. **Keyboard access to 3D (Gap 3).** New `SceneKeyboardNav` component — a DOM overlay with a `listbox` of scene nodes. Uses roving tabindex with arrow keys. Visually hidden (`sr-only`) until focused, then appears as a floating panel. `aria-hidden="true"` moved from `<section>` to `<Canvas>` so overlay remains accessible.

4. **Tag filtering on /projects (Gap 4).** New `ProjectFilterGrid` client component with tag toggle buttons, clear-all, and filtered grid with empty state message.

5. **ContextPanel focus trap (Gap 5).** Added `aria-modal="true"` and Tab/Shift+Tab wrapping `useEffect` that also handles Escape.

6. **Focus rings on overlay buttons (Gap 6).** Added `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2` to all buttons in ContextPanel and SceneCanvas.

7. **Onboarding pulse + hint (Gap 7).** New `useOnboardingHint` hook (sessionStorage-backed). Planet index 0 and 1 oscillate emissive intensity via sine wave in `useFrame`. Dismissible text hint overlay in SceneCanvas.

8. **"Explore" label in System View (Gap 8).** `getPrimaryAction` returns `'Explore'` for planets with moons in system view.

9. **Contact in Sun node (Gap 9).** ContextPanel gains `secondaryAction` prop. SceneCanvas passes `{ label: 'Contact', handler: router.push('/contact') }` when sun is selected. Sun description appended with contact prompt.

10. **Resume H1 (Gap 10).** Changed `<h1>` from name to "Resume", name demoted to `<p>` subheading.

11. **Heading hierarchy (Gap 11).** ProjectCard `<h3>` → `<h2>`.

12. **OG images (Gap 12).** Created `public/og-default.png` (1200×630). Added `images` to openGraph in layout.tsx and project [slug] page.

13. **useMediaQuery SSR flash (Gap 13).** Changed initial state from `false` to `null`. Return type `boolean | null`. SolarSystemSection shows height-matched placeholder when `null`.

14. **WebGL fallback nav (Gap 14).** Replaced bare text fallback with a nav card grid linking to all planet destinations.

15. **Description contrast (Gap 15).** `text-cyan-100/50` → `text-cyan-100/70` in ProjectCard and ContextPanel.

16. **Loading feedback (Gap 16).** ContextPanel shows spinner + disabled button when `navigating` prop is true and label is "Open".

17. **Performance mode particle reduction (Gap 17).** Starfield uses `Math.min(500, count)` when `performanceMode` is active.

18. **Cross-links from resume to projects (Gap 18).** Added markdown links in `experience.md` referencing project slugs.

19. **Active TOC state (Gap 19).** ResumeToc uses `IntersectionObserver` to track visible sections and highlight the active link with `text-accent font-semibold`.

20. **useSquashStretch reduced motion (Gap 20).** Added `reducedMotion` option. When true, skips all animation in `useFrame` and resets scale to 1.

21. **Opacity fade on ContextPanel (Gap 21).** Panel mounts with `opacity-0`, transitions to `opacity-100` via `requestAnimationFrame` + state flip.

22. **404 H1 (Gap 22).** "404" made decorative `<p aria-hidden>`, added `<h1>Page Not Found</h1>`.

23. **Contact metadata (Gap 23).** Expanded description to a proper sentence.

24. **Tooltip text (Gap 24).** Already correct — no change needed.

25. **Breadcrumb in 3D overlay (Gap 25).** Replaced "← Back to System" button with `System ▸ {planet.label}` breadcrumb nav where "System" is clickable.

26. **ResumeToc 'use client' (Gap 26).** Resolved by Gap 19 (IntersectionObserver requires client).

**New files:**
- `src/components/three/SceneKeyboardNav.tsx`
- `src/components/three/helpers/useOnboardingHint.ts`
- `src/sections/projects/ProjectFilterGrid.tsx`
- `public/og-default.png`

**Rationale:**
- Each gap maps to a specific UX standard or accessibility requirement.
- Mobile 3D ensures the hero section is not empty on phones (~60% of traffic).
- Hit colliders solve the precision problem of clicking small 3D spheres.
- Keyboard nav and focus traps meet WCAG 2.1 AA requirements.
- Tag filtering and active TOC improve content discoverability.

**Trade-offs:**
- Mobile 3D uses a tap-then-action pattern (tap to select, then tap "Explore"/"Open") which adds one extra interaction step but avoids accidental navigation.
- Hit colliders add invisible geometry; performance impact is negligible (simple transparent spheres).
- `sessionStorage` for onboarding hint means hint reappears per tab — acceptable for a portfolio site.

## 2026-03-07: PostHog Cloud Analytics

**Decision:** Add PostHog Cloud (client-side JS SDK) for pageview and interaction tracking.

**Changes:**

1. **`posthog-js` installed** as a runtime dependency.
2. **`src/components/PostHogProvider.tsx`** — a `'use client'` component that initializes PostHog and captures `$pageview` on every App Router route change via `usePathname` + `useSearchParams`. Wrapped in `<Suspense>` to avoid SSR issues.
3. **Root layout (`layout.tsx`)** wraps the app body with `<PostHogProvider>`.
4. **Environment variables** (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`) stored in `.env.local` (gitignored) and must be set in the deployment platform.

**Rationale:**
- PostHog Cloud is free-tier friendly, privacy-conscious, and requires no backend — compatible with the static export constraint.
- Client-side only; no SSR or API routes introduced.
- Manual `$pageview` capture (with `capture_pageview: false`) ensures accurate tracking for SPA-style client navigation.
- `capture_pageleave: true` provides session duration insights.
- Provider gracefully no-ops when the env var is missing (e.g., local dev without keys).

**Trade-offs:**
- Adds ~30KB gzipped to the client bundle (posthog-js).
- Relies on a third-party service; if PostHog is unreachable, events are silently dropped (no user impact).

## 2026-03-07: PostHog Custom Engagement Events

**Decision:** Add custom PostHog events across all major interaction surfaces to measure whether visitors understand and engage with the resume site.

**Events:**

1. **`hero_cta_clicked`** (`destination`) — Which entry point visitors choose from the landing page.
2. **`resume_section_viewed`** (`section`) — Which resume sections are scrolled into view (fires once per section per session via IntersectionObserver).
3. **`resume_toc_clicked`** (`section`, `device`) — Active navigation to a resume section via TOC (desktop or mobile).
4. **`project_tag_toggled`** (`tag`, `action`, `active_count`) — Tag filter add/remove on the projects page.
5. **`project_tags_cleared`** (`previous_count`) — Clear all tag filters.
6. **`project_card_clicked`** (`project`, `featured`) — Which project a visitor clicks into.
7. **`project_link_clicked`** (`project`, `link_type`) — External link clicks (GitHub, demo, write-up) on project detail pages.
8. **`scene_node_selected`** (`node`, `type`, `mode`) — Clicking any object in the 3D scene.
9. **`scene_planet_explored`** (`planet`) — Zooming into a planet (category) in the 3D view.
10. **`scene_back_to_system`** — Returning to the system overview from planet view.
11. **`scene_panel_action`** (`node`, `action`, `route`) — Taking action from the ContextPanel (open, explore, contact).
12. **`scene_hint_dismissed`** — Dismissing the onboarding hint ("Got it").

**Implementation:**
- Server components use a reusable `TrackClick` client component (`src/components/ui/TrackClick.tsx`) that wraps children and captures on click.
- Client components call `posthog.capture()` directly at the interaction point.
- Resume section tracking uses a `Set` ref to fire only once per section per page load.

**Rationale:**
- Events are designed to answer: "Do visitors find what they're looking for?" and "Do they understand the 3D navigation metaphor?"
- Funnel analysis: hero CTA → page view → section/project engagement → external link click.
- 3D scene events reveal whether the solar system metaphor aids or hinders navigation.

## 2026-03-07: GitHub-to-Markdown Project Content Pipeline

**Decision:** Automate project content generation from GitHub repos via a two-stage pipeline: fetch metadata, then generate case-study Markdown.

**Architecture:**

```
featured-repos.json  (config)
        |
        v
sync-github-projects.ts   <-- GitHub REST API
        |
        v
.project-cache.json        (gitignored intermediate)
        |
        v
generate-project-content.ts  <-- claude CLI
        |
        v
src/data/projects/*.md      (committed source of truth)
```

**Key decisions:**

1. **Two-stage split:** Separating fetch from generation allows re-running Claude without re-fetching, inspecting cached data before generating, and independent debugging of each stage.

2. **Native `fetch` over `gh` CLI or `octokit`:** Node 20's built-in `fetch` avoids adding dependencies. The `gh` CLI would require installation and auth setup beyond a simple token. `octokit` would add a dependency for 3 API calls.

3. **Claude CLI for generation:** Invokes `claude -p --model sonnet` via `child_process.execFile`. Constrained system prompt produces exactly 4 sections (Problem, Approach, Results, Tech Stack). Frontmatter is assembled deterministically — only the body text uses AI.

4. **Gitignored cache, committed `.md` output:** The cache is ephemeral (regenerated on demand). The Markdown files are the committed source of truth, reviewed before committing.

5. **Orbit fields intentionally omitted:** Generated frontmatter does not include `orbit` metadata. `resolveOrbit()` in `scene-data-builder.ts` assigns smart defaults based on index, so generated projects integrate into the 3D scene without manual orbit tuning.

6. **Idempotent by default:** Existing `.md` files are skipped unless `--force` or `--force=<slug>` is passed, protecting manually authored content.

**Trade-offs:**
- Claude CLI must be installed for generation (fetch works standalone).
- Unauthenticated GitHub API is limited to 60 req/hr (sufficient for small repo sets; `GITHUB_TOKEN` raises this to 5000).
- Generated content requires human review before committing.

## 2026-07-27: Consolidated Project Wiki

**Decision:** Add a top-level `wiki/` as the canonical guide to the product problem, current architecture, shipped visitor experience, product standards, and unfinished work.

**Changes:**

- Added a wiki index plus dedicated problem-statement, architecture, feature, and roadmap pages.
- Moved the existing design pillars and UX standards from the repository root into the wiki.
- Extended the repository policy to define the new wiki boundary and its allowed document types.
- Kept `docs/DECISIONS.md` and `docs/RUNBOOK.md` in `docs/` to preserve the repository's policy-defined history and operations boundary.
- Linked the README, wiki, decision log, and runbook instead of duplicating their responsibilities.

**Rationale:**

- Product and implementation knowledge was distributed across root documents, source code, and the chronological decision log.
- A current-state wiki makes shipped behavior and open work easier to find without rewriting historical decisions.
- Explicit status language prevents deferred-but-completed work from being mistaken for an active backlog.

**Trade-offs:**

- Maintainers must update the feature and architecture pages when behavior changes.
- The wiki summarizes the system while the decision log remains authoritative for historical rationale.

## 2026-07-27: Git-Backed Visual Content and Media Editor

**Decision:** Configure Pages CMS as an external, GitHub-authenticated editing layer over the existing Markdown content and repository-hosted media.

**Changes:**

- Added a root `.pages.yml` that maps Profile, Resume sections, Projects, Contact, and Site images to structured forms.
- Enabled rich-text Markdown editing and image uploads under `public/images`.
- Preserved unexposed technical frontmatter with merge-on-save behavior and protected fixed files from destructive editor operations.
- Added optional project cover-image and alternative-text fields, rendered on project cards and case-study pages and reused in project Open Graph metadata.
- Removed the known-broken profile-photo reference; a valid profile photo can now be uploaded from the editor.
- Extended content validation for kebab-case IDs/slugs, non-negative integer ordering, safe local image paths and extensions, file existence, and project-image alt text.
- Hardened forced GitHub-project regeneration so editor-managed cover media is preserved and invalid output restores the previous file instead of deleting it.

**Security model:**

- GitHub/Pages CMS handles authentication; no credentials, admin bundle, content API, or secret are included in the static export.
- The runbook requires installing the GitHub App for this repository only and recommends GitHub two-factor authentication.
- Uploads are constrained to AVIF, JPEG, PNG, and WebP under one public directory; executable SVG uploads are not accepted.
- Saves remain attributable Git commits, build validation gates deployment, and Git history provides recovery.

**Rationale:**

- An embedded admin page would still require an OAuth service or secret-bearing backend, which violates the static-only architecture.
- A Git-backed editor leaves `src/data/` as the single source of truth and preserves the existing GitHub Pages deployment flow.
- Forms and a media manager remove the need to find and edit individual Markdown files for routine updates.

**Trade-offs:**

- The hosted editor is a third-party service with repository write access; access should remain repository-scoped and be revoked when unused.
- Saves target the selected Git branch directly. Invalid edits can create a failed workflow, although the previous successful deployment remains live.
- The visual schema must be updated when user-facing frontmatter fields change.
- Links and images embedded directly inside rich Markdown bodies are not yet included in local-asset validation.

## 2026-07-27: Structured Contact Editing

**Decision:** Model the Contact page's visual content as typed frontmatter and expose matching nested fields in Pages CMS.

**Changes:**

- Replaced the Contact page's layout-dependent Markdown body with explicit introduction, email, social-link, and location fields.
- Added a typed Contact loader and used its content for rendering, navigation, and page metadata.
- Added build-time validation for required Contact fields, the email address, HTTPS social URLs, and an empty Markdown body.
- Replaced the generic Contact rich-text field in `.pages.yml` with nested object and list controls that correspond to the visual cards.

**Rationale:**

- Editors can update a specific visible detail without needing to preserve a hidden Markdown heading and list structure.
- The typed schema keeps Pages CMS, the content source, and the rendered design synchronized while retaining `src/data/` as the source of truth.

**Trade-offs:**

- Adding another Contact card or field now requires coordinated schema, CMS configuration, validation, and component changes.
- The Contact page no longer supports arbitrary rich-text body content; this intentionally protects the designed layout from structural drift.

## 2026-07-27: Resume-First Planet Actions

**Decision:** Keep each planet's mapped Resume section as its primary destination and make exploration of associated project moons an explicit secondary action.

**Changes:**

- Desktop, mobile, and keyboard planet selection now opens the same context panel instead of automatically entering focused planet view.
- Planet panels use **Open Resume Section** as the primary action and navigate to the planet's `/resume#section` route.
- Planets with projects expose **Explore N Projects** as a separate secondary action; moons use **Open Project**.
- Updated the first-session hint to describe the Resume-section relationship.

**Rationale:**

- Resume categories such as Experience describe the candidate's history, while projects are separate supporting artifacts.
- The action hierarchy now matches the documented sun/planet/moon information architecture and removes the misleading implication that Experience means Projects.

**Trade-offs:**

- Desktop visitors now confirm a context-panel action instead of auto-zooming when they select a planet.
- Project moons remain readily available, but their exploration is intentionally subordinate to the planet's Resume destination.

## 2026-07-27: Dedicated Projects Planet

**Decision:** Represent Projects as its own content-driven planet, separate from the planets that represent Resume sections.

**Changes:**

- Added a structured Projects page record that supplies the `/projects` title, metadata, introduction, planet label, description, and orbit settings.
- Kept Experience, Skills, and Education as moon-free Resume planets whose primary routes remain `/resume#section`.
- Moved every project moon beneath the dedicated Projects planet and made `/projects` that planet's primary destination.
- Added semantic scene destinations so planets with the same visual type can expose different routes and action labels.
- Added Projects page controls to Pages CMS plus matching typed loading and build validation.

**Rationale:**

- Work history and project case studies are separate information categories and should not share a planet identity.
- A one-to-one Projects destination removes the implication that selecting Experience means selecting Projects while retaining optional 3D case-study exploration.

**Trade-offs:**

- The system view gains another outer planet, increasing scene density slightly.
- Project `categoryId` remains required for content taxonomy even though it no longer determines a moon's visual parent.
- This decision supersedes the project-parenting portion of **Resume-First Planet Actions** while preserving its select-then-confirm interaction model.

## 2026-07-28: Deployment-Safe Content URLs and Quality Gates

**Decision:** Use one idempotent site-URL resolver for content and generated public URLs, validate Markdown references before export, and gate pull requests and deployments with ESLint, Vitest, content validation, and the static build.

**Changes:**

- Root-relative Markdown links and images receive the configured base path during rendering; source Markdown never embeds the deployment prefix.
- Validation builds a route index from fixed routes, generated project slugs, and Resume anchors, and rejects unresolved internal links or missing local media.
- Metadata, Open Graph images, sitemap, robots, and structured content assets use the same normalized site-origin/base-path contract.
- ESLint 9 and Vitest 4 cover URL handling, content mapping and validation, scene construction, route generation, filtering, and keyboard/focus behavior.
- GitHub Actions uses Node.js 22, runs the aggregate quality command for pull requests and deployable revisions, and deploys only a successful static artifact.

**Rationale:**

- Raw HTML produced from Markdown does not receive Next.js Link base-path handling automatically.
- A shared URL contract prevents local and GitHub Pages behavior from drifting.
- Source validation catches content failures earlier than a manual deployed-site review.
- Focused tests protect build-time projections and critical client interactions before future feature work.

**Trade-offs:**

- Internal Markdown links must use the documented root-relative convention.
- External HTTP availability is not checked during builds, avoiding flaky network-dependent validation.
- The additional development dependencies and test execution increase installation and CI time.

## 2026-07-28: Production Analytics Disabled

**Decision:** Remove PostHog and ship the production portfolio without analytics or interaction tracking. This supersedes the March 7 PostHog decisions while preserving them as history.

**Changes:**

- Removed the PostHog provider, SDK dependency, click wrapper, pageview capture, and custom event calls.
- Removed analytics environment variables and analytics promises from current-state documentation.
- Preserved navigation, project filtering, Resume observation, and 3D interaction behavior independently of telemetry.

**Rationale:**

- Production analytics was not configured in the deployment workflow.
- The site does not currently require behavioral telemetry to deliver its portfolio and resume goals.
- Removing the unused runtime dependency reduces third-party code and eliminates an unresolved production configuration obligation.

**Trade-offs:**

- Visitor funnels and interaction usage are no longer measurable.
- Reintroducing analytics requires a new explicit product and architecture decision.

## 2026-07-28: Local-Only GitHub Project Selection

**Decision:** Configure GitHub-backed portfolio and featured projects through an authenticated local terminal selector. Repository inventory and selection state must not be exposed through the deployed static site or committed configuration.

**Changes:**

- Added `npm run sync:configure`, which uses the authenticated `GET /user/repos` endpoint with pagination.
- GitHub CLI authentication is preferred; `GITHUB_TOKEN` is accepted only from the process environment. The scripts never persist or print a token.
- Private repository names are filtered before display and storage. Only public repositories can be selected, and the fetch stage independently refuses private repositories.
- Replaced committed repository selection with `.featured-repos.local.json`, a gitignored, atomically written mode-`0600` file. The intermediate cache receives the same local protection.
- The selector updates `featured` in existing project Markdown, clears it for deselected repositories, and preserves local overrides for retained selections.
- Kept an empty committed example file for schema discovery without revealing an account's selected repositories.

**Rationale:**

- The portfolio is a static export; putting a GitHub token or private repository picker in browser code would expose the credential or require a forbidden backend.
- The GitHub repository endpoint returns data according to the authenticated user's access. Filtering before display/storage prevents the unselected private inventory from entering logs, configuration, cache, content, or the client bundle.
- Generated Markdown remains the reviewed public source of truth, so CI and deployment do not need GitHub account access.

**Trade-offs:**

- Configuration is intentionally per-machine and must be recreated through the selector on a new workstation.
- Only public repositories can use automated GitHub-backed generation. A private project requires a separately reviewed, sanitized case study.
- A featured public repository is necessarily visible in committed Markdown and on the deployed portfolio.
- Gitignore prevents future disclosure but does not erase repository names already present in Git history; history rewriting is a separate destructive operation.

## 2026-07-28: Tailscale-Private Unified Authoring Server

**Decision:** Replace Pages CMS and the terminal-only GitHub selector with one local authoring server exposed through tailnet-only Tailscale Serve. This supersedes the Pages CMS decisions and the earlier Local-Only GitHub Project Selection interface while retaining the static production architecture.

**Changes:**

- Removed `.pages.yml` and the interactive repository-selection CLI.
- Added a loopback-only Node authoring server, a Tailwind browser workspace, a hardened persistent user service, and a dedicated Tailscale Serve endpoint.
- Authorized requests through Tailscale Serve's stripped-and-injected identity header with an exact user allowlist. Mutations also require an exact HTTPS origin, JSON content type, and per-process CSRF token.
- Added no-store repository inventory, public-only selection/feature controls, ordering, overrides, and fixed fetch/generate/check jobs. Private repositories are visible only to the authorized owner and are rejected from publication server-side.
- Added editing for every Markdown content document, validated project creation, recoverable project deletion, and signature-checked image uploads.
- Made every content write transactional: global validation failure restores the previous file.

**Rationale:**

- Remote browser access over the tailnet removes the need to SSH for routine portfolio operations without exposing GitHub credentials, repository inventory, or authoring APIs to the public internet.
- Tailscale Serve supplies encrypted tailnet transport, ACL enforcement, HTTPS, and authenticated identity headers while the backend remains inaccessible from the LAN or tailnet directly.
- One repository-native authoring surface can preserve the full Markdown schema—including nested frontmatter and 3D orbit settings—without maintaining an external CMS application or GitHub App grant.
- Keeping authoring separate from Next.js preserves static export, content review, and GitHub Pages deployment.

**Trade-offs:**

- Dungeon and its user service must be online for browser authoring.
- Initial Tailscale Serve operator setup requires one privileged machine command.
- The frontmatter editor favors complete schema flexibility over type-specific visual forms.
- Local authoring changes still require review and a Git commit before deployment.
- Other processes running as the same OS user remain inside the trust boundary, consistent with Tailscale's guidance for identity-header backends bound to localhost.

## 2026-07-30: Project Slug Containment and Sandboxed Generation

**Decision:** Centralize project slug validation and project Markdown path construction in one module, and run the AI generation worker with an explicit environment allowlist, an empty temporary home, and no tools. This closes the two High findings from the 2026-07-29 security audit without changing the static production architecture or the Claude CLI dependency.

**Changes:**

- Added `scripts/project-paths.ts` as the single source of truth for slug syntax and `src/data/projects` path resolution. It rejects non-strings, empty and over-long names, NUL bytes, path separators, percent-encoded separators, dot segments, absolute paths, and anything that is not kebab-case; it then requires the resolved parent to be exactly the projects directory.
- Routed every writer through it: the authoring API normalizer, `validateFeaturedReposConfig`, the selection updater, the content store's project creation, and the generator. Symbolic links and non-regular files are rejected for existing and newly targeted files, and writes are atomic temp-plus-rename so a link is replaced rather than followed.
- Split the featured-flag update into `planFeaturedFlagUpdates` and `commitFeaturedFlagUpdates`. `saveProjectConfiguration` resolves every destination and computes every new file body before `.featured-repos.local.json` is rewritten, and restores already-written Markdown if a later write fails. The configuration itself is rolled back with it — restored from the previous selection, or removed when the failed save was the first one — so configuration and content never disagree.
- Made `.featured-repos.local.json` and the example config path resolve at call time instead of module load, so the save path can be exercised against a fixture tree.
- Moved the subprocess boundary into `scripts/generation-worker.ts` so it can be reviewed independently of content derivation: the sandbox, the environment allowlist, the CLI arguments, the trusted system prompt, and the stream protocol all live there.
- Replaced `{ ...process.env }` for the generation subprocess with `GENERATION_ENV_ALLOWLIST`. The environment is built up from that list, so GitHub, Tailscale, service-origin, and unrelated credentials cannot reach the worker. `HOME` and `CLAUDE_CONFIG_DIR` are set to a fresh mode-`0700` temporary sandbox and the working directory is an empty temporary directory.
- Disabled all tool access at the call site with `--tools ""`, `--setting-sources ""`, `--strict-mcp-config`, `--disable-slash-commands`, and `--no-session-persistence`, then made the script parse the CLI's session-init report and fail closed unless the worker confirms zero tools, zero MCP servers, and zero slash commands.
- Registered `SIGINT`, `SIGTERM`, `SIGHUP`, and exit handlers that remove every sandbox actually created, so an interrupted run does not leave the copied Claude credential under the OS temp root. The handlers still exit with `128 + signal`, so the signal is honoured rather than swallowed.
- Contained per-target generation failures: reading existing frontmatter, building the document, writing it, and validating it now fail one repository instead of aborting the run, matching the existing model/CLI failure path. The scalar type checks themselves are unchanged and still reject the bad value.
- Serialized generated frontmatter with `gray-matter` instead of string interpolation, type-checked and bounded every scalar, and required project links to be absolute HTTP or HTTPS URLs.
- Added regression tests at each sink: slug and path unit tests, featured-update and configuration-save containment, generation target planning, worker environment and argument isolation against a stub worker, and tool-attestation rejection.

**Rationale:**

- The audit proved a crafted `overrides.slug` escaped `src/data/projects` and overwrote an unintended Markdown file. Four independent path joins meant fixing one sink would have left the others reachable, so containment had to become a shared invariant rather than four checks.
- Persisting configuration before touching files allowed a later filesystem failure to leave configuration and content disagreeing. Planning first makes the save all-or-nothing.
- The audit also proved the generation subprocess inherited the full service environment while Bash and web tools were structurally available. The privilege reduction removes the authority rather than the capability: the worker still uses the operator's existing local Claude login, but it can only read stdin and write stdout.
- Reading the CLI's own initialization report converts the command-line flags from a request into a verified invariant, so tool access cannot be re-enabled by an ignored local settings file.

**Trade-offs:**

- Replacing the agentic CLI with a plain text-generation API would isolate the worker further, but it would introduce an API-key dependency and displace the existing local Claude authentication. That is a product decision and was deliberately not taken here.
- The sandbox copies the one Claude credential file it needs to authenticate. The worker therefore holds the model credential for its own call, which is unavoidable without an API key; it holds nothing else from the operator's home.
- Generation now fails closed if a future CLI version changes its session-init report, which is preferred over silently sending untrusted text to a tool-enabled agent.
- Existing project slugs must be kebab-case. A non-conforming override in a hand-edited local configuration file now fails validation instead of being written.
- The backend still derives identity solely from the `Tailscale-User-Login` proxy header; see docs/RUNBOOK.md for why no non-spoofable alternative exists for a loopback-proxied backend and why this single-user application adds no authentication layer.
