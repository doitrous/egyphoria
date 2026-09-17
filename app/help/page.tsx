import type { Metadata } from 'next'
import { EMPTY_SETTINGS } from '@omary98/seo-runtime-core'
import { helpIndexBodyHtml, ShareBlock } from '@omary98/seo-runtime-next'
import { SITE_CONFIG } from '@/site.config'
import { seo } from '@/lib/seo'
import { loadHelpIndex } from '@/lib/help'
import { localeFreeMetadata } from '@/lib/page-metadata'

// Locale-free per CONTRACT.md: /help, lang from ?lang=.
export const dynamic = 'force-dynamic'

const langOf = (sp: { lang?: string }) => sp.lang ?? SITE_CONFIG.defaultLocale

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = langOf(await searchParams)
  return localeFreeMetadata('/help', lang)
}

export default async function HelpIndexPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = langOf(await searchParams)
  // loadHelpIndex merges the hub's settings.helpEntries[] with the content/help/ local fallback
  // (see lib/help.ts); helpIndexBodyHtml (06-help-page.md's shared index helper, the same one
  // Express/Laravel render from) renders that combined list, so this page carries no listing
  // markup of its own.
  const entries = await loadHelpIndex(lang)
  const resolved = await seo.resolve('/help', lang)
  const html = helpIndexBodyHtml({ ...EMPTY_SETTINGS, helpEntries: entries }, lang)

  return (
    <>
      <main dangerouslySetInnerHTML={{ __html: html }} />
      <ShareBlock url={resolved.canonical} title="Help" />
    </>
  )
}
