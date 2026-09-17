import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { toolJsonLd } from '@omary98/seo-runtime-core'
import { SeoJsonLd, ShareBlock } from '@omary98/seo-runtime-next'
import { ToolRenderer } from '@/packages/tools'
import { EmbedCode } from '@/packages/tools/EmbedCode'
import { embedSnippet, toolTitle } from '@/packages/tools/embed'
import { SITE_CONFIG, isRtl } from '@/site.config'
import { seo } from '@/lib/seo'
import { loadTool, type LocalTool } from '@/lib/tools'
import { localeFreeMetadata } from '@/lib/page-metadata'

// Locale-free per CONTRACT.md's v2 fields table: /tools/{slug}, lang from ?lang=.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }
const langOf = (sp: { lang?: string }) => sp.lang ?? SITE_CONFIG.defaultLocale

function faqPageJsonLd(tool: LocalTool, canonical: string) {
  if (!tool.faq?.length) return null
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage', '@id': `${canonical}#faq`,
    mainEntity: tool.faq.map((f) => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

async function load(slug: string, lang: string) {
  const tool = await loadTool(slug, lang)
  if (!tool) return null
  const path = `/tools/${slug}`
  const resolved = await seo.resolve(path, lang)
  const faq = faqPageJsonLd(tool, resolved.canonical)
  const jsonld = [...resolved.jsonld, toolJsonLd(tool, resolved.canonical), ...(faq ? [faq] : [])]
  return { tool, resolved: { ...resolved, jsonld } }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const lang = langOf(await searchParams)
  const loaded = await load(slug, lang)
  if (!loaded) return {}
  return localeFreeMetadata(`/tools/${slug}`, lang)
}

export default async function ToolPage({ params, searchParams }: Props) {
  const { slug } = await params
  const lang = langOf(await searchParams)
  const loaded = await load(slug, lang)
  if (!loaded) notFound()
  const { tool, resolved } = loaded
  // The canonical is relative until the hub has synced a baseUrl; SITE_CONFIG.baseUrl fills in.
  // A localhost origin means SITE_URL is unset — never hand that out in a snippet.
  const origin = new URL(resolved.canonical, SITE_CONFIG.baseUrl).origin
  const embed = origin.includes('localhost') ? null : embedSnippet({ origin, slug, lang, title: toolTitle(tool), siteName: SITE_CONFIG.name })

  return (
    <>
      <SeoJsonLd seo={loaded.resolved} />
      <main dir={isRtl(lang) ? 'rtl' : undefined}>
        {/* ponytail: the shared kit's own <ToolRenderer/> heading is an h2 (it's also embedded on
            /tools' listing), so this page's one-h1 rule needs its own h1 here — same title, page
            scope. */}
        <h1>{toolTitle(tool)}</h1>
        <ToolRenderer kind={tool.kind} config={tool.config} />
        {tool.methodologyHtml && (
          <section>
            <h2>Methodology</h2>
            <div dangerouslySetInnerHTML={{ __html: tool.methodologyHtml }} />
          </section>
        )}
        {tool.dataSource && (
          <p>
            Data source: {tool.dataSource}
            {tool.asOf ? ` (as of ${tool.asOf})` : ''}
          </p>
        )}
        {tool.faq?.length ? (
          <section>
            <h2>FAQ</h2>
            {tool.faq.map((f) => (
              <div key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>
        ) : null}
        {embed && (
          <section>
            <h2>Embed this calculator</h2>
            <p>Paste this on your own site. It works anywhere HTML does; please keep the credit link.</p>
            <EmbedCode code={embed} />
          </section>
        )}
      </main>
      <ShareBlock url={resolved.canonical} title={toolTitle(tool)} />
    </>
  )
}
