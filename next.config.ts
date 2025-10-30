import { createMDX } from "fumadocs-mdx/next"
import { NextConfig } from "next"
import path from 'path';

const redirectsMapPath = path.resolve(process.cwd(), 'redirects-map');
const { folderRedirectsMap, fileRedirectsMap, externalRedirectsMap } = require(redirectsMapPath);

const withMDX = createMDX()

const config: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Aliases out the eval-based HideIfEmpty to our stub
  // as eval() is not allowed on cloudflare workers, so we need to replace it
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Handle both module path and relative imports from fumadocs-ui
      'fumadocs-ui/components/ui/hide-if-empty':
        path.resolve(__dirname, 'src/components/HideIfEmptyStub.tsx'),
      // Handle the specific fumadocs-ui hide-if-empty component file
      [path.resolve(__dirname, 'node_modules/fumadocs-ui/dist/components/ui/hide-if-empty.js')]:
        path.resolve(__dirname, 'src/components/HideIfEmptyStub.tsx'),
    };
    return config;
  },
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  basePath: '/docs',
  assetPrefix: '/docs',
  async rewrites() {
    return [
      {
        source: '/:path*.md',
        destination: '/api/raw/:path*',
      },
    ];
  },
  async redirects() {
    const redirects = [
       // one-offs that aren't covered by the bulk map
       // note: "/docs/" prefix is auto-added to these strings via "basePath" ^
      { source: '/docs/:path*', destination: '/:path*', permanent: true },
      { source: '/installation-via-rn-expo', destination: '/installation-via-expo', permanent: true },
      // Redirect /index paths to parent directory
      { source: '/:path*/index', destination: '/:path*', permanent: true },
    ]
      
    // auto-generate root-to-folder redirects
    Object.entries(folderRedirectsMap as Record<string, readonly string[]>).forEach(([folder, slugs]) => {
      slugs.forEach((slug) => {
        redirects.push({
          source: `/${slug}`,
          destination: `/${folder}/${slug}`,
          permanent: true,
        })
      })
    })

    // auto-generate file redirects
    Object.entries(fileRedirectsMap as Record<string, string>).forEach(([before, after]) => {
      redirects.push({
        source: `/${before}`,
        destination: `/${after}`,
        permanent: true,
      })
    })

    // external redirects
    Object.entries(externalRedirectsMap as Record<string, string>).forEach(([source, destination]) => {
      redirects.push({
        source: `/${source}`,
        destination: destination,
        permanent: true,
      })
    })

    return redirects;
  },
  reactStrictMode: true,
}

export default withMDX(config)
