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
- Follows Pillar 1 (Utility First, Magic Second) from design-pillars.md.
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

**Decision:** Five changes to align the implementation with ux-standards.md, filtered through design-pillars.md.

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
