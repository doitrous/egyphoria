import { headers } from 'next/headers'
import { Archivo, Archivo_Narrow, Roboto, Roboto_Condensed } from 'next/font/google'
import { SITE_CONFIG, isRtl } from '@/site.config'
import './globals.css'

// V2-PHASE-9b: Archivo Narrow (the board, H1, every number, buttons) and Archivo (reading text)
// — self-hosted via next/font/google, `display: 'swap'`, `latin` + `latin-ext` (tr/nl/fr need
// latin-ext). Neither typeface ships a `greek` subset on Google Fonts at all — next/font's own
// type for both functions only ever accepts `'latin' | 'latin-ext' | 'vietnamese'` (see
// node_modules/next/dist/compiled/@next/font/dist/google/index.d.ts) — so `el` pages need a
// second, real condensed/reading face rather than Archivo's own letterforms.
//
// Fix round 1, blocker #4: Roboto Condensed / Roboto both do ship a `greek` subset. Both are
// loaded `subsets: ['greek']` only (no reason to duplicate latin glyphs Archivo already
// covers). In --serif/--sans (app/globals.css) the real family names are listed BEFORE the
// next/font variables: the generated "Archivo Narrow Fallback" face covers U+0-10FFFF and
// would otherwise swallow Greek before the per-glyph walk ever reaches Roboto.
const archivoNarrow = Archivo_Narrow({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '700'],
  display: 'swap',
  variable: '--font-board',
})
const robotoCondensedGreek = Roboto_Condensed({
  subsets: ['greek'],
  weight: ['500', '700'],
  display: 'swap',
  variable: '--font-board-greek',
})
const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-reading',
})
const robotoGreek = Roboto({
  subsets: ['greek'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-reading-greek',
})

// The direction contract (V2-PHASE-9b, seed e16ed12d) — pinned, not a working note. Ships
// verbatim as the first thing inside <body> so a reviewer (or a `curl | grep e16ed12d`) can
// verify the built page still carries the brief it was built from. React/JSX has no way to
// render a bare HTML comment as a literal DOM sibling without an element wrapping it, so this
// is emitted via `dangerouslySetInnerHTML` on a single zero-content <div> — the smallest
// wrapper that still puts the comment first in <body>'s rendered markup.
const DIRECTION_CONTRACT = `<!--
THESIS: Sell a private Egypt trip the way Europeans already trust travel — as an honest board of places, days, prices and connections — and refuse the category default of a full-bleed pyramid hero with a search box over it.
OWN-WORLD: Signal blue (#0b2f6b) fields that own whole regions (header band, board frame, builder strip, footer), white ruled boards, one sun-yellow (#f2c10f) reserved for the primary action and the "your trip" row, ink #15181d, hairline rules #cfd6e3; Archivo Narrow for the board, H1 and every number; Archivo for reading text; full-bleed station photographs only between boards, never behind text.
STORY: In one viewport the visitor sees eight real trips with real per-person prices and days, understands this is a private, priced, planned trip in their own language, and presses the yellow "Build my itinerary" platform button; scrolling shows how a week lays out, which destination deserves how many days, who runs it, and where the honest answers live.
FIRST VIEWPORT: Blue header band with white wordmark and keyword menu; below it on white the H1 "Private Egypt tours, planned around your dates" at ~4.5rem Archivo Narrow, a two-line standfirst, the yellow platform button at the right end of the H1 row; beneath, the departures board — a real <table> of the eight trips: PLACE · DAYS · FROM (pp) · BEST MONTHS · → — rows settle in once from the top like flaps; the first photograph appears only after the board.
FORM: The Continental Timetable (Cook's Continental Timetable / European departure boards), grounded candidate 5 of 7, seed e16ed12d.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`

// The only <html>/<body> in the tree — Next allows exactly one. It has no route params of its
// own (it sits above [lang] and above the locale-free authors/help/tools/seo-admin routes), so
// the resolved locale rides in on a request header set by proxy.ts. Those locale-free routes
// carry no such header; they fall back to the site's default locale and its writing direction.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const lang = requestHeaders.get('x-site-lang') ?? SITE_CONFIG.defaultLocale
  return (
    <html
      lang={lang}
      dir={isRtl(lang) ? 'rtl' : 'ltr'}
      className={`${archivoNarrow.variable} ${archivo.variable} ${robotoCondensedGreek.variable} ${robotoGreek.variable}`}
    >
      <body>
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        {children}
      </body>
    </html>
  )
}
