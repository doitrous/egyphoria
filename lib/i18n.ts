// Server-side UI-string lookup — the same `S(path, vars)` / `{n}` interpolation the old static
// build's src/client/data.js used, ported to read content/i18n/<lang>.json at render time
// instead of a client-side <script id="egy-data"> blob, since every page here is server-rendered.
import en from '@/content/i18n/en.json'
import nl from '@/content/i18n/nl.json'
import fr from '@/content/i18n/fr.json'
import el from '@/content/i18n/el.json'
import tr from '@/content/i18n/tr.json'
import es from '@/content/i18n/es.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = any

const DICTS: Record<string, Dict> = { en, nl, fr, el, tr, es }

export function dictFor(lang: string): Dict {
  return DICTS[lang] ?? DICTS.en
}

export function fmt(str: unknown, vars: Record<string, string | number> = {}): string {
  return String(str == null ? '' : str).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

/** `t('nav.journal')` against a language's dictionary, falling back to the English string, then
 * to the path itself, so a missing key never renders blank. */
export function t(lang: string, path: string, vars?: Record<string, string | number>): string {
  const lookup = (dict: Dict) => path.split('.').reduce((o: Dict, k: string) => (o == null ? o : o[k]), dict)
  const value = lookup(dictFor(lang)) ?? lookup(DICTS.en)
  return fmt(value ?? path, vars)
}
