import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ToolRenderer } from '@/packages/tools'
import { toolTitle } from '@/packages/tools/embed'
import { SITE_CONFIG, isRtl } from '@/site.config'
import { seo } from '@/lib/seo'
import { loadTool } from '@/lib/tools'

// The iframe-able view of a tool: the calculator, a link back to the full page, nothing else.
// noindex + canonical to /tools/{slug} so the embed never competes with the real page. Framing
// by other origins relies on the site sending no X-Frame-Options / frame-ancestors (the browser
// default; scripts/smoke.sh checks it stays that way).
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }
const langOf = (sp: { lang?: string }) => sp.lang ?? SITE_CONFIG.defaultLocale

// Tells the host page how tall we are so its <iframe> can grow (the snippet from
// packages/tools/embed.ts listens). '*' target is fine: the message is a single number.
const RESIZE_SCRIPT =
  "new ResizeObserver(function(){parent.postMessage({seoToolHeight:document.documentElement.scrollHeight},'*')}).observe(document.body)"

async function load(slug: string, lang: string) {
  const tool = await loadTool(slug, lang)
  if (!tool) return null
  const resolved = await seo.resolve(`/tools/${slug}`, lang)
  // Absolute even on a cold store (relative canonical until the hub syncs a baseUrl).
  return { tool, canonical: new URL(resolved.canonical, SITE_CONFIG.baseUrl).href }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const loaded = await load(slug, langOf(await searchParams))
  if (!loaded) return {}
  return { title: toolTitle(loaded.tool), robots: { index: false, follow: true }, alternates: { canonical: loaded.canonical } }
}

export default async function ToolEmbedPage({ params, searchParams }: Props) {
  const { slug } = await params
  const lang = langOf(await searchParams)
  const loaded = await load(slug, lang)
  if (!loaded) notFound()
  const { tool, canonical } = loaded
  return (
    <main dir={isRtl(lang) ? 'rtl' : undefined}>
      <ToolRenderer kind={tool.kind} config={tool.config} />
      <p>
        <a href={canonical} target="_top">Full calculator, methodology and FAQ at {SITE_CONFIG.name}</a>
      </p>
      <script dangerouslySetInnerHTML={{ __html: RESIZE_SCRIPT }} />
    </main>
  )
}
