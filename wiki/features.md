# User-Facing Features

This document describes the behavior currently available to a visitor. Known defects and optional future work are kept in the [roadmap](roadmap.md).

## Public destinations

| Destination | Visitor purpose |
| --- | --- |
| `/` | Understand who the portfolio belongs to and choose conventional or 3D exploration |
| `/resume` | Read experience, skills, and education |
| `/projects` | Browse and filter project case studies |
| `/projects/[slug]` | Read a specific project case study and follow its external links |
| `/contact` | Find email, social profiles, location, and work availability |

The current project catalog contains:

- 3D Portfolio Site;
- SoilMoisture Simulator; and
- Go Particle System.

## Global experience

Every main page shares:

- a skip-to-content link;
- a sticky site header;
- conventional links to Home, Resume, Projects, and Contact;
- content-driven Resume and Projects submenus;
- active-page styling;
- a desktop navigation layout;
- a mobile menu with collapsible sub-navigation;
- keyboard controls for desktop dropdowns;
- breadcrumbs on content pages;
- a semantic main-content region; and
- a footer with the current year and site title.

Navigation remains available independently of the 3D scene.

## Landing page

On first visit, the landing page presents:

- the candidate's name;
- role and short professional description;
- direct Resume, Projects, and Contact calls to action;
- an explanation that 3D exploration is optional; and
- the interactive solar-system section.

The text content renders before the 3D bundle, and a “Loading scene...” status appears while the scene is loading.

## Interactive solar system

The scene is a visual navigation model:

- the sun represents the introduction and provides a Contact action;
- Resume planets represent Experience, Skills, and Education;
- a dedicated Projects planet represents the project index;
- moons represent individual projects and orbit the Projects planet;
- orbit colors and sizes come from content metadata or stable defaults; and
- a cyberpunk starfield, orbit lines, neon colors, and labels establish the visual theme.

### Exploration behavior

- All sun, planet, and moon labels are visible.
- Hovering an interactive body changes its visual state and cursor.
- Larger invisible hit areas make small objects easier to select.
- The initial system view shows the sun, Resume planets, and the Projects planet.
- Exploring the Projects planet moves to a focused view containing that planet and all project moons.
- A scene breadcrumb returns to the system view.
- Focused planet state is represented in the URL hash and responds to browser back/forward navigation.
- A context panel shows the selected item's title, description, and relevant Open, Explore, Contact, Back, or Close actions.
- Navigation actions show loading feedback.
- The context panel traps focus while open and closes with Escape.

### Desktop, mobile, and keyboard input

- Desktop, mobile, and keyboard planet selection opens the same context panel instead of entering project exploration automatically.
- A Resume planet's primary **Open Resume Section** action navigates to its matching `/resume#section` anchor.
- The Projects planet's primary **Open Projects** action navigates to `/projects`.
- The Projects planet also offers **Explore N Projects** as a secondary action that enters its focused moon view.
- Selecting a moon exposes **Open Project** for its individual case study.
- A DOM-based keyboard navigator exposes the nodes in the current scene with arrow-key movement.
- Focus indicators remain visible on scene controls.
- A first-session hint explains that planets lead to Resume or Projects and can be dismissed.
- The first planets pulse subtly while that hint is present.

### Motion and performance controls

- Reduced-motion preference freezes orbit and squash/stretch motion and makes camera focus immediate.
- A persistent Performance mode freezes orbit motion and reduces star particles.
- The scene height and interaction behavior adapt between mobile and desktop.

### Fallback behavior

If WebGL is unavailable, the scene becomes a readable grid of links to the same content destinations. The visitor can continue to use the full site.

## Resume

The resume page provides:

- a profile header with the resume title, candidate name, role, and an optional authoring-server-managed image that resolves correctly on project-site base paths;
- a desktop sticky table of contents;
- an active-section highlight as the visitor scrolls;
- a collapsible mobile “Jump to section” menu;
- anchor navigation to each category;
- structured Experience, Skills, and Education sections rendered from Markdown; and
- links from experience bullets to related projects where configured.

The layout uses headings, bullets, readable spacing, and long-form typography intended for scanning.

The current Experience content records progression from Unity Developer to Senior Unity Engineer at LILA, preceded by Unity Developer and Game Developer Intern roles at Audify.

## Projects index

The projects page provides:

- a authoring-server-managed page title, introduction, search description, and social description;
- a responsive project-card grid;
- title, summary, tags, featured state, and an optional accessible cover image on each card;
- featured projects ordered before other matching projects;
- multi-select tag filters;
- pressed-state feedback on selected filters;
- a Clear all action;
- an empty-state message when no projects match; and
- direct entry into each case study.

## Project case studies

Each configured project receives its own static page with:

- a unique title and description;
- breadcrumb navigation back through Projects;
- tags and a featured marker where applicable;
- an optional cover image with editor-supplied alternative text;
- rendered Markdown case-study content;
- GitHub, demo, and write-up actions when those links exist;
- meaningful page metadata;
- Open Graph preview data; and
- a friendly not-found experience for unknown slugs.

The three current case studies describe the project problem, solution, highlights, and technology stack.

## Contact

The contact page renders structured frontmatter in a responsive neon card layout and currently includes:

- editable introductory copy;
- an email card with a keyboard-reachable `mailto:` action;
- a social card with GitHub and LinkedIn profile actions;
- a location card showing Bengaluru and remote-work availability;
- a decorative radar panel on large screens that is hidden from assistive technology; and
- title, description, Open Graph, and Twitter metadata generated from the same Contact record.

There is no first-party contact form or backend.

## Accessibility and responsive behavior

Across the experience:

- semantic landmarks identify the header, navigation, main content, and footer;
- each page has one primary heading;
- interactive controls have accessible names;
- conventional links cover every core destination;
- keyboard and focus behavior are implemented for menus, filters, resume navigation, modals, and scene navigation;
- icon-only controls meet the intended minimum touch size;
- color and focus treatments are designed for the dark theme;
- the Three.js canvas is hidden from screen readers; and
- reduced-motion and no-WebGL experiences retain equivalent navigation.

## Search, sharing, and discoverability

The site provides:

- route-specific titles and descriptions;
- project-specific generated metadata;
- Open Graph and Twitter Card metadata with a default share image;
- a generated sitemap containing fixed routes and every project;
- generated robots rules; and
- static HTML for resume and project content.

## Analytics policy

The production site intentionally ships without an analytics SDK, tracking cookies, pageview collection, or custom interaction events. Navigation, filtering, resume observation, and 3D interactions operate independently of third-party telemetry. Reintroducing analytics requires a new product and architecture decision.
