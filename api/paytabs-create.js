// PayTabs Hosted Payment Page — creates a payment and returns its redirect_url.
// Runs as a serverless function (Vercel/Netlify/Cloudflare-compatible Node
// handler). The PayTabs server key is a SECRET and must only live in env vars.
//
// Required environment variables (set these in your host, never commit them):
//   PAYTABS_PROFILE_ID   your PayTabs profile id (number)
//   PAYTABS_SERVER_KEY   your PayTabs server key (secret)
//   PAYTABS_REGION       one of: EGY ARE SAU OMN JOR GLOBAL  (default EGY)
//   PAYTABS_CURRENCY     optional, overrides the default (USD)
//   SITE_URL             optional, e.g. https://egyphoria.com (for callbacks)
//
// ponytail: prices are duplicated here (server-authoritative) — keep in sync
// with src/config.mjs. Single-sourcing would require bundling the ESM config.

const PRICES = {
  'egypt-unfolded': 1450, 'nile': 980, 'desert': 640, 'red-sea': 890,
  'giza-day': 120, 'cairo-day': 95, 'luxor-day': 180, 'alex-day': 140,
};
const ENDPOINTS = {
  EGY: 'https://secure-egypt.paytabs.com', ARE: 'https://secure.paytabs.com',
  SAU: 'https://secure-saudi.paytabs.com', OMN: 'https://secure-oman.paytabs.com',
  JOR: 'https://secure-jordan.paytabs.com', GLOBAL: 'https://secure-global.paytabs.com',
};

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }
  const { PAYTABS_PROFILE_ID, PAYTABS_SERVER_KEY, PAYTABS_REGION = 'EGY', PAYTABS_CURRENCY, SITE_URL } = process.env;
  if (!PAYTABS_PROFILE_ID || !PAYTABS_SERVER_KEY) {
    res.statusCode = 500; res.setHeader('content-type', 'application/json');
    return res.end(JSON.stringify({ error: 'Payment not configured' }));
  }
  const body = await readBody(req);
  const tripId = String(body.tripId || '');
  const amount = PRICES[tripId];
  if (!amount) { res.statusCode = 400; res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ error: 'Unknown trip' })); }

  const base = ENDPOINTS[PAYTABS_REGION] || ENDPOINTS.EGY;
  const origin = SITE_URL || (req.headers.origin) || `https://${req.headers.host || 'egyphoria.com'}`;
  const lang = /^(en|nl|fr|el|tr|es)$/.test(body.lang) ? body.lang : 'en';
  const returnPath = lang === 'en' ? '/booking/complete/' : `/${lang}/booking/complete/`;

  const payload = {
    profile_id: Number(PAYTABS_PROFILE_ID),
    tran_type: 'sale',
    tran_class: 'ecom',
    cart_id: `egy-${tripId}-${Date.now()}`,
    cart_description: `Egyphoria — ${body.tripName || tripId}`,
    cart_currency: PAYTABS_CURRENCY || 'USD',
    cart_amount: amount,
    callback: `${origin}/api/paytabs-callback`,
    return: `${origin}${returnPath}`,
    hide_shipping: true,
    paypage_lang: lang,
  };

  try {
    const r = await fetch(`${base}/payment/request`, {
      method: 'POST',
      headers: { 'authorization': PAYTABS_SERVER_KEY, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    res.statusCode = 200; res.setHeader('content-type', 'application/json');
    if (data.redirect_url) return res.end(JSON.stringify({ redirect_url: data.redirect_url, tran_ref: data.tran_ref }));
    return res.end(JSON.stringify({ error: data.message || 'Payment could not be started' }));
  } catch (e) {
    res.statusCode = 502; res.setHeader('content-type', 'application/json');
    return res.end(JSON.stringify({ error: 'Payment gateway unreachable' }));
  }
}
