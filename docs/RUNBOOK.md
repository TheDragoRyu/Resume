# Runbook

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build & Preview

```bash
npm run check    # Lints, tests, validates content, and builds /out
npm run build    # Validates content, then builds static export to /out
npm run start    # Serves /out locally
```

## Content

All content lives in `src/data/` as Markdown files with frontmatter. See `src/content/content-types.ts` for the schema.

### Internal links and inline media

- Write site destinations as root-relative paths such as `/resume#experience` or `/projects/portfolio-site`.
- Write local media as `/images/file.png`; the file must exist under `public/images`.
- Never add the deployment prefix such as `/Resume` to Markdown. The content renderer adds `NEXT_PUBLIC_BASE_PATH` during production builds.
- External links must use an explicit scheme such as `https://`; validation does not make network requests to test external availability.

`npm run validate` rejects unknown site routes, nonexistent project slugs, invalid Resume anchors, unsafe relative paths, unsupported URL schemes, and missing inline local media.

### Private authoring server (recommended)

The authoring application runs only on Dungeon at `127.0.0.1:4180`. Tailscale Serve terminates tailnet-only HTTPS and injects the authenticated user's identity. The backend accepts only `sanchith.krishnan@gmail.com`, never sends GitHub credentials to the browser, and is not part of the Next.js export.

Open:

```text
https://dungeon.tail8f87cd.ts.net:8452
```

The authoring workspace provides:

- all Markdown content under `src/data/`, with editable frontmatter JSON and Markdown bodies;
- validated project creation and recoverable project deletion;
- image uploads under `public/images`;
- the authenticated GitHub repository inventory, including private repositories visible only in the no-store browser session;
- public-repository publish/sync and featured controls, ordering, generation context, locks, and display/link overrides; and
- fixed Fetch, Generate, and Check actions with bounded logs. It never exposes an arbitrary command runner.

Every content save runs the repository validator. Invalid writes are rolled back. Project deletion moves the file into the gitignored `.project-admin-trash/` recovery directory. All authoring changes remain ordinary local Git changes and must be reviewed before commit.

#### Service operation

The committed service template is `scripts/systemd/portfolio-project-admin.service`. The installed user service starts automatically and restarts on failure:

```bash
systemctl --user status portfolio-project-admin
systemctl --user restart portfolio-project-admin
journalctl --user -u portfolio-project-admin -f
```

Local identity and endpoint settings live in the gitignored mode-`0600` file `.project-admin.env`.

Tailscale Serve requires one administrator-authorized setup on this machine:

```bash
sudo tailscale set --operator=dragoryu
tailscale serve --bg --https=8452 --yes 4180
tailscale serve status
```

The first command lets this OS user manage Serve without repeated sudo access. The second adds HTTPS port 8452 without replacing the existing Serve routes. Do not use Tailscale Funnel; Funnel is public and does not provide the identity headers required by this server.

To stop access while keeping the local service installed:

```bash
tailscale serve --https=8452 off
```

#### Routine content updates

1. Open the tailnet URL and confirm the displayed Tailscale identity.
2. Use **Site content** to select a document.
3. Edit its JSON frontmatter or Markdown body.
4. Select **Validate and save**. A failed global content validation restores the previous file.
5. Use **Media** to upload an AVIF, JPEG, PNG, or WebP image, then copy its `/images/...` path into content.
6. Use **Build actions → Run full quality gate**.
7. Review `git diff` before committing and pushing.

Fixed Profile, Contact, Projects-page, and Resume-section records can be edited but not deleted. Project documents can be created or moved to recovery. Keep structured Contact and Projects-page Markdown bodies empty.

#### Security and recovery

- The backend listens only on loopback, as required when trusting Tailscale Serve identity headers.
- Mutations require an exact allowed Tailscale identity, same-origin HTTPS, JSON content type, and a per-process CSRF token.
- Responses use `Cache-Control: no-store`, a restrictive Content Security Policy, clickjacking protection, and no-referrer behavior.
- Repository inventory is held only in server/browser memory. Only selected public repository identifiers enter the mode-`0600` local selection file.
- Private repositories are visible to the authorized user for inventory awareness but cannot be published, cached, generated, or featured.
- Do not place secrets or private information in Markdown or uploaded media; committed content and media are public.
- Recover deleted project files from `.project-admin-trash/` before committing if deletion was accidental. Git history remains the final recovery layer for committed content.

### Manual fallback: adding a project

1. Create `src/data/projects/my-project.md` with required frontmatter.
2. Set `categoryId` to a valid category id. It remains a validated taxonomy relationship but does not control scene-planet placement.
3. Run `npm run validate` to check.

### Manual fallback: adding a resume category

1. Create `src/data/categories/my-category.md` with required frontmatter.
2. Run `npm run validate` to check.

## Deployment

Push to `main` branch. GitHub Actions will build and deploy to GitHub Pages automatically.

### Environment Variables
- `NEXT_PUBLIC_BASE_PATH`: Set to `/repo-name` for project sites, empty for user sites.
- `NEXT_PUBLIC_SITE_URL`: Origin of the deployed site, without the repository path (for example `https://example.com`).

## GitHub project ingestion

The **GitHub projects** area of the private authoring server replaces the former CLI selector.

### Authentication and privacy

- The server reads the active GitHub CLI credential from `gh auth token`, or `GITHUB_TOKEN` from the service environment.
- The token remains server-side and is never logged, persisted by the application, or returned to the browser.
- The authenticated `/user/repos` inventory is returned only to the allowed Tailscale identity with no-store headers.
- Private repository names can be reviewed in the authenticated workspace, but private repositories are disabled for publication. The save endpoint independently re-fetches visibility and rejects private selections.
- Selected public repositories live in `.featured-repos.local.json`; fetched public metadata lives in `.project-cache.json`. Both are gitignored and mode `0600`.
- A selected public repository and generated case study become visible after their Markdown is committed and deployed.

### Workflow

1. Open **GitHub projects**.
2. Search the complete authenticated inventory.
3. Select public repositories for publication and choose which are featured.
4. Optionally edit ordering, category, generation context, lock state, display overrides, tags, and URLs.
5. Save. Existing project Markdown receives the new `featured` state immediately.
6. Open **Build actions** and run **Fetch selected repositories**.
7. Run **Generate missing project content**.
8. Review the generated Markdown in **Site content**.
9. Run **Run full quality gate**, review the Git diff, and commit only approved content.

The command-line fetch and generation scripts remain available as maintenance fallbacks:

```bash
npm run sync:fetch
npm run sync:generate
npm run sync-projects
```

### Troubleshooting

- **401 from the authoring server:** Use the Tailscale Serve URL, not localhost or the LAN address, and confirm the configured allowed login.
- **Origin rejected:** Open the exact HTTPS origin in `.project-admin.env`; do not use an IP alias.
- **GitHub authentication failed:** Run `gh auth status` and refresh the active account login.
- **Private repository rejected:** Automated publication is intentionally public-only. Write a separately reviewed, sanitized case study when source must remain private.
- **Content save rejected:** Fix every validation error shown; the prior file was restored.
- **Service unavailable:** Check `systemctl --user status portfolio-project-admin` and the user journal.
- **Legacy cache:** Run Fetch again before Generate.
