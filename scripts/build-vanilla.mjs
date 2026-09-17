// Bundles packages/tools/vanilla.ts into public/seo-tools.js — a framework-free IIFE for
// non-Next consumers (Laravel, static HTML). Run via `npm run build:vanilla`; also runs in
// `prebuild`; test/tools.test.ts fails if the committed bundle drifts from the source.
import { build } from 'esbuild'

await build({
  entryPoints: ['packages/tools/vanilla.ts'],
  outfile: 'public/seo-tools.js',
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  logLevel: 'info',
})
