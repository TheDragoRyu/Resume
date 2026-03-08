# Runbook

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build & Preview

```bash
npm run build    # Validates content, then builds static export to /out
npm run start    # Serves /out locally
```

## Content

All content lives in `src/data/` as Markdown files with frontmatter. See `src/content/content-types.ts` for the schema.

### Adding a project
1. Create `src/data/projects/my-project.md` with required frontmatter.
2. Set `categoryId` to a valid category id.
3. Run `npm run validate` to check.

### Adding a resume category
1. Create `src/data/categories/my-category.md` with required frontmatter.
2. Run `npm run validate` to check.

## Deployment

Push to `main` branch. GitHub Actions will build and deploy to GitHub Pages automatically.

### Environment Variables
- `NEXT_PUBLIC_BASE_PATH`: Set to `/repo-name` for project sites, empty for user sites.
- `NEXT_PUBLIC_SITE_URL`: Full URL of the deployed site.

## Syncing GitHub Projects

Automates project content generation from GitHub repos marked as "featured".

### Prerequisites
- **Claude CLI** (`claude`): Required for content generation. Install via `npm install -g @anthropic-ai/claude-code`.
- **GITHUB_TOKEN** (optional): Set in `.env.local` or environment. Without it, the GitHub API allows 60 requests/hour (sufficient for small repo sets). With it, 5000 requests/hour.

### Configuration

Edit `scripts/featured-repos.json`:

```json
{
  "defaults": {
    "categoryId": "cat-experience",
    "featured": false
  },
  "repos": [
    {
      "repo": "owner/repo-name",
      "order": 4,
      "featured": true,
      "overrides": {
        "title": "Custom Display Title",
        "slug": "custom-slug",
        "description": "Override auto-generated description",
        "tags": ["React", "TypeScript"],
        "links": { "demo": "https://demo.example.com" }
      }
    }
  ]
}
```

- `repo` (required): `owner/name` format.
- `order` (required): Unique integer. Must not collide with existing projects.
- `categoryId`: Required at `defaults` or per-repo level.
- `featured`: Optional. Defaults to `defaults.featured`.
- `overrides`: All optional. Auto-derived from GitHub data if omitted.
- `links.github`: Always auto-set from the repo URL (not configurable).

### Commands

```bash
# Full pipeline (fetch + generate)
npm run sync-projects

# Fetch only (creates .project-cache.json)
npm run sync:fetch

# Generate only (reads cache, writes .md files)
npm run sync:generate

# Overwrite all existing generated files
npm run sync:generate -- --force

# Overwrite a specific slug
npm run sync:generate -- --force=my-project
```

### Post-generation workflow

1. Review the generated `.md` files in `src/data/projects/`.
2. Run `npm run validate` to check content integrity.
3. Run `npm run dev` to preview locally.
4. Commit the new/updated `.md` files.

### Troubleshooting

- **Rate limit exceeded**: Set `GITHUB_TOKEN` in `.env.local`. The error message shows when the limit resets.
- **`claude` CLI not found**: Install with `npm install -g @anthropic-ai/claude-code`.
- **Missing cache**: Run `npm run sync:fetch` before `npm run sync:generate`.
- **Validation errors**: Check the error output — common issues are duplicate slugs/IDs or missing `categoryId` references. Fix in `featured-repos.json` overrides or the generated file.
- **Malformed Claude output**: The script skips repos where Claude returns content missing required sections. Re-run with `--force=<slug>` to retry.
