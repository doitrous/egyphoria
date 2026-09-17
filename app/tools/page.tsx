import { EMPTY_SETTINGS } from '@omary98/seo-runtime-core'
import { SITE_CONFIG } from '@/site.config'
import { seo } from '@/lib/seo'
import { LOCAL_TOOL_SLUGS } from '@/lib/tools'

export const dynamic = 'force-dynamic'

export default async function ToolsIndexPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = (await searchParams).lang ?? SITE_CONFIG.defaultLocale
  const settings = (await seo.config.store.getSettings()) ?? EMPTY_SETTINGS
  const hubSlugs = (settings.tools ?? []).filter((t) => t.lang === lang).map((t) => t.slug)
  const slugs = [...new Set([...hubSlugs, ...LOCAL_TOOL_SLUGS])]

  return (
    <main>
      <h1>Tools</h1>
      <ul>
        {slugs.map((slug) => (
          <li key={slug}>
            <a href={`/tools/${slug}?lang=${lang}`}>{slug}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
