// Local fallback for help entries, mirroring lib/tools.ts's LOCAL_TOOLS pattern (static imports,
// not a runtime directory scan): Next's standalone output only traces statically imported files
// into the Docker image (see Dockerfile — only .next/standalone/.next/static/public ship), so a
// fs.readdirSync over content/help at request time would 404 in production even though it works
// in `next dev`. The hub's settings.helpEntries[] wins per (slug, lang) when present, else the
// matching entry here — these five, ported from the old static build's src/content/help.json,
// are the real questions travelers asked before booking (06-help-page.md), English only (the old
// site never translated the help center either).
// V2-PHASE-9b: switched from the `@/` alias to relative imports + explicit `with { type: 'json'
// }` attributes — lib/home-content.ts (test/home.test.ts) now reaches this module through node's
// own ESM loader (`npm test`), which understands neither the alias nor an un-attributed JSON
// import (only Next's bundler does; see lib/trips.ts's identical note). Behaviour is unchanged.
import { EMPTY_SETTINGS, findHelpEntry, type HelpEntry } from '@omary98/seo-runtime-core'
import doINeedAVisa from '../content/help/do-i-need-a-visa-to-visit-egypt.json' with { type: 'json' }
import bestTimeToVisit from '../content/help/best-time-to-visit-egypt.json' with { type: 'json' }
import howMuchDoesATripCost from '../content/help/how-much-does-a-trip-to-egypt-cost.json' with { type: 'json' }
import whatShouldIPack from '../content/help/what-should-i-pack-for-egypt.json' with { type: 'json' }
import isEgyptSafe from '../content/help/is-egypt-safe-for-tourists.json' with { type: 'json' }
import { seo } from './seo.ts'

type LocalHelpFile = Record<string, Omit<HelpEntry, 'slug' | 'lang'>>

const LOCAL_HELP: Record<string, LocalHelpFile> = {
  'do-i-need-a-visa-to-visit-egypt': doINeedAVisa as LocalHelpFile,
  'best-time-to-visit-egypt': bestTimeToVisit as LocalHelpFile,
  'how-much-does-a-trip-to-egypt-cost': howMuchDoesATripCost as LocalHelpFile,
  'what-should-i-pack-for-egypt': whatShouldIPack as LocalHelpFile,
  'is-egypt-safe-for-tourists': isEgyptSafe as LocalHelpFile,
}

export const LOCAL_HELP_SLUGS = Object.keys(LOCAL_HELP)

// Exported for the homepage's "Before you go" notices board (V2-PHASE-9b): it lists the five
// help entries by question text without needing an async hub lookup for a section that's just a
// sourced pointer to /help, not the help center itself.
export function loadLocalHelpEntry(slug: string, lang: string): HelpEntry | null {
  const file = LOCAL_HELP[slug]
  if (!file) return null
  const entry = file[lang] ?? file[Object.keys(file)[0]]
  if (!entry) return null
  return { ...entry, slug, lang }
}

export async function loadHelpEntry(slug: string, lang: string): Promise<HelpEntry | null> {
  const settings = (await seo.config.store.getSettings()) ?? EMPTY_SETTINGS
  const hubEntry = findHelpEntry(settings, slug, lang)
  if (hubEntry) return hubEntry
  return loadLocalHelpEntry(slug, lang)
}

/** Full entry list for /help's index: hub entries for this lang, plus local entries for any
 * slug the hub hasn't overridden. */
export async function loadHelpIndex(lang: string): Promise<HelpEntry[]> {
  const settings = (await seo.config.store.getSettings()) ?? EMPTY_SETTINGS
  const hubEntries = (settings.helpEntries ?? []).filter((e) => e.lang === lang)
  const hubSlugs = new Set(hubEntries.map((e) => e.slug))
  const localEntries = LOCAL_HELP_SLUGS
    .filter((slug) => !hubSlugs.has(slug))
    .map((slug) => loadLocalHelpEntry(slug, lang))
    .filter((e): e is HelpEntry => e !== null)
  return [...hubEntries, ...localEntries]
}
