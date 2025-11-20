# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For documentation content guidelines (adding/editing docs), see `content/README/AGENTS.md`.

## Project Overview

This is the Superwall documentation site built with Next.js, Fumadocs, and deployed to Cloudflare Pages. The site serves SDK documentation for multiple platforms (iOS, Android, Flutter, Expo) along with dashboard guides and integration documentation.

## Essential Commands

### Development
```bash
# First-time setup: build documentation files
bun run build

# Start development server at http://localhost:8293
bun run dev

# Clear Next.js cache if needed
rm -rf .next

# Clear build cache
bun run clear:cache
```

### Build & Deploy
```bash
# Build for production
bun run build

# Deploy to staging
bun run deploy:staging

# Deploy to production
bun run deploy
```

**CRITICAL: DO NOT EVER DEPLOY WITHOUT CHECKING WITH THE USER**

### Content Generation Scripts
```bash
# Generate AI-optimized markdown files
tsx scripts/generate-llm-files.ts

# Generate standard markdown files
tsx scripts/generate-md-files.ts

# Copy documentation images
bun run copy:docs-images

# Watch for image changes during development
bun run watch:images
```

## Architecture Overview

### Content Pipeline
The documentation follows a strict source-to-output pipeline:

1. **Source files**: `/content/docs/**/*.mdx` (ALWAYS edit here)
2. **Processing**: Build scripts + remark plugins transform content
3. **Generated output**: `/public/**/*.md` (NEVER edit - auto-generated)

**CRITICAL**: Always edit files in `/content/docs/`, NEVER in `/public/`. The `/public/` directory contains auto-generated files that will be overwritten during build.

### Multi-Platform SDK Architecture
The site uses a sophisticated system to serve documentation for multiple SDKs from shared and platform-specific content:

- **Platform folders**: `/content/docs/{ios,android,flutter,expo}/`
- **Shared content**: `/content/shared/` contains reusable MDX files
- **SDK filtering**: `remark-sdk-filter` plugin removes platform-specific content blocks during build
- **SDK selector pattern**: `/docs/sdk/*` routes redirect to platform-specific pages (e.g., `/docs/sdk/quickstart/install` → `/docs/ios/quickstart/install`)

### Remark Plugin Pipeline
Content processing happens through a series of custom remark plugins (defined in `source.config.ts`):

1. `remark-image-paths` - Resolves and processes image paths (runs first)
2. `remark-follow-export` - Handles exported content references
3. `remark-include` (fumadocs) - Processes file includes from shared content
4. `remark-directive` - Parses custom directive syntax (e.g., `:::expo`)
5. `remark-tabs-syntax` - Transforms tab syntax for multi-platform code
6. `remark-code-language` - Detects and sets code block languages
7. `remark-codegroup-to-tabs` - Converts code groups to tabbed interfaces
8. `remark-sdk-filter` - Removes non-matching SDK-specific blocks (runs last)

The order matters - image path resolution must happen before other transformations.

### Navigation System
- **Structure**: Each folder can have a `meta.json` file defining navigation order and hierarchy
- **Pages without catch-all**: If `meta.json` doesn't include `"..."`, every page must be explicitly listed
- **Nested navigation**: Related APIs can be grouped as nested objects (e.g., `PaywallOptions` under `SuperwallOptions`)
- **Auto-generation**: Pages are generated based on file structure + meta.json configuration
- **File references**: Use relative paths without extensions (e.g., `"guides/my-guide"` not `"guides/my-guide.mdx"`)

### Redirects System
- **Configuration**: `redirects-map.ts` defines URL redirects
- **Types**:
  - `folderRedirectsMap` - Redirects from root to folder paths
  - `fileRedirectsMap` - File-to-file redirects (e.g., legacy SDK installation paths)
  - `externalRedirectsMap` - External URL redirects
- **Processing**: `next.config.ts` generates redirect rules from these maps during build
- **Note**: Changes to redirects require rebuild to take effect

### Deployment & Hosting
- **Platform**: Cloudflare Pages via OpenNext.js adapter (`@opennextjs/cloudflare`)
- **Environments**: Production and staging
- **Build process**: `bun run build:cf` creates Cloudflare-compatible output
- **Webpack customization**: `next.config.ts` includes aliases to replace eval-based components (not allowed on Cloudflare Workers)
- **Base path**: All routes are prefixed with `/docs` (configured in next.config.ts)

## Key Files & Their Purposes

### Configuration
- `source.config.ts` - Fumadocs configuration and remark plugin chain
- `next.config.ts` - Next.js config, redirects, webpack aliases, basePath (`/docs`)
- `redirects-map.ts` - URL redirect mappings (exported as const objects)
- `tsconfig.json` - TypeScript config with path aliases (`@/*` → `src/*`)
- `.env.example` - Environment variable templates

### Layout & Routing
- `src/app/layout.config.tsx` - Site layout, navigation, theme configuration
- `src/lib/source.ts` - Documentation source configuration and SDK icons
- `src/mdx-components.tsx` - Custom MDX component overrides
- `src/app/(docs)/[[...slug]]/page.tsx` - Dynamic route handler for all doc pages

### Custom Plugins
- `plugins/remark-sdk-filter.ts` - Removes SDK-specific blocks (directive `:::expo` or JSX `<div sdk="expo">`)
- `plugins/remark-tabs-syntax.ts` - Processes custom tab syntax
- `plugins/remark-code-language.ts` - Detects code block languages
- `plugins/remark-image-paths.ts` - Resolves image paths for build
- `plugins/remark-follow-export.ts` - Handles content exports
- `plugins/remark-codegroup-to-tabs.ts` - Converts code groups to tabs

### Build Scripts
- `scripts/generate-title-map.ts` - Creates title lookup map for pages
- `scripts/generate-llm-files.ts` - Generates AI-optimized documentation
- `scripts/generate-md-files.ts` - Converts MDX to plain markdown
- `scripts/copy-docs-images.cjs` - Copies images from content to public
- `scripts/watch-docs-images.ts` - Watches for image changes during dev
- `scripts/clear-cache.ts` - Clears build cache

## Adding New Documentation Pages

When adding new documentation pages:

1. Create the `.mdx` file in the appropriate `/content/docs/` subdirectory
2. **Update the corresponding `meta.json` file** in the same folder to include the new page in navigation
3. Use relative paths without file extensions in `meta.json` (e.g., `"guides/my-new-guide"`)
4. Group related APIs as nested objects when appropriate
5. Run `bun run build` to generate output files and verify

### SDK Documentation Structure
Each SDK follows a standard structure:
```
content/docs/{sdk}/
├── quickstart/        # Getting started guides
├── guides/           # Conceptual docs and tutorials
│   ├── advanced/     # Advanced topics (collapsed in nav with meta.json)
│   └── ...
└── sdk-reference/    # API reference (one MDX per public symbol)
```

## Environment Variables

See `.env.example` for required environment variables:
- `SEARCH_MODE` - Toggle between 'fumadocs' (default) or 'rag' (uses external AI search at mcp.superwall.com)
- `NEXTJS_ENV` - Development or production
- Integration keys for Slack, Mesh, Unify, RB2B, Pylon (optional for local dev)

## Development Workflow Notes

- **Dev server port**: 8293 (configured in package.json dev:next script)
- **Changes requiring rebuild**: Redirects, remark plugin modifications, meta.json changes, image additions
- **Auto-reload**: Content changes in `/content/docs/` rebuild automatically during dev
- **Image handling**: Images in `/content/docs/images/` are copied to `/public/` during build
- **Component customization**: Add custom components to `src/components/` and reference in MDX
- **Turbo cache**: Build uses Turbo for caching and optimization

## TypeScript Path Aliases
- `@/*` maps to `src/*`
- `@/.source` maps to `.source/index.ts` (generated by Fumadocs)

## Troubleshooting

### Build Failures
- Check for syntax errors in `.mdx` files
- Verify `meta.json` files are valid JSON
- Ensure all pages in meta.json exist as files
- Run `bun run build` to see detailed error messages

### Development Server Issues
- Clear cache: `rm -rf .next`
- Run full rebuild: `bun run build`
- Check for port conflicts (port 8293)
- Verify node_modules are installed

### Deployment Issues
- Verify Cloudflare configuration in wrangler.jsonc
- Check build logs in deployment dashboard
- Ensure all environment variables are set
- Verify redirects-map.ts exports are valid
