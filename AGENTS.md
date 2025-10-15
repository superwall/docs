# AGENTS.md - Documentation Site Development

This file provides guidance for working with the Superwall documentation site infrastructure and build system.

For documentation content guidelines (adding/editing docs), see `content/README/AGENTS.md`.

## Documentation Site Commands

From the docs directory (`apps/docs`):

```bash
# Generate documentation files
bun run build

# Start documentation development server
bun run dev

# Generate AI-optimized documentation files
tsx scripts/generate-llm-files.ts
tsx scripts/generate-md-files.ts

# Copy documentation images
bun run copy:docs-images

# Deploy to Cloudflare (staging)
bun run deploy:staging

# Deploy to Cloudflare (production)
bun run deploy
```
DO NOT EVER DEPLOY WITHOUT CHECKING WITH THE USER

## Documentation Site Architecture

### Build System
- Uses Fumadocs for documentation generation
- Source files in `/content/docs/` → Generated files in `/public/`
- Build process transforms `.mdx` to `.md` and processes content
- Turbo handles build caching and optimization

### Key Files and Directories
- `source.config.ts` - Fumadocs configuration
- `src/lib/source.ts` - Source configuration and icons
- `src/app/layout.config.tsx` - Site layout configuration
- `plugins/` - Custom remark plugins for content processing
- `scripts/` - Build and generation scripts

### Navigation and Routing
- Navigation structure defined by `meta.json` files in content directories
- Pages auto-generated based on file structure in `/content/docs/`
- Custom components in `src/components/` for enhanced UI
- `/docs/sdk/*` wildcard path renders the SDK selector page before redirecting to the chosen platform (e.g. `/docs/sdk/quickstart/tracking-subscription-state` → `/docs/ios/quickstart/tracking-subscription-state`).

### Content Processing Plugins
- `remark-tabs-syntax` - Processes tab syntax
- `remark-code-language` - Handles code language detection
- `remark-image-paths` - Processes image paths
- `remark-sdk-filter` - Filters content by SDK

## Development Workflow

### Local Development
1. Start dev server: `bun run dev`
2. Edit content in `/content/docs/`
3. Changes automatically rebuild and refresh
4. Test build locally: `bun run build`

### Adding New Features
- Custom components go in `src/components/`
- Icons and assets in `src/lib/source.ts`
- Layout changes in `src/app/layout.config.tsx`

### Build and Deploy
- Staging: `bun run deploy:staging`
- Production: `bun run deploy`
- Uses Cloudflare Pages for hosting

## Site Configuration

### Themes and Styling
- Custom themes in component configuration
- TailwindCSS for styling
- Dark/light mode disabled by default

### Search and AI Features
- AI search integration
- Custom search dialog component
- Support center integration

## Performance Considerations
- Images automatically optimized during build
- Static site generation for fast loading
- CDN distribution via Cloudflare
- Build caching with Turbo for fast rebuilds

## Troubleshooting Site Issues

### Build Failures
- Check for syntax errors in `.mdx` files
- Verify `meta.json` files are valid JSON
- Run `bun run build` to see detailed error messages

### Development Server Issues
- Clear cache: `rm -rf .next`
- Restart dev server
- Check for port conflicts

### Deployment Issues
- Verify Cloudflare configuration
- Check build logs in deployment dashboard
- Ensure all environment variables are set