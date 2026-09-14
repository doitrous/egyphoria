// Egyphoria static build. Zero dependencies. Node >= 18.
//   node build.mjs   →   regenerates dist/ for every language.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src'), DIST = join(ROOT, 'dist');
const { site, languages, defaultLang, prices } = await import('./src/config.mjs');
const { destinations, trips } = await import('./src/trips.mjs');
const { markdown, frontMatter } = await import('./src/md.mjs');

const read = (p) => readFileSync(p, 'utf8');
const json = (p) => JSON.parse(read(p));
const write = (rel, content) => { const p = join(DIST, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content); };
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// truthful lastmod for sitemap entries: a content file's own mtime, in YYYY-MM-DD.
const fileLastmod = (p) => statSync(p).mtime.toISOString().slice(0, 10);

// ---- i18n ----------------------------------------------------------------
const enStrings = json(join(SRC, 'i18n', 'en.json'));
function deepMerge(base, over) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(over || {})) out[k] = (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k])) ? deepMerge(base[k] || {}, over[k]) : over[k];
  return out;
}
function stringsFor(lang) {
  const f = join(SRC, 'i18n', `${lang}.json`);
  return lang === 'en' ? enStrings : deepMerge(enStrings, existsSync(f) ? json(f) : {});
}
// tiny lookup + {var} interpolation for build-time strings
function makeT(strings) {
  return (path, vars = {}) => {
    const v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), strings);
    return String(v == null ? path : v).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
  };
}
// Localised trip/destination content (Phase 2 drops in <lang>.trips.json).
function contentFor(lang) {
  const f = join(SRC, 'i18n', `${lang}.trips.json`);
  const over = lang === 'en' || !existsSync(f) ? {} : json(f);
  const dest = deepMerge(destinations, over.destinations || {});
  const trps = trips.map(t => deepMerge(t, (over.trips || {})[t.id] || {}));
  return { dest, trps };
}

// ---- url helpers ---------------------------------------------------------
const prefix = (lang) => (lang === defaultLang ? '' : `/${lang}`);
const homeUrl = (lang) => `${prefix(lang)}/` || '/';
const tripUrl = (lang, id) => `${prefix(lang)}/trips/${id}/`;
const journalUrl = (lang) => `${prefix(lang)}/journal/`;
const postUrl = (lang, slug) => `${prefix(lang)}/journal/${slug}/`;
const photoUrl = (lang) => `${prefix(lang)}/photography/`;
const abs = (path) => site.domain + path;

// hreflang alternates for a given "page key" function
function alternates(makeUrl) {
  return languages.map(l => `<link rel="alternate" hreflang="${l.code}" href="${abs(makeUrl(l.code))}">`).join('') +
    `<link rel="alternate" hreflang="x-default" href="${abs(makeUrl(defaultLang))}">`;
}

// ---- shared chrome -------------------------------------------------------
const ICON = '<svg class="link-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false"><path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7"/></svg>';

function head({ lang, t, title, description, url, image = '/assets/og-image.jpg', makeUrl, jsonld = '', type = 'website', robots = 'index, follow' }) {
  const L = languages.find(l => l.code === lang);
  return `<!doctype html>
<html lang="${lang}" dir="${L.dir}">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#b51f3e">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
  <link rel="canonical" href="${abs(url)}">
  <meta name="author" content="Egyphoria"><meta name="robots" content="${robots}">
  ${makeUrl ? alternates(makeUrl) : ''}
  <meta property="og:type" content="${type}"><meta property="og:site_name" content="Egyphoria">
  <meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${abs(url)}"><meta property="og:locale" content="${L.ogLocale}">
  <meta property="og:image" content="${abs(image)}"><meta property="og:image:secure_url" content="${abs(image)}">
  <meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(t('meta.title'))}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${abs(image)}">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  ${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
</head>`;
}

function dataScript(payload) {
  // safe JSON embed (no </script> breakout)
  return `<script id="egy-data" type="application/json">${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>`;
}

function langSwitcher(lang, makeUrl, t) {
  const items = languages.map(l => `<a href="${makeUrl(l.code)}"${l.code === lang ? ' aria-current="true"' : ''} lang="${l.code}">${l.label}</a>`).join('');
  return `<div class="lang-switcher"><button class="lang-button" aria-expanded="false" aria-label="${esc(t('nav.language'))}"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"/></svg><span>${lang.toUpperCase()}</span></button><div class="lang-menu">${items}</div></div>`;
}

function header(lang, t, makeUrl) {
  const h = homeUrl(lang);
  return `<a class="skip-link" href="#main">${esc(t('nav.skip'))}</a>
<header class="header">
  <a href="${h}" class="brand" aria-label="${esc(t('nav.home'))}"><span class="logo-window"><img src="/assets/egyphoria-wordmark-hd.png" alt="Egyphoria"></span></a>
  <nav aria-label="Main navigation" id="main-nav"><a href="${h}#journeys">${esc(t('nav.journeys'))}</a><a href="${h}#behind-egyphoria">${esc(t('nav.behind'))}</a><a href="${journalUrl(lang)}">${esc(t('nav.journal'))}</a><a href="${h}#builder">${esc(t('nav.builder'))}</a></nav>
  ${langSwitcher(lang, makeUrl, t)}
  <a class="button small" href="${h}#builder">${esc(t('nav.cta'))} <span aria-hidden="true">${ICON}</span></a>
  <button class="menu-button" aria-label="${esc(t('nav.openMenu'))}" aria-expanded="false" aria-controls="main-nav"><span></span><span></span></button>
</header>`;
}

function footer(lang, t) {
  const h = homeUrl(lang);
  return `<footer class="footer"><a href="${h}" class="brand" aria-label="${esc(t('nav.home'))}"><span class="logo-window"><img src="/assets/egyphoria-wordmark-hd.png" alt="Egyphoria" loading="lazy"></span></a><p>${esc(t('footer.tagline'))}</p><nav aria-label="Footer navigation"><a href="${h}#journeys">${esc(t('footer.explore'))}</a><a href="${h}#behind-egyphoria">${esc(t('footer.behind'))}</a><a href="${journalUrl(lang)}">${esc(t('footer.journal'))}</a><a href="${h}#builder">${esc(t('footer.builder'))}</a></nav><div class="footer-bottom"><span>© <span id="year">${new Date().getFullYear()}</span> Egyphoria. ${esc(t('footer.rights'))}</span><span><a href="${photoUrl(lang)}">${esc(t('footer.photography'))}</a> · ${esc(t('footer.madeWith'))}</span></div></footer>`;
}

// plan dialog (edit → details → done). Shared on home + trip pages.
function planDialog(t) {
  return `<dialog id="plan-dialog" aria-labelledby="plan-title">
  <div class="plan-dialog-header"><div><p class="eyebrow burgundy">${esc(t('plan.eyebrow'))}</p><h2 id="plan-title">${esc(t('plan.title'))}</h2></div><button class="dialog-close" aria-label="Close">×</button></div>
  <div class="plan-toolbar" data-view="edit"><p id="plan-summary"></p></div>
  <p class="plan-help" data-view="edit">${esc(t('plan.help'))}</p>
  <div id="plan-days" data-view="edit"></div>
  <div class="plan-bottom" data-view="edit"><button class="button ghost small" type="button" id="refine-plan">${esc(t('plan.refine'))}</button><button class="button small" type="button" id="to-details">${esc(t('plan.next'))} <span aria-hidden="true">${ICON}</span></button></div>
  <form id="details-form" data-view="details" hidden>
    <div class="form-heading"><span class="step-number">02</span><h3>${esc(t('plan.detailsTitle'))}</h3></div>
    <p class="form-lead">${esc(t('plan.detailsIntro'))}</p>
    <div class="form-row"><label>${esc(t('plan.name'))}<input type="text" name="name" id="trav-name" autocomplete="name" required></label><label>${esc(t('plan.emailLabel'))}<input type="email" name="email" autocomplete="email" required></label></div>
    <div class="form-row"><label>${esc(t('plan.startDate'))}<input type="date" name="startDate"></label><label>${esc(t('plan.travelers'))}<input type="number" name="travelers" min="1" max="30" value="2"></label></div>
    <label>${esc(t('plan.notes'))}<textarea name="notes" rows="2"></textarea></label>
    <div class="plan-bottom"><button class="button ghost small" type="button" id="back-to-edit">←</button><button class="button" type="submit">${esc(t('plan.produce'))} <span aria-hidden="true">${ICON}</span></button></div>
  </form>
  <div id="plan-done" data-view="done" hidden>
    <div class="plan-done-mark" aria-hidden="true">✧</div>
    <h3 id="plan-done-title">${esc(t('plan.produced'))}</h3>
    <p class="plan-done-hint">${esc(t('plan.printHint'))}</p>
    <div class="plan-done-actions"><button class="button" type="button" id="download-pdf">${esc(t('plan.downloadPdf'))} <span aria-hidden="true">↓</span></button><button class="button ghost" type="button" id="download-txt">${esc(t('plan.downloadTxt'))}</button></div>
    <button class="text-link" type="button" id="edit-again">← ${esc(t('plan.refine'))}</button>
  </div>
</dialog>
<div class="toast" role="status" id="toast"></div>`;
}

const scripts = (extra = []) => ['/js/app.js', ...extra].map(s => `<script type="module" src="${s}"></script>`).join('') + '<script defer src="/js/motion.js"></script>';

// ---- injected client payload --------------------------------------------
function clientTrips(lang, trps, t) {
  return trps.map(tr => {
    const p = prices[tr.id];
    const priceLabel = p ? `${p.from ? t('journeys.from') + ' ' : ''}${site.currencySymbol}${p.amount.toLocaleString('en-US')}` : '';
    return { ...tr, url: tripUrl(lang, tr.id), priceLabel };
  });
}
function payload(lang, strings, dest, trps, currentTrip = null) {
  const L = languages.find(l => l.code === lang);
  const t = makeT(strings);
  return { lang, dir: L.dir, t: strings, destinations: dest, trips: clientTrips(lang, trps, t), currentTrip };
}

// ---- pages ---------------------------------------------------------------
function homePage(lang) {
  const strings = stringsFor(lang), t = makeT(strings), { dest, trps } = contentFor(lang);
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'TravelAgency', name: 'Egyphoria', description: t('meta.ogDescription'), url: abs(homeUrl(lang)), logo: abs('/assets/egyphoria-icon-hd.png'), image: abs('/assets/og-image.jpg'), areaServed: 'Egypt', slogan: t('footer.tagline') });
  const html = `${head({ lang, t, title: t('meta.title'), description: t('meta.description'), url: homeUrl(lang), makeUrl: homeUrl, jsonld })}
<body>
${header(lang, t, homeUrl)}
<main id="main">
  <section class="hero" aria-labelledby="hero-title">
    <img class="hero-image" src="/assets/giza.jpg" alt="The monumental pyramids of Giza rising from the Egyptian desert" fetchpriority="high">
    <div class="hero-shade"></div>
    <div class="hero-content"><p class="eyebrow"><span class="line"></span> ${esc(t('hero.eyebrow'))}</p><h1 id="hero-title"><span class="hero-line"><span>${esc(t('hero.line1'))}</span></span><span class="hero-line"><span>${esc(t('hero.line2'))}</span></span><span class="hero-line"><em>${esc(t('hero.line3'))}</em></span></h1><p class="hero-description">${t('hero.description')}</p><div class="hero-actions"><a class="button cream" href="#journeys">${esc(t('hero.ctaPrimary'))} <span aria-hidden="true">${ICON}</span></a><a class="text-link light" href="#builder">${esc(t('hero.ctaSecondary'))} <span aria-hidden="true">${ICON}</span></a></div></div>
    <div class="hero-bottom"><p><span class="location-mark" aria-hidden="true">⌖</span> ${esc(t('hero.location'))} <span class="coordinates">29°58′ N · 31°08′ E</span></p><a href="#journeys" aria-label="${esc(t('hero.scroll'))}">${esc(t('hero.scroll'))} <span aria-hidden="true">↓</span></a></div>
    <div class="hero-side">${esc(t('hero.side'))}</div>
  </section>
  <div class="promise-bar"><span>${esc(t('promise.intro'))}</span><p>${esc(t('promise.a'))}</p><span class="diamond">✧</span><p>${esc(t('promise.b'))}</p><span class="diamond">✧</span><p>${esc(t('promise.c'))}</p><span class="diamond">✧</span><p>${esc(t('promise.d'))}</p></div>
  <section class="journeys section" id="journeys">
    <div class="section-heading" data-reveal><div><p class="eyebrow burgundy">${esc(t('journeys.eyebrow'))}</p><h2>${t('journeys.title')}</h2></div><p>${t('journeys.intro')}</p></div>
    <div class="collection-controls"><div class="filters" role="group" aria-label="Filter journeys"><button class="active" data-filter="all" aria-pressed="true">${esc(t('journeys.filterAll'))}</button><button data-filter="multi" aria-pressed="false">${esc(t('journeys.filterMulti'))}</button><button data-filter="day" aria-pressed="false">${esc(t('journeys.filterDay'))}</button></div><p id="journey-count" aria-live="polite"></p></div>
    <div class="trip-grid" id="trip-grid"></div>
    <p class="collection-note">${esc(t('journeys.note'))} <a href="#builder" aria-label="${esc(t('nav.builder'))}">${ICON}</a></p>
  </section>
  <section class="way section" id="egyphoria-way"><div class="way-photo" data-reveal><img src="/assets/nile.jpg" alt="Sailboats on the Nile in Egypt" loading="lazy"><span class="photo-label">${esc(t('way.photoLabel'))}</span></div><div class="way-copy" data-reveal><p class="eyebrow burgundy">${esc(t('way.eyebrow'))}</p><h2>${t('way.title')}</h2><p>${esc(t('way.p1'))}</p><p>${esc(t('way.p2'))}</p><div class="way-point"><span>01</span><div><h3>${esc(t('way.point1Title'))}</h3><p>${esc(t('way.point1Text'))}</p></div></div><div class="way-point"><span>02</span><div><h3>${esc(t('way.point2Title'))}</h3><p>${esc(t('way.point2Text'))}</p></div></div><a class="text-link" href="#builder">${esc(t('way.cta'))} <span aria-hidden="true">${ICON}</span></a></div></section>
  <section class="behind section" id="behind-egyphoria" aria-labelledby="behind-title">
    <div class="behind-identity" data-reveal><p class="eyebrow burgundy">${esc(t('behind.eyebrowIdentity'))}</p><div class="behind-symbol"><img src="/assets/egyphoria-icon-hd.png" alt="Egyphoria's signature e icon with a burgundy rising sun" width="1254" height="1254" loading="lazy"></div><p class="behind-signature">${t('behind.signature')}</p></div>
    <div class="behind-copy" data-reveal><p class="eyebrow burgundy">${esc(t('behind.eyebrow'))}</p><h2 id="behind-title">${t('behind.title')}</h2><p>${esc(t('behind.p1'))}</p><p>${esc(t('behind.p2'))}</p><div class="behind-founders"><span class="eyebrow burgundy">${esc(t('behind.foundersLabel'))}</span><p>${esc(t('behind.founders'))}</p></div><div class="behind-principle"><span aria-hidden="true">“</span><p>${t('behind.principle')}</p></div><a href="#builder" class="text-link">${esc(t('behind.cta'))} <span aria-hidden="true">${ICON}</span></a></div>
  </section>
  <section class="builder section" id="builder"><div class="builder-intro" data-reveal><p class="eyebrow">${esc(t('builder.eyebrow'))}</p><h2>${t('builder.title')}</h2><p>${t('builder.intro')}</p></div>
  <div class="builder-panel"><form id="builder-form"><div class="form-heading"><span class="step-number">01</span><h3>${esc(t('builder.step1'))}</h3></div><fieldset><legend>${esc(t('builder.whereLegend'))}</legend><div class="destination-options" id="destination-options"></div></fieldset><div class="form-row"><label>${esc(t('builder.daysLabel'))}<select id="duration" name="duration"><option value="3">${t('builder.daysOption', { n: 3 })}</option><option value="5">${t('builder.daysOption', { n: 5 })}</option><option value="7" selected>${t('builder.daysOption', { n: 7 })}</option><option value="10">${t('builder.daysOption', { n: 10 })}</option><option value="14">${t('builder.daysOption', { n: 14 })}</option></select></label><label>${esc(t('builder.paceLabel'))}<select id="pace" name="pace"><option value="balanced">${esc(t('builder.paceBalanced'))}</option><option value="slow">${esc(t('builder.paceSlow'))}</option><option value="full">${esc(t('builder.paceFull'))}</option></select></label></div><fieldset><legend>${esc(t('builder.interestsLegend'))}</legend><div class="interest-options"><label><input type="checkbox" value="history" checked><span>${esc(t('builder.interestHistory'))}</span></label><label><input type="checkbox" value="culture" checked><span>${esc(t('builder.interestCulture'))}</span></label><label><input type="checkbox" value="nature"><span>${esc(t('builder.interestNature'))}</span></label><label><input type="checkbox" value="relax"><span>${esc(t('builder.interestRelax'))}</span></label></div></fieldset><p id="builder-error" class="form-error" role="alert"></p><button class="button" type="submit">${esc(t('builder.submit'))} <span aria-hidden="true">${ICON}</span></button><p class="form-note">${esc(t('builder.formNote'))}</p></form><div class="builder-preview"><div class="preview-top"><span class="eyebrow">${esc(t('builder.previewLabel'))}</span><span class="sun-symbol" aria-hidden="true">☀</span></div><h3>${t('builder.previewTitle')}</h3><div class="sample-route"><div><span>01—03</span><p>${esc(t('builder.sample1'))}<small>${esc(t('builder.sample1Note'))}</small></p></div><div><span>04—05</span><p>${esc(t('builder.sample2'))}<small>${esc(t('builder.sample2Note'))}</small></p></div><div><span>06—07</span><p>${esc(t('builder.sample3'))}<small>${esc(t('builder.sample3Note'))}</small></p></div></div><p class="preview-note">${esc(t('builder.previewNote'))}</p></div></div></section>
  <section class="closing section" data-reveal><p class="eyebrow burgundy">${esc(t('closing.eyebrow'))}</p><h2>${t('closing.title')}</h2><a href="#builder" class="button">${esc(t('closing.cta'))} <span aria-hidden="true">${ICON}</span></a></section>
</main>
${footer(lang, t)}
${planDialog(t)}
${dataScript(payload(lang, strings, dest, trps))}
${scripts(['/js/itinerary.js'])}
</body></html>`;
  write(join(prefix(lang), 'index.html'), html);
}

function tripPage(lang, trip) {
  const strings = stringsFor(lang), t = makeT(strings), { dest, trps } = contentFor(lang);
  const localTrip = trps.find(x => x.id === trip.id);
  const p = prices[trip.id];
  const priceLabel = p ? `${p.from ? t('journeys.from') + ' ' : ''}${site.currencySymbol}${p.amount.toLocaleString('en-US')}` : '';
  const makeUrl = (l) => tripUrl(l, trip.id);
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'TouristTrip', name: localTrip.name, description: localTrip.detail,
    url: abs(tripUrl(lang, trip.id)), image: abs(`/assets/${trip.image}.jpg`), touristType: 'Leisure',
    ...(p ? { offers: { '@type': 'Offer', price: p.amount, priceCurrency: site.currency, availability: 'https://schema.org/InStock', url: abs(tripUrl(lang, trip.id)) } } : {}),
    provider: { '@type': 'TravelAgency', name: 'Egyphoria', url: abs(homeUrl(lang)) },
  });
  const related = trps.filter(x => x.id !== trip.id && x.kind === localTrip.kind).slice(0, 3);
  const highlights = localTrip.highlights.map(h => { const [time, text] = h.split('|'); return `<li><span>${esc(time)}</span><p>${esc(text)}</p></li>`; }).join('');
  const html = `${head({ lang, t, title: `${localTrip.name} — Egyphoria`, description: localTrip.description, url: tripUrl(lang, trip.id), image: `/assets/${trip.image}.jpg`, makeUrl, jsonld, type: 'article' })}
<body class="trip-body">
${header(lang, t, makeUrl)}
<main id="main" class="trip-page">
  <section class="trip-hero"><img src="/assets/${trip.image}.jpg" alt="${esc(localTrip.name)}"><div class="trip-hero-shade"></div>
    <div class="trip-hero-inner"><a class="trip-back" href="${homeUrl(lang)}#journeys">← ${esc(t('trip.back'))}</a><p class="eyebrow light">${esc(localTrip.tag)}</p><h1>${esc(localTrip.name)}</h1><p class="trip-hero-meta">${esc(localTrip.location)} · ${localTrip.days} ${localTrip.days === 1 ? esc(t('journeys.day')) : esc(t('journeys.days'))}</p></div>
  </section>
  <section class="trip-detail section">
    <div class="trip-detail-main">
      <p class="trip-lead">${esc(localTrip.detail)}</p>
      <h2 class="trip-h">${esc(t('trip.highlights'))}</h2>
      <ul class="detail-route">${highlights}</ul>
      <p class="detail-disclaimer">${esc(t('trip.disclaimer'))}</p>
    </div>
    <aside class="trip-aside">
      <div class="trip-card-price">
        ${priceLabel ? `<p class="price-big">${esc(priceLabel)}</p><p class="price-note">${esc(t('trip.priceNote'))}</p>` : ''}
        <button class="button" id="book-trip" type="button"><span class="btn-label">${esc(t('trip.book'))}</span> <span aria-hidden="true">${ICON}</span></button>
        <button class="button ghost" id="make-mine" type="button">${esc(t('trip.makeMine'))}</button>
      </div>
    </aside>
  </section>
  ${related.length ? `<section class="section related"><h2>${esc(t('trip.related'))}</h2><div class="trip-grid">${related.map(r => { const rp = prices[r.id]; const rl = rp ? `${rp.from ? t('journeys.from') + ' ' : ''}${site.currencySymbol}${rp.amount.toLocaleString('en-US')}` : ''; return `<article class="trip-card"><a class="trip-image" href="${tripUrl(lang, r.id)}"><img src="/assets/${r.image}.jpg" alt="${esc(r.name)}" loading="lazy">${rl ? `<span class="trip-price">${esc(rl)}</span>` : ''}<span class="trip-badge">${esc(r.tag)}</span></a><p class="trip-meta">${esc(r.location)}</p><h3><a href="${tripUrl(lang, r.id)}">${esc(r.name)}</a></h3><p class="trip-description">${esc(r.description)}</p></article>`; }).join('')}</div></section>` : ''}
</main>
${footer(lang, t)}
${planDialog(t)}
${dataScript(payload(lang, strings, dest, trps, localTrip))}
${scripts(['/js/itinerary.js', '/js/trip.js'])}
</body></html>`;
  write(join(prefix(lang), 'trips', trip.id, 'index.html'), html);
}

// ---- journal / content hub ----------------------------------------------
function loadPosts() {
  const dir = join(SRC, 'content', 'blog');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.md')).map(f => {
    const p = join(dir, f);
    const { data, body } = frontMatter(read(p));
    return { slug: data.slug || f.replace(/\.md$/, ''), ...data, body, lastmod: data.date || fileLastmod(p) };
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
const ALL_POSTS = loadPosts();

function postsFor(lang) {
  const inLang = ALL_POSTS.filter(p => (p.lang || 'en') === lang);
  return inLang.length ? inLang : ALL_POSTS.filter(p => (p.lang || 'en') === 'en');
}

function journalIndex(lang) {
  const strings = stringsFor(lang), t = makeT(strings);
  const posts = postsFor(lang);
  const cards = posts.map(p => `<article class="post-card"><a href="${postUrl(lang, p.slug)}">${p.image ? `<img src="/assets/${p.image}.jpg" alt="${esc(p.title)}" loading="lazy">` : ''}<div class="post-card-body"><p class="eyebrow burgundy">${esc(p.category || t('journal.eyebrow'))}</p><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><span class="text-link">${esc(t('journal.readMore'))} →</span></div></a></article>`).join('');
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Blog', name: t('journal.title'), url: abs(journalUrl(lang)), inLanguage: lang });
  const html = `${head({ lang, t, title: `${t('journal.title')} — Egyphoria`, description: t('journal.intro'), url: journalUrl(lang), makeUrl: journalUrl, jsonld })}
<body>
${header(lang, t, journalUrl)}
<main id="main" class="section journal-index">
  <div class="section-heading"><div><p class="eyebrow burgundy">${esc(t('journal.eyebrow'))}</p><h1>${esc(t('journal.title'))}</h1></div><p>${esc(t('journal.intro'))}</p></div>
  <div class="post-grid">${cards || '<p>Coming soon.</p>'}</div>
</main>
${footer(lang, t)}
${dataScript({ lang, t: strings })}
${scripts()}
</body></html>`;
  write(join(prefix(lang), 'journal', 'index.html'), html);
}

function journalPost(lang, post) {
  const strings = stringsFor(lang), t = makeT(strings);
  const makeUrl = (l) => postUrl(l, post.slug);
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.description, image: post.image ? abs(`/assets/${post.image}.jpg`) : abs('/assets/og-image.jpg'), datePublished: post.date, inLanguage: lang, author: { '@type': 'Organization', name: 'Egyphoria' }, publisher: { '@type': 'Organization', name: 'Egyphoria', logo: { '@type': 'ImageObject', url: abs('/assets/egyphoria-icon-hd.png') } }, mainEntityOfPage: abs(postUrl(lang, post.slug)) });
  const html = `${head({ lang, t, title: `${post.title} — Egyphoria`, description: post.description, url: postUrl(lang, post.slug), image: post.image ? `/assets/${post.image}.jpg` : '/assets/og-image.jpg', makeUrl, jsonld, type: 'article' })}
<body>
${header(lang, t, makeUrl)}
<main id="main" class="article">
  <a class="trip-back dark" href="${journalUrl(lang)}">← ${esc(t('journal.backToJournal'))}</a>
  <p class="eyebrow burgundy">${esc(post.category || t('journal.eyebrow'))}</p>
  <h1>${esc(post.title)}</h1>
  <p class="article-meta">${post.date ? `${esc(t('journal.published'))} ${esc(post.date)}` : ''}${post.readTime ? ` · ${post.readTime} ${esc(t('journal.readTime'))}` : ''}</p>
  ${post.image ? `<img class="article-hero" src="/assets/${post.image}.jpg" alt="${esc(post.title)}">` : ''}
  <div class="article-body">${markdown(post.body, { homeUrl: homeUrl(lang), tripUrl: (id) => tripUrl(lang, id) })}</div>
  <div class="article-cta"><p>${esc(t('journal.cta'))}</p><a class="button" href="${homeUrl(lang)}#builder">${esc(t('journal.ctaButton'))} <span aria-hidden="true">${ICON}</span></a></div>
</main>
${footer(lang, t)}
${dataScript({ lang, t: strings })}
${scripts()}
</body></html>`;
  write(join(prefix(lang), 'journal', post.slug, 'index.html'), html);
}

function photographyPage(lang) {
  const strings = stringsFor(lang), t = makeT(strings);
  const credits = read(join(SRC, 'content', 'photography.html'));
  const html = `${head({ lang, t, title: 'Photography — Egyphoria', description: 'Photography credits for Egyphoria.', url: photoUrl(lang), makeUrl: photoUrl })}
<body>
${header(lang, t, photoUrl)}
<main id="main" class="section article">${credits}</main>
${footer(lang, t)}
${dataScript({ lang, t: strings })}
${scripts()}
</body></html>`;
  write(join(prefix(lang), 'photography', 'index.html'), html);
}

// booking return page (where PayTabs sends the customer after payment).
function bookingPage(lang) {
  const strings = stringsFor(lang), t = makeT(strings);
  const html = `${head({ lang, t, title: `${t('booking.title')} — Egyphoria`, description: t('booking.intro'), url: `${prefix(lang)}/booking/complete/`, robots: 'noindex, nofollow' })}
<body>
${header(lang, t, homeUrl)}
<main id="main" class="section article" style="text-align:center">
  <div class="plan-done-mark" aria-hidden="true">✧</div>
  <h1>${esc(t('booking.title'))}</h1>
  <p style="font-size:1.15rem;color:var(--muted);max-width:560px;margin:16px auto 0">${esc(t('booking.intro'))}</p>
  <p id="booking-ref" class="article-meta" style="margin-top:22px"></p>
  <p style="margin-top:20px"><a class="button" href="${homeUrl(lang)}">${esc(t('booking.home'))} <span aria-hidden="true">→</span></a></p>
  <p style="color:var(--muted);margin-top:26px;font-size:14px">${esc(t('booking.questions'))}</p>
</main>
${footer(lang, t)}
<script>(function(){var p=new URLSearchParams(location.search);var r=p.get('tranRef')||p.get('tran_ref')||p.get('cart_id');if(r)document.getElementById('booking-ref').textContent=${JSON.stringify(t('booking.ref'))}+': '+r;})();</script>
</body></html>`;
  write(join(prefix(lang), 'booking', 'complete', 'index.html'), html);
}

// ---- sitemap + robots ----------------------------------------------------
// Content that backs each entry has no per-record date of its own, so its
// lastmod is that content file's own mtime (truthful, not invented).
const TRIPS_LASTMOD = fileLastmod(join(SRC, 'trips.mjs'));
const PHOTOGRAPHY_LASTMOD = fileLastmod(join(SRC, 'content', 'photography.html'));
const JOURNAL_INDEX_LASTMOD = ALL_POSTS.length
  ? ALL_POSTS.reduce((max, p) => (p.lastmod > max ? p.lastmod : max), ALL_POSTS[0].lastmod)
  : fileLastmod(join(SRC, 'content', 'blog'));

function sitemap() {
  const entries = [];
  const add = (makeUrl, priority, changefreq, lastmod) => entries.push({ makeUrl, priority, changefreq, lastmod });
  add(homeUrl, '1.0', 'weekly', TRIPS_LASTMOD);
  for (const tr of trips) add((l) => tripUrl(l, tr.id), '0.8', 'monthly', TRIPS_LASTMOD);
  add(journalUrl, '0.6', 'weekly', JOURNAL_INDEX_LASTMOD);
  for (const p of ALL_POSTS.filter(p => (p.lang || 'en') === 'en')) add((l) => postUrl(l, p.slug), '0.6', 'monthly', p.lastmod);
  add(photoUrl, '0.2', 'yearly', PHOTOGRAPHY_LASTMOD);
  const urls = entries.map(({ makeUrl, priority, changefreq, lastmod }) => languages.map(l => `  <url>
    <loc>${abs(makeUrl(l.code))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${languages.map(a => `    <xhtml:link rel="alternate" hreflang="${a.code}" href="${abs(makeUrl(a.code))}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(makeUrl(defaultLang))}"/>
  </url>`).join('\n')).join('\n');
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`);
  // General allow covers Googlebot/Bingbot/etc.; explicit blocks for AI
  // scrapers that ignore a bare `*` disallow but honour their own UA line.
  write('robots.txt', `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

User-agent: Amazonbot
Disallow: /

Sitemap: ${abs('/sitemap.xml')}
`);
}

// ---- assets copy ---------------------------------------------------------
function copyDir(from, to) {
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from)) {
    const s = join(from, f), d = join(to, f);
    if (statSync(s).isDirectory()) copyDir(s, d); else copyFileSync(s, d);
  }
}
function copyStatics() {
  copyDir(join(DIST_ASSETS_SRC), join(DIST, 'assets'));          // keep existing images/og/favicons
  copyFileSync(join(SRC, 'styles.css'), join(DIST, 'styles.css'));
  mkdirSync(join(DIST, 'js'), { recursive: true });
  for (const f of readdirSync(join(SRC, 'client'))) copyFileSync(join(SRC, 'client', f), join(DIST, 'js', f));
  copyFileSync(join(SRC, 'motion.js'), join(DIST, 'js', 'motion.js'));
}
const DIST_ASSETS_SRC = join(DIST, 'assets'); // images already live here; preserved across rebuilds

// ---- run -----------------------------------------------------------------
// Preserve dist/assets; clear generated HTML/js to avoid stale files.
for (const f of ['index.html', 'photography.html', 'sitemap.xml', 'robots.txt', 'data.mjs', 'app.js', 'motion.js']) { const p = join(DIST, f); if (existsSync(p)) rmSync(p); }
for (const d of ['js', 'trips', 'journal', 'photography', 'booking', ...languages.filter(l => l.code !== defaultLang).map(l => l.code)]) { const p = join(DIST, d); if (existsSync(p)) rmSync(p, { recursive: true, force: true }); }

copyStatics();
for (const { code } of languages) {
  homePage(code);
  for (const tr of trips) tripPage(code, tr);
  journalIndex(code);
  for (const p of postsFor(code)) journalPost(code, p);
  photographyPage(code);
  bookingPage(code);
}
sitemap();
console.log(`Built ${languages.length} languages × ${trips.length} trips + journal + home. → dist/`);
