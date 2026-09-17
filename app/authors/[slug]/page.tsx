import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EMPTY_SETTINGS, absoluteUrl, personJsonLd, authorBodyHtml } from '@omary98/seo-runtime-core'
import { SeoJsonLd, ShareBlock } from '@omary98/seo-runtime-next'
import { SITE_CONFIG } from '@/site.config'
import { seo } from '@/lib/seo'
import { loadAuthor } from '@/lib/authors'
import { localeFreeMetadata } from '@/lib/page-metadata'

// Locale-free per seo-runtime's CONTRACT.md (v2 fields table): /authors/{slug}, lang from
// ?lang=, default the site's first supported language — not the [lang] path segment.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }
const langOf = (sp: { lang?: string }) => sp.lang ?? SITE_CONFIG.defaultLocale

async function load(slug: string, lang: string) {
  // loadAuthor already checks the hub (settings.authors[]) before falling back to
  // content/authors.json (see lib/authors.ts) — same precedence lib/tools.ts uses for tools.
  const author = await loadAuthor(slug)
  if (!author) return null
  const settings = (await seo.config.store.getSettings()) ?? EMPTY_SETTINGS
  const path = `/authors/${slug}`
  const resolved = await seo.resolve(path, lang)
  const jsonld = [...resolved.jsonld, personJsonLd(author, absoluteUrl(settings, lang, path))]
  return { author, resolved: { ...resolved, jsonld } }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const lang = langOf(await searchParams)
  const loaded = await load(slug, lang)
  if (!loaded) return {}
  return localeFreeMetadata(`/authors/${slug}`, lang)
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { slug } = await params
  const lang = langOf(await searchParams)
  const loaded = await load(slug, lang)
  if (!loaded) notFound()
  return (
    <>
      <SeoJsonLd seo={loaded.resolved} />
      <main dangerouslySetInnerHTML={{ __html: authorBodyHtml(loaded.author) }} />
      <ShareBlock url={loaded.resolved.canonical} title={loaded.author.name} />
    </>
  )
}
