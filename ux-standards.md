
# Resume-Website — UX Patterns & Standards

**Purpose:** This file is the implementation playbook. It turns pillars into consistent UI patterns, interaction rules, and fallback flows.

---

## 1) Primary UX Architecture

### Routes (must exist even without 3D)
- `/` — Landing (3D-enhanced, but not dependent)
- `/resume` — Resume (reading mode)
- `/projects` — Projects index
- `/projects/[slug]` — Project detail / case study

### Solar System Mapping (3D as a visual router)
- **Sun** → Intro / About / Contact CTA area
- **Planets** → Resume sections (Experience, Skills, Education, etc.)
- **Moons** → Individual projects (`/projects/[slug]`)

**Rule:** 3D labels must match page/section titles from frontmatter.

---

## 2) Landing Page Standard (Above the Fold)

### Must include on first paint
- Name + role tagline
- 3 primary CTAs: **Resume**, **Projects**, **Contact**
- A small helper hint:
  - “Explore in 3D (optional)”
  - “Menu works without 3D”

### 3D loading behavior
- 3D scene lazy-loads after core UI renders.
- Show a lightweight status line while loading (optional):
  - “Loading scene…” (never blocks navigation)

---

## 3) Overlay / HUD Inventory (Always Available)

### Required components
- **Top nav**: Resume, Projects, Contact (+ theme toggle if present)
- **Context panel** (on selection): label + short description + “Open” button
- **Breadcrumb/back**: Home ▸ Current (with Back action)

### Optional components (nice-to-have)
- Search (type “Kubernetes” → jump to Skills or a project)
- Legend / mini-map (explain Sun/Planets/Moons)

**Rule:** Overlay is the primary accessible navigation. The canvas is not required to be “screen-reader navigable”.

---

## 4) Interaction States (UI + 3D)

### States (must be consistent)
- Default
- Hover / Focus
- Selected / Active
- Disabled / Unavailable
- Loading

### Minimum behaviors
- Hover/focus shows label (tooltip +/or HUD)
- Selected state persists while route is active
- Click/tap has immediate feedback (pressed/active) even if route transition takes time

### Focus rules
- Focus rings must be visible on `--bg` and `--surface-*`.
- Never remove focus outlines unless replaced with an accessible equivalent.

---

## 5) 3D Affordance & Onboarding (Make Clickability Obvious)

**Goal:** Users should understand within ~3 seconds that planets/moons are interactive.

### Desktop (mouse) affordances
- Cursor becomes **pointer** when hovering an interactive object.
- Hover state is unambiguous:
  - outline/rim light + subtle glow increase
  - tiny scale-up (e.g., 1.03–1.06)
- Tooltip appears immediately on hover:
  - `Experience`
  - subtext: `Click to open`

### Mobile (touch) affordances
- No hover assumptions.
- First tap **selects** object and opens a small panel/bottom-sheet with:
  - Title (e.g., `Skills`)
  - Primary action: **Open**
  - Secondary: **Back** / **Close**
- Optional but recommended: require **Open** to navigate (prevents accidental route changes).

### Onboarding cues (one-time)
- When the 3D scene is ready, do a **single subtle pulse** on 1–2 key bodies (e.g., Experience + Projects), then stop.
- Show a small hint line (dismissible):
  - “Click a planet to open a resume section. Click a moon to open a project.”

### Definition of done
- A first-time user can answer “What can I click?” within **3 seconds**.
- Desktop hover reliably shows pointer + tooltip.
- Mobile tap reliably produces a selection panel with **Open**.

---

## 6) 3D Hit Targets & Selection Rules (Make Clicks Reliable)

**Goal:** Objects are comfortably clickable regardless of depth/scale.

### Minimum effective hit target (screen-space)
- **Desktop:** 32–40 px effective target
- **Mobile:** 44–48 px effective target

### Implementation standard
- Use **invisible hit spheres/colliders** for raycasting (do not depend on mesh size).
- Enforce a **minimum screen-space radius**:
  - if an object becomes too small, either increase collider size, slightly scale the object, or hide it until zoomed/focused.

### Occlusion rules
- Clicking/tapping must be deterministic:
  - prioritize the nearest valid collider under the pointer
  - if an object is heavily occluded, either disable interaction or require focus first

### Selection confirmation
- Provide immediate feedback on select:
  - highlight + label
  - context panel shows **Open** button
- On mobile, recommended flow:
  - tap 1 = select
  - tap Open (or tap 2) = navigate

### Definition of done
- Desktop: intended planet is selectable within **1–2 attempts**.
- Mobile: one-thumb selection works without zooming.
- No “unclickably small” targets at default camera.

---

## 7) Motion Standard

### Default motion
- Camera transitions are short and predictable.
- Avoid long “tour” animations.

### Reduced motion (`prefers-reduced-motion`)
- No camera flights.
- Use instant focus + subtle fade.
- All content remains reachable with equal clarity.

---

## 8) Fallback & Error Flows

### WebGL unavailable / disabled
- Replace 3D with a static hero background (or simple gradient).
- Keep the same overlay nav and CTAs.
- Optional microcopy: “3D view unavailable on this device/browser.”

### Slow loads / low-end devices
- Provide a **Performance mode** (manual toggle if needed):
  - reduce post-processing
  - reduce particles
  - reduce draw distance/LOD
- Never degrade text readability to preserve visuals.

### Broken routes / missing content
- Project slug not found → friendly 404 with link back to `/projects`.
- Missing metadata → fall back to safe defaults (no blank titles).

---

## 9) Resume Page Pattern (`/resume`)

### Layout
- Reading-mode layout with clear typography and spacing.
- Sticky TOC on desktop; collapsible TOC on mobile.

### Section structure
- H1: Resume
- H2: Experience, Skills, Education, etc.
- Use bullets for outcomes; avoid wall-of-text paragraphs.

### Cross-linking
- Projects mentioned in experience link to `/projects/[slug]`.

---

## 10) Projects Index Pattern (`/projects`)

### Must include
- List/grid of project cards with title + short summary + tags
- Sorting/filtering (at least tags)
- Clear entry to each project page

### Optional
- “Featured projects” section at top (content-driven)

---

## 11) Project Detail Pattern (`/projects/[slug]`)

### Recommended case study structure
1. Problem / Context
2. Approach
3. Results (metrics if available)
4. Tech stack
5. Links (GitHub, demo, write-up)

### Must include
- Clear title (H1)
- Metadata from frontmatter (title/description)
- Back link to `/projects`

---

## 12) Copy Standards (Microcopy)

### Tone
- Clear, confident, minimal.
- Avoid gimmicky sci-fi language that obscures meaning.

### Standard phrases (preferred)
- “Explore in 3D (optional)”
- “Use the menu if you prefer”
- “Click a planet to open a resume section. Click a moon to open a project.”
- “Back to Home”
- “Performance mode”

---

## 13) Color Tokens (Reference)
The authoritative color tokens live in the code/theme layer. This file focuses on UX patterns.

**Rule:** Visual experimentation in 3D must not reduce text contrast or navigation clarity.