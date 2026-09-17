import assert from 'node:assert/strict'
import test from 'node:test'
import { SITE_CONFIG } from '../site.config.ts'
import { t } from '../lib/i18n.ts'
import { listTrips, TRIP_IDS, buildTripItemList } from '../lib/trips.ts'
import { homeWordCount, reviewRows } from '../lib/home-content.ts'
import { withEntityFallback } from '../lib/entity.ts'
import { localAlternates, toAbsolute } from '../lib/hreflang.ts'
import founders from '../content/founders.json' with { type: 'json' }
import reviews from '../content/reviews.json' with { type: 'json' }

// The board's H1 keyword, first words of app/[lang]/page.tsx's home.title string per locale
// (V2-PHASE-9b ticket) — a regression guard, not a translation check.
const H1_KEYWORD: Record<string, string> = {
  en: 'private egypt tours',
  nl: 'privé rondreizen egypte',
  fr: 'voyages privés en égypte',
  el: 'ιδιωτικά ταξίδια στην αίγυπτο',
  tr: 'özel mısır turları',
  es: 'viajes privados a egipto',
}

test('departures board has 8 rows (one per trip) in every locale', () => {
  for (const lang of SITE_CONFIG.locales) {
    assert.equal(listTrips(lang).length, 8)
  }
  assert.equal(TRIP_IDS.length, 8)
})

test('the home ItemList carries all 8 trips, each with a real priced offer', () => {
  // buildTripItemList is the exact function app/[lang]/page.tsx calls (fix round 1, item #17) —
  // this exercises the real code path rather than re-deriving the shape.
  const itemList = buildTripItemList('en', 'https://egyphoria.com', 'Egyphoria private Egypt trips')
  assert.equal(itemList['@type'], 'ItemList')
  assert.equal(itemList.itemListElement.length, 8)
  for (const entry of itemList.itemListElement) {
    assert.equal(entry.item['@type'], 'TouristTrip')
    assert.ok(entry.item.name.length > 0)
    assert.ok(typeof entry.item.offers.price === 'number' && entry.item.offers.price > 0)
    assert.equal(entry.item.offers.priceCurrency, 'USD')
  }
})

// Fix round 1, item #17: asserts the actual composed output of [lang]/layout.tsx (JSON-LD +
// hreflang + canonical) and app/[lang]/page.tsx (H1, ItemList) for /en, calling the real
// functions each renders with rather than re-deriving their shape a second time. Node's plain
// `--experimental-strip-types` runner can't load JSX, so this stops short of an actual render —
// see lib/entity.ts's and lib/trips.ts's own docblocks for why the shared logic was extracted
// into plain .ts functions instead.
test('/en composes exactly one TravelAgency + one ItemList, hreflang x6 + x-default, an absolute canonical, and a keyword-first H1', () => {
  const jsonld = [...withEntityFallback([]), buildTripItemList('en', 'https://egyphoria.com', 'Egyphoria private Egypt trips')]
  const byType = (type: string) => jsonld.filter((e) => (e as { '@type'?: string })['@type'] === type)
  assert.equal(byType('TravelAgency').length, 1)
  assert.equal(byType('ItemList').length, 1)

  // withEntityFallback must be a no-op once the hub already supplies an entity.
  const hubJsonld = withEntityFallback([{ '@type': 'TravelAgency', name: 'Hub-supplied' }])
  assert.equal(hubJsonld.length, 1)

  const alternates = localAlternates('')
  assert.equal(Object.keys(alternates).length, SITE_CONFIG.locales.length + 1)
  for (const lang of SITE_CONFIG.locales) assert.ok(alternates[lang]?.length > 0)
  assert.ok(alternates['x-default']?.length > 0)

  const canonical = toAbsolute('/en')
  assert.ok(canonical.startsWith(SITE_CONFIG.baseUrl), `canonical "${canonical}" is not absolute`)

  assert.ok(t('en', 'home.title').toLowerCase().startsWith('private egypt tours'))
})

test('reviews.json ships empty — the home page renders no reviews section, no heading, no schema', () => {
  assert.ok(Array.isArray(reviews))
  assert.equal(reviews.length, 0)
})

// Fix round 1, item #10: the reviews section now actually renders reviewList (it used to map
// nothing). reviewRows is the exact function app/[lang]/page.tsx calls.
test('reviewRows: one fixture review renders as a quote + name (+ trip), no invented fields', () => {
  assert.deepEqual(reviewRows([{ quote: 'Every detail was handled.', name: 'A. Traveler', trip: 'Egypt, unfolded' }]), [
    { quote: 'Every detail was handled.', label: 'A. Traveler — Egypt, unfolded' },
  ])
  // No trip/date -> just the name, no dangling separator, no stars/rating invented.
  assert.deepEqual(reviewRows([{ quote: 'Great trip.', name: 'B. Traveler' }]), [
    { quote: 'Great trip.', label: 'B. Traveler' },
  ])
})

test('founders.json ships a null photo — the home page renders no founder image until one is supplied', () => {
  assert.equal(founders.photo, null)
})

test('H1 carries the locale keyword, first, in every configured language', () => {
  for (const lang of SITE_CONFIG.locales) {
    const h1 = t(lang, 'home.title').toLowerCase()
    const keyword = H1_KEYWORD[lang]
    assert.ok(keyword, `no expected keyword recorded for locale "${lang}"`)
    assert.ok(h1.startsWith(keyword), `home.title for "${lang}" ("${h1}") does not start with its keyword ("${keyword}")`)
  }
})

test('home page title/description meet 01-site-setup.md / 14-word-count-keyword-rules.md length rules', () => {
  for (const lang of SITE_CONFIG.locales) {
    const title = t(lang, 'home.metaTitle')
    const description = t(lang, 'home.metaDescription')
    assert.ok(title.length <= 60, `"${lang}" title is ${title.length} chars: "${title}"`)
    assert.ok(description.length >= 130 && description.length <= 155, `"${lang}" description is ${description.length} chars: "${description}"`)
  }
})

test('the English home page carries at least 500 words of server-rendered text in <main>', () => {
  assert.ok(homeWordCount('en') >= 500, `en word count was ${homeWordCount('en')}`)
})

test('every locale carries a substantial amount of home page text (no locale left thin)', () => {
  for (const lang of SITE_CONFIG.locales) {
    assert.ok(homeWordCount(lang) >= 300, `"${lang}" word count was ${homeWordCount(lang)}`)
  }
})
