// Home page wiring: trip grid (links to trip pages), filters, builder, menu.
import { trips, destinations, S, fmt } from './data.js';
import { createPlan } from './plan.js';
import { startPlan } from './itinerary.js';

const $ = (s) => document.querySelector(s);

function cardImageAlt(img) {
  return { alexandria: 'Qaitbay Citadel in Alexandria', nile: 'Sailboats on the Nile', giza: 'Pyramids of Giza at sunset', luxor: 'Ancient Egyptian temple columns and statues', cairo: 'Lanterns in Khan el-Khalili, Cairo', desert: "Chalk formations in Egypt's White Desert" }[img] || "Egypt's Red Sea coast";
}
const arrow = '<span class="trip-arrow" aria-hidden="true"><svg class="link-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter"><path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7"/></svg></span>';

function renderTrips(filter = 'all') {
  const shown = trips.filter(t => filter === 'all' || t.kind === filter);
  const grid = $('#trip-grid'); if (!grid) return;
  $('#journey-count').textContent = fmt(S('journeys.count'), { n: String(shown.length).padStart(2, '0') });
  grid.innerHTML = shown.map(t => `<article class="trip-card"><a class="trip-image" href="${t.url}" aria-label="${fmt(S('journeys.explore'))} ${t.name}"><img src="/assets/${t.image}.jpg" alt="${cardImageAlt(t.image)}" loading="lazy">${t.priceLabel ? `<span class="trip-price">${t.priceLabel}</span>` : ''}<span class="trip-badge">${t.tag}</span>${arrow}</a><p class="trip-meta">${t.location}</p><h3><a href="${t.url}">${t.name}</a></h3><p class="trip-description">${t.description}</p><div class="trip-footer"><span>${t.days} ${t.days === 1 ? S('journeys.day') : S('journeys.days')} · ${t.kind === 'multi' ? S('journeys.multiDay') : S('journeys.dayExperience')}</span><a href="${t.url}">${S('journeys.viewTrip')}</a></div></article>`).join('');
}

const grid = $('#trip-grid');
if (grid) {
  for (const button of document.querySelectorAll('[data-filter]')) button.addEventListener('click', () => {
    for (const other of document.querySelectorAll('[data-filter]')) { other.classList.toggle('active', other === button); other.setAttribute('aria-pressed', String(other === button)); }
    renderTrips(button.dataset.filter);
  });
  renderTrips();
}

const destOpts = $('#destination-options');
if (destOpts) {
  destOpts.innerHTML = Object.entries(destinations).map(([id, d]) => `<label><input type="checkbox" name="destination" value="${id}" ${['cairo', 'luxor', 'aswan'].includes(id) ? 'checked' : ''}><span>${d.name}</span></label>`).join('');
  $('#builder-form').addEventListener('submit', event => {
    event.preventDefault();
    const routeOrder = ['cairo', 'alexandria', 'desert', 'luxor', 'aswan', 'redsea'];
    const places = [...document.querySelectorAll('[name="destination"]:checked')].map(i => i.value).sort((a, b) => routeOrder.indexOf(a) - routeOrder.indexOf(b));
    const interests = [...document.querySelectorAll('.interest-options input:checked')].map(i => i.value);
    try { const plan = createPlan({ places, days: Number($('#duration').value), pace: $('#pace').value, interests }); $('#builder-error').textContent = ''; startPlan(plan); }
    catch (error) { $('#builder-error').textContent = error.message; }
  });
}

const menu = $('.menu-button');
if (menu) {
  menu.addEventListener('click', () => { const ex = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', String(!ex)); menu.setAttribute('aria-label', ex ? S('nav.openMenu') : S('nav.closeMenu')); $('#main-nav').classList.toggle('open', !ex); });
  for (const link of document.querySelectorAll('#main-nav a')) link.addEventListener('click', () => { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', S('nav.openMenu')); $('#main-nav').classList.remove('open'); });
}
const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

const langSwitcher = $('.lang-switcher'), langButton = $('.lang-button');
if (langSwitcher && langButton) {
  langButton.addEventListener('click', e => { e.stopPropagation(); const open = langSwitcher.classList.toggle('open'); langButton.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('click', () => { langSwitcher.classList.remove('open'); langButton.setAttribute('aria-expanded', 'false'); });
}
