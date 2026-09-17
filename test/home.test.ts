import assert from 'node:assert/strict'
import test from 'node:test'
import { SITE_CONFIG } from '../site.config.ts'
import { t } from '../lib/i18n.ts'
import { listTrips, TRIP_IDS, TRIP_PRICES, CURRENCY } from '../lib/trips.ts'
import { homeWordCount } from '../lib/home-content.ts'
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

test('the home ItemList would carry all 8 trips, each with a real priced offer', () => {
  const trips = listTrips('en')
  const itemListElement = trips.map((trip, i) => ({
    position: i + 1,
    item: { name: trip.name, offers: { price: TRIP_PRICES[trip.id]?.amount, priceCurrency: CURRENCY } },
  }))
  assert.equal(itemListElement.length, 8)
  for (const entry of itemListElement) {
    assert.ok(entry.item.name.length > 0)
    assert.ok(typeof entry.item.offers.price === 'number' && entry.item.offers.price > 0)
    assert.equal(entry.item.offers.priceCurrency, 'USD')
  }
})

test('reviews.json ships empty — the home page renders no reviews section, no heading, no schema', () => {
  assert.ok(Array.isArray(reviews))
  assert.equal(reviews.length, 0)
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
