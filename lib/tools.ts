import { EMPTY_SETTINGS, findTool, type Tool } from '@omary98/seo-runtime-core'
import tripCost from '@/content/tools/trip-cost.json'
import { seo } from './seo'

export type LocalTool = Tool & { faq?: { q: string; a: string }[] }
type LocalToolFile = Record<string, Omit<LocalTool, 'slug' | 'lang'>>

// Egyphoria ships one tool (the trip cost estimator, ported from the old static build's
// src/content/tools/trip-cost.json). Adding a second means adding an import + a map entry here,
// same pattern site-template's own lib/tools.ts uses for its two demo tools.
const LOCAL_TOOLS: Record<string, LocalToolFile> = {
  'trip-cost': tripCost as LocalToolFile,
}

export const LOCAL_TOOL_SLUGS = Object.keys(LOCAL_TOOLS)

function loadLocalTool(slug: string, lang: string): LocalTool | null {
  const file = LOCAL_TOOLS[slug]
  if (!file) return null
  const entry = file[lang] ?? file[Object.keys(file)[0]]
  if (!entry) return null
  return { ...entry, slug, lang }
}

export async function loadTool(slug: string, lang: string): Promise<LocalTool | null> {
  const settings = (await seo.config.store.getSettings()) ?? EMPTY_SETTINGS
  const hubTool = findTool(settings, slug, lang)
  if (hubTool) return hubTool
  return loadLocalTool(slug, lang)
}
