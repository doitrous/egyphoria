// Local fallback for author bios, mirroring lib/tools.ts's LOCAL_TOOLS pattern: the hub's
// settings.authors[] wins when present, else content/authors.json — so a new site ships a
// working /authors/{slug} page before any hub profile exists, the same guarantee tools already
// have.
import { EMPTY_SETTINGS, findAuthor, type Author } from '@omary98/seo-runtime-core'
import authorsFile from '@/content/authors.json'
import { seo } from './seo'

type LocalAuthorFile = Record<string, Omit<Author, 'slug'>>

const LOCAL_AUTHORS = authorsFile as LocalAuthorFile

export const LOCAL_AUTHOR_SLUGS = Object.keys(LOCAL_AUTHORS)

function loadLocalAuthor(slug: string): Author | null {
  const entry = LOCAL_AUTHORS[slug]
  if (!entry) return null
  return { ...entry, slug }
}

export async function loadAuthor(slug: string): Promise<Author | null> {
  const settings = (await seo.config.store.getSettings()) ?? EMPTY_SETTINGS
  const hubAuthor = findAuthor(settings, slug)
  if (hubAuthor) return hubAuthor
  return loadLocalAuthor(slug)
}
