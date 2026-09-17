import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { absoluteUrl, EMPTY_SETTINGS, helpArticleJsonLd, helpBodyHtml } from '@omary98/seo-runtime-core'
import { SeoJsonLd, ShareBlock } from '@omary98/seo-runtime-next'
import { SITE_CONFIG, isRtl } from '@/site.config'
import { seo } from '@/lib/seo'
import { loadHelpEntry } from '@/lib/help'
import { localeFreeMetadata } from '@/lib/page-metadata'

// Locale-free per CONTRACT.md: /help/{slug}, lang from ?lang=.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }
const langOf = (sp: { lang?: string }) => sp.lang ?? SITE_CONFIG.defaultLocale

async function load(slug: string, lang: string) {
  // loadHelpEntry checks the hub (settings.helpEntries[]) before falling back to
  // content/help/<slug>.json (see lib/help.ts) — same precedence lib/tools.ts uses for tools.
  const entry = await loadHelpEntry(slug, lang)
  if (!entry) return null
  const settings = (await seo.config.store.getSettings()) ?? EMPTY_SETTINGS
  const path = `/help/${slug}`
  const resolved = await seo.resolve(path, lang)
  const jsonld = [...resolved.jsonld, helpArticleJsonLd(entry, absoluteUrl(settings, lang, path))]
  return { entry, resolved: { ...resolved, jsonld } }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const lang = langOf(await searchParams)
  const loaded = await load(slug, lang)
  if (!loaded) return {}
  return localeFreeMetadata(`/help/${slug}`, lang)
}

export default async function HelpEntryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const lang = langOf(await searchParams)
  const loaded = await load(slug, lang)
  if (!loaded) notFound()
  return (
    <>
      <SeoJsonLd seo={loaded.resolved} />
      <main dir={isRtl(lang) ? 'rtl' : undefined} dangerouslySetInnerHTML={{ __html: helpBodyHtml(loaded.entry) }} />
      <ShareBlock url={loaded.resolved.canonical} title={loaded.entry.question} />
    </>
  )
}
