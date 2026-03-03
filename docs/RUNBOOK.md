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
