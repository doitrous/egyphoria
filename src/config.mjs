// Egyphoria — single source of truth for the build pipeline.
// Edit prices, languages and site-wide settings here.

export const site = {
  domain: 'https://egyphoria.com',
  name: 'Egyphoria',
  tagline: 'Egypt, beyond the expected.',
  email: 'hello@egyphoria.com',            // TODO: confirm real contact email
  currency: 'USD',                          // PayTabs transaction currency
  currencySymbol: '$',
};

// Languages. `en` is the default and lives at the site root (/).
// Every other language lives under /<code>/. Add a language by adding an
// entry here and a matching src/i18n/<code>.json — the build picks it up.
export const languages = [
  { code: 'en', label: 'English',   dir: 'ltr', ogLocale: 'en_US' },
  { code: 'nl', label: 'Nederlands', dir: 'ltr', ogLocale: 'nl_NL' },
  { code: 'fr', label: 'Français',  dir: 'ltr', ogLocale: 'fr_FR' },
  { code: 'el', label: 'Ελληνικά',  dir: 'ltr', ogLocale: 'el_GR' },
  { code: 'tr', label: 'Türkçe',    dir: 'ltr', ogLocale: 'tr_TR' },
  { code: 'es', label: 'Español',   dir: 'ltr', ogLocale: 'es_ES' },
];
export const defaultLang = 'en';

// Per-trip pricing (per person). PLACEHOLDERS — replace with real prices.
// `from` true renders "from <price>". Keyed by trip id from trips.mjs.
export const prices = {
  'egypt-unfolded': { amount: 1450, from: true },
  'nile':           { amount: 980,  from: true },
  'desert':         { amount: 640,  from: true },
  'red-sea':        { amount: 890,  from: true },
  'giza-day':       { amount: 120,  from: false },
  'cairo-day':      { amount: 95,   from: false },
  'luxor-day':      { amount: 180,  from: false },
  'alex-day':       { amount: 140,  from: false },
};

export function formatPrice(id) {
  const p = prices[id];
  if (!p) return '';
  return `${p.from ? 'from ' : ''}${site.currencySymbol}${p.amount.toLocaleString('en-US')}`;
}
