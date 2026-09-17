// Journal (the content hub's blog surface, 07-content-hub.md): hub-pushed articles from
// store.listArticles(lang)/findArticleBySlug live alongside the two markdown posts migrated from
// the old static build's src/content/blog/*.md — same local-fallback pattern lib/help.ts uses
// (hub wins on a slug collision, else the local file). Imports `store` directly rather than
// `seo` from './seo' — lib/seo.ts's providerPages() needs LOCAL_JOURNAL_SLUGS/getLocalArticle to
// list the two local posts, so this module must not import back from lib/seo.ts.
import { renderBody, type StoredArticle } from '@omary98/seo-runtime-core'
import howManyDays from '../content/journal/how-many-days-in-egypt.json' with { type: 'json' }
import firstTimePyramids from '../content/journal/first-time-pyramids-of-giza.json' with { type: 'json' }
import { store } from './store.ts'

type LocalJournalEntry = { title: string; description: string; date: string; image: string; category: string; readTime: number; bodyMd: string }
type LocalJournalFile = Record<string, LocalJournalEntry>

// The old site published these two posts in English only (no src/i18n/*.trips.json-style
// per-language body ever existed for the journal) — so every language renders the same real
// English article body under its own /{lang}/journal/{slug} URL, with the site chrome (nav,
// footer, "read more", breadcrumbs) in that language. TODO(omar): commission per-language
// journal translations once there is a native reviewer for nl/fr/el/tr/es body copy.
const LOCAL_JOURNAL: Record<string, LocalJournalFile> = {
  'how-many-days-in-egypt': howManyDays as LocalJournalFile,
  'first-time-pyramids-of-giza': firstTimePyramids as LocalJournalFile,
}

export const LOCAL_JOURNAL_SLUGS = Object.keys(LOCAL_JOURNAL)

/** `[[trip:id|label]]` — the old build's internal-linking shorthand from src/md.mjs, resolved to
 * a real Markdown link before rendering so a journal post keeps linking to its trip pages. */
function resolveTripLinks(md: string, lang: string): string {
  return md.replace(/\[\[trip:([a-z0-9-]+)\|([^\]]+)\]\]/g, (_m, id: string, label: string) => `[${label}](/${lang}/trips/${id})`)
}

export type LocalArticle = {
  slug: string; lang: string; title: string; description: string; date: string
  image: string; category: string; readTime: number; bodyHtml: string
}

export function getLocalArticle(slug: string, lang: string): LocalArticle | null {
  const file = LOCAL_JOURNAL[slug]
  if (!file) return null
  const entry = file[lang] ?? file[Object.keys(file)[0]]
  if (!entry) return null
  return {
    slug, lang, title: entry.title, description: entry.description, date: entry.date,
    image: entry.image, category: entry.category, readTime: entry.readTime,
    bodyHtml: renderBody(resolveTripLinks(entry.bodyMd, lang)),
  }
}

export type JournalListItem = { slug: string; lang: string; title: string; description: string; date: string; image: string | null }

/** /{lang}/journal's index: every hub article for this language plus any local post the hub
 * hasn't taken over (matched by slug), newest first. */
export async function listJournal(lang: string): Promise<JournalListItem[]> {
  const hubArticles = await store.listArticles(lang)
  const hubSlugs = new Set(hubArticles.map((a) => a.slug))
  const local = LOCAL_JOURNAL_SLUGS
    .filter((slug) => !hubSlugs.has(slug))
    .map((slug) => getLocalArticle(slug, lang))
    .filter((a): a is LocalArticle => a !== null)
  const combined: JournalListItem[] = [
    ...hubArticles.map((a) => ({ slug: a.slug, lang: a.lang, title: a.title, description: a.metaDescription, date: a.publishedAt, image: a.imageUrl })),
    ...local.map((a) => ({ slug: a.slug, lang: a.lang, title: a.title, description: a.description, date: a.date, image: a.image })),
  ]
  return combined.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export type LoadedArticle = { kind: 'hub'; article: StoredArticle } | { kind: 'local'; article: LocalArticle }

export async function getArticle(slug: string, lang: string): Promise<LoadedArticle | null> {
  const hub = await store.findArticleBySlug(lang, slug)
  if (hub) return { kind: 'hub', article: hub }
  const local = getLocalArticle(slug, lang)
  if (local) return { kind: 'local', article: local }
  return null
}
