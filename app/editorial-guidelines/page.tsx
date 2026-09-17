import type { Metadata } from 'next'
import { EMPTY_SETTINGS } from '@omary98/seo-runtime-core'
import { editorialBodyHtml, ShareBlock } from '@omary98/seo-runtime-next'
import editorialContent from '@/content/editorial.json'
import { SITE_CONFIG } from '@/site.config'
import { seo } from '@/lib/seo'
import { localeFreeMetadata } from '@/lib/page-metadata'

// Locale-free per CONTRACT.md: /editorial-guidelines, lang from ?lang= — same pattern as /help,
// /authors/{slug} and /tools/{slug}. Always renders 200, hub content or not (01-site-setup.md).
export const dynamic = 'force-dynamic'

const langOf = (sp: { lang?: string }) => sp.lang ?? SITE_CONFIG.defaultLocale

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = langOf(await searchParams)
  return localeFreeMetadata('/editorial-guidelines', lang)
}

export default async function EditorialGuidelinesPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = langOf(await searchParams)
  const settings = (await seo.config.store.getSettings()) ?? EMPTY_SETTINGS
  const resolved = await seo.resolve('/editorial-guidelines', lang)
  // Local fallback ported from the old static build's src/content/editorial.json, English only
  // (same as the old site) — used until the hub sets settings.editorialGuidelinesHtml.
  const local = (editorialContent as Record<string, string>).en
  const effectiveSettings = settings.editorialGuidelinesHtml?.trim() ? settings : { ...settings, editorialGuidelinesHtml: local }
  const html = editorialBodyHtml(effectiveSettings)

  return (
    <>
      <main dangerouslySetInnerHTML={{ __html: html }} />
      <ShareBlock url={resolved.canonical} title="Editorial guidelines" />
    </>
  )
}
