// Shared by `lib/seo.ts` (server-only, holds the runtime instance) and `proxy.ts` (Next 16's
// proxy convention, Node.js runtime): the store alone is what a proxy needs for redirects and
// the IndexNow key file, so it lives in its own module rather than being re-exported off the
// runtime instance — same split as seo-runtime's own next-demo and yayatours.
import { JsonFileStore } from '@omary98/seo-runtime-core'

export const store = new JsonFileStore(process.env.SEO_STORE_PATH ?? './.data/seo-runtime.json')
