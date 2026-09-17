// PayTabs Hosted Payment Page — creates a payment and returns its redirect_url. Ported from the
// old static build's api/paytabs-create.js (a Vercel serverless function) to a Next Route
// Handler; same env contract, same server-authoritative price map.
//
// Required environment variables (set these in your host, never commit them):
//   PAYTABS_PROFILE_ID   your PayTabs profile id (number)
//   PAYTABS_SERVER_KEY   your PayTabs server key (secret)
//   PAYTABS_REGION       one of: EGY ARE SAU OMN JOR GLOBAL  (default EGY)
//   PAYTABS_CURRENCY     optional, overrides the default (USD)
//   SITE_URL             optional, e.g. https://egyphoria.com (for the return URL)
//
// ponytail: prices are duplicated here (server-authoritative) — keep in sync with
// lib/trips.ts's TRIP_PRICES. Single-sourcing would pull a lib/ (React-tree-adjacent) module
// into an API route that must never trust the browser; the small duplication is the simpler,
// safer boundary.
import { SITE_CONFIG } from '@/site.config'

const PRICES: Record<string, number> = {
  'egypt-unfolded': 1450, nile: 980, desert: 640, 'red-sea': 890,
  'giza-day': 120, 'cairo-day': 95, 'luxor-day': 180, 'alex-day': 140,
}
const ENDPOINTS: Record<string, string> = {
  EGY: 'https://secure-egypt.paytabs.com', ARE: 'https://secure.paytabs.com',
  SAU: 'https://secure-saudi.paytabs.com', OMN: 'https://secure-oman.paytabs.com',
  JOR: 'https://secure-jordan.paytabs.com', GLOBAL: 'https://secure-global.paytabs.com',
}

export async function POST(req: Request) {
  const { PAYTABS_PROFILE_ID, PAYTABS_SERVER_KEY, PAYTABS_REGION = 'EGY', PAYTABS_CURRENCY, SITE_URL } = process.env
  if (!PAYTABS_PROFILE_ID || !PAYTABS_SERVER_KEY) {
    return Response.json({ error: 'Payment not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>)
  const tripId = String(body.tripId ?? '')
  const amount = PRICES[tripId]
  if (!amount) return Response.json({ error: 'Unknown trip' }, { status: 400 })

  const base = ENDPOINTS[PAYTABS_REGION] ?? ENDPOINTS.EGY
  const origin = SITE_URL || new URL(req.url).origin || SITE_CONFIG.baseUrl
  const lang = SITE_CONFIG.locales.includes(String(body.lang)) ? String(body.lang) : SITE_CONFIG.defaultLocale
  const returnPath = `/${lang}/booking/complete`

  const payload = {
    profile_id: Number(PAYTABS_PROFILE_ID),
    tran_type: 'sale',
    tran_class: 'ecom',
    cart_id: `egy-${tripId}-${Date.now()}`,
    cart_description: `Egyphoria — ${body.tripName ?? tripId}`,
    cart_currency: PAYTABS_CURRENCY || 'USD',
    cart_amount: amount,
    callback: `${origin}/api/paytabs/callback`,
    return: `${origin}${returnPath}`,
    hide_shipping: true,
    paypage_lang: lang,
  }

  try {
    const r = await fetch(`${base}/payment/request`, {
      method: 'POST',
      headers: { authorization: PAYTABS_SERVER_KEY, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    if (data.redirect_url) return Response.json({ redirect_url: data.redirect_url, tran_ref: data.tran_ref })
    return Response.json({ error: data.message || 'Payment could not be started' }, { status: 200 })
  } catch {
    return Response.json({ error: 'Payment gateway unreachable' }, { status: 502 })
  }
}
