
# Resume-Website — Design Pillars

**Purpose:** This file is the project’s UI/UX constitution. If a design decision conflicts with a pillar, redesign it.

## Product North Star
Deliver a portfolio/resume that is **instantly useful** (fast, readable, SEO-friendly pages) with an **optional delight layer** (WebGL solar system) that enhances discovery without blocking access to content.

---

## Pillar 1 — Utility First, Magic Second
**Non-negotiables**
- Primary actions visible immediately: **Resume**, **Projects**, **Contact**.
- Fully usable with **WebGL off**, slow devices, or blocked scripts.
- 3D is an enhancement layer, never a requirement.

**Acceptance checks**
- Resume/Projects reachable in **one click** without 3D.
- If the canvas fails, the site still works end-to-end.

---

## Pillar 2 — Content Is the Source of Truth
**Non-negotiables**
- Navigation labels, ordering, and routing metadata come from **Markdown frontmatter**.
- No hardcoded nav items that can drift from content.

**Acceptance checks**
- Editing `.md` frontmatter updates overlay labels, 3D labels, ordering, and routes on next build.
- `/resume` and `/projects/[slug]` render from Markdown at build time.

---

## Pillar 3 — Dual Navigation Must Match (3D + Conventional)
**Non-negotiables**
- Every 3D object maps 1:1 to a real route (`/resume#section`, `/projects/[slug]`).
- Overlay navigation duplicates every 3D destination.
- Labels shown in 3D match real section/project names.

**Acceptance checks**
- Every 3D click results in a deterministic route change.
- Overlay offers identical destinations and labels.

---

## Pillar 4 — Clarity Beats Cleverness
**Non-negotiables**
- Destination labels are always visible somewhere (tooltip + HUD/overlay).
- Microcopy explains the 3D quickly: “Explore in 3D (optional)” and “Use the menu if you prefer”.
- No hidden gestures as the only way to proceed.

**Acceptance checks**
- First-time users can navigate without instructions.
- No “Where do I click?” moments.

---

## Pillar 5 — Motion With Consent and Control
**Non-negotiables**
- Respect `prefers-reduced-motion` (replace camera flights with instant focus + fade).
- Keep transitions short and predictable.
- Provide escape hatches: Back/Esc/breadcrumb.

**Acceptance checks**
- Reduced motion disables long camera travel.
- Navigation remains responsive during transitions.

---

## Pillar 6 — Performance Is a UX Feature
**Non-negotiables**
- Progressive enhancement: HTML UI first, 3D lazy-loaded.
- Budget heavy effects (bloom/particles/post-processing), especially on mobile.
- Immediate interaction feedback even while assets stream.

**Acceptance checks**
- Overlay remains responsive while scene loads.
- Mobile remains stable (no janky scroll, no runaway GPU usage).

---

## Pillar 7 — Accessibility Is Baseline
**Non-negotiables**
- Overlay navigation is fully keyboard accessible.
- Visible, consistent focus states.
- Screen reader users can navigate without touching the canvas.

**Acceptance checks**
- Keyboard-only user can reach every destination.
- Canvas failure does not block navigation.

---

## Pillar 8 — SEO + Reading Mode Are First-Class
**Non-negotiables**
- Semantic HTML structure (H1–H3, lists, landmarks).
- Page metadata (title/description) derived from frontmatter.
- Resume/case studies optimized for scanning.

**Acceptance checks**
- `/resume` and `/projects/[slug]` have meaningful title/description.
- Value is clear within ~30 seconds of scanning.

---

## Pillar 9 — Mobile Is Not “Small Desktop”
**Non-negotiables**
- Mobile navigation does not depend on precise tapping of 3D objects.
- Touch targets are comfortably sized (≈44px minimum).
- Offer “Performance mode” if needed.

**Acceptance checks**
- One-thumb navigation works for all core routes.
- 3D remains optional on mobile.

---

## Design Decision Filter (Use Before Merging UI Changes)
1) Does this make the site more usable without 3D?  
2) Is there an equivalent route in conventional navigation?  
3) Is it clear on first visit?  
4) Does it respect reduced motion + accessibility?  
5) Does it preserve responsiveness on mobile?  

If any answer is “no”, redesign.