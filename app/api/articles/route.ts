import { seo } from '@/lib/seo'

// CONTRACT.md's Article ingest: the hub POSTs journal articles here. seo.articleHandler is the
// same handleSeoPost('articles') branch as /api/seo/[...seo]'s catch-all, mounted at its own
// path per packages/next/README.md.
export const { POST } = seo.articleHandler
