import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Copied to the Dockerfile's runtime stage as .next/standalone — keeps the image to Node plus
  // the traced dependencies rather than all of node_modules.
  output: 'standalone',

  // Next's own trailing-slash redirect runs before proxy.ts ever sees the request, which would
  // pre-empt a hub redirect whose source ends in a slash. This hands trailing-slash handling
  // entirely to withSeoRedirects in proxy.ts, which already normalizes the path before matching
  // (see seo-runtime's packages/CONTRACT.md, "Redirects").
  skipTrailingSlashRedirect: true,

  // 09-images.md: AVIF where the pipeline supports it, WebP as the next choice — next/image
  // negotiates by the request's Accept header and serves the first format here it supports, so
  // listing avif first prefers it without dropping WebP support for browsers that lack it.
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
