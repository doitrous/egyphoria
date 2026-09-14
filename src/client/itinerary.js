// The itinerary dialog: edit → details → produced downloadable document.
// Shared by the home builder and every trip page.
import { destinations, S, fmt, lang } from './data.js';
import { planText } from './plan.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let plan = [];
let details = {};
const dialog = $('#plan-dialog');

function show(view) {
  for (const el of dialog.querySelectorAll('[data-view]')) el.hidden = el.dataset.view !== view;
}
function openDialog() { dialog.showModal(); document.body.classList.add('modal-open'); }

export function startPlan(newPlan) {
  plan = newPlan; details = {};
  const form = $('#details-form'); if (form) form.reset();
  renderPlan(); show('edit'); openDialog();
  dialog.scrollTop = 0;
}

function summary() {
  const names = [...new Set(plan.map(d => destinations[d.place]?.name || d.title))];
  return `${plan.length} ${plan.length === 1 ? S('journeys.day') : S('journeys.days')} · ${names.join(' → ')}`;
}

function renderPlan() {
  $('#plan-summary').textContent = summary();
  $('#plan-days').innerHTML = plan.map((day, di) => `<section class="plan-day"><div class="day-heading"><span>${S('plan.day')} ${String(di + 1).padStart(2, '0')}</span><h3>${esc(day.title)}</h3></div><ol class="activities">${day.activities.map((activity, ai) => `<li class="activity"><textarea rows="2" aria-label="${S('plan.day')} ${di + 1}, ${ai + 1}" data-day="${di}" data-activity="${ai}" maxlength="1000">${esc(activity)}</textarea><div class="activity-actions"><button type="button" data-action="up" data-day="${di}" data-activity="${ai}" ${ai === 0 ? 'disabled' : ''}>↑</button><button type="button" data-action="down" data-day="${di}" data-activity="${ai}" ${ai === day.activities.length - 1 ? 'disabled' : ''}>↓</button><button type="button" data-action="remove" data-day="${di}" data-activity="${ai}">×</button></div></li>`).join('')}</ol><button type="button" class="add-activity" data-action="add" data-day="${di}">${S('plan.addExperience')}</button></section>`).join('');
}

function wire() {
  if (!dialog) return;
  for (const d of document.querySelectorAll('dialog')) {
    d.querySelector('.dialog-close')?.addEventListener('click', () => d.close());
    d.addEventListener('close', () => { if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open'); });
    d.addEventListener('click', e => { if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close(); } });
  }
  $('#plan-days').addEventListener('input', e => { if (e.target.matches('textarea')) plan[+e.target.dataset.day].activities[+e.target.dataset.activity] = e.target.value; });
  $('#plan-days').addEventListener('click', e => {
    const b = e.target.closest('[data-action]'); if (!b) return;
    const di = +b.dataset.day, ai = +b.dataset.activity, list = plan[di].activities; let focus = ai;
    if (b.dataset.action === 'add') { list.push(''); focus = list.length - 1; }
    else if (b.dataset.action === 'remove') { list.splice(ai, 1); focus = Math.min(ai, list.length - 1); }
    else { const o = b.dataset.action === 'up' ? ai - 1 : ai + 1;[list[ai], list[o]] = [list[o], list[ai]]; focus = o; }
    renderPlan();
    ($(`#plan-days textarea[data-day="${di}"][data-activity="${focus}"]`) || $(`#plan-days [data-action="add"][data-day="${di}"]`))?.focus();
  });
  $('#refine-plan')?.addEventListener('click', () => { dialog.close(); const b = $('#builder'); if (b) { b.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); $('#duration')?.focus({ preventScroll: true }); } });
  $('#to-details')?.addEventListener('click', () => { show('details'); dialog.scrollTop = 0; $('#trav-name')?.focus(); });
  $('#back-to-edit')?.addEventListener('click', () => { show('edit'); dialog.scrollTop = 0; });
  $('#details-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    details = { name: f.name.value.trim(), email: f.email.value.trim(), startDate: f.startDate.value, travelers: f.travelers.value, notes: f.notes.value.trim() };
    renderDone(); show('done'); dialog.scrollTop = 0;
  });
  $('#download-pdf')?.addEventListener('click', producePdf);
  $('#download-txt')?.addEventListener('click', downloadTxt);
  $('#edit-again')?.addEventListener('click', () => { show('edit'); dialog.scrollTop = 0; });
}

function renderDone() {
  const who = details.name ? fmt(S('plan.doneFor'), { name: esc(details.name) }) : S('plan.produced');
  $('#plan-done-title').innerHTML = who;
}

function downloadTxt() {
  const blob = new Blob([planText(plan, details)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'My-Egyphoria-Itinerary.txt'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Branded, print-optimised document rendered in a hidden iframe →
// the browser's print dialog lets the user "Save as PDF". No popups.
function producePdf() {
  const meta = [
    details.startDate && `${S('plan.startDate')}: ${esc(details.startDate)}`,
    details.travelers && `${S('plan.travelers')}: ${esc(details.travelers)}`,
  ].filter(Boolean).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
  const days = plan.map((day, i) => `<section class="d"><div class="dh"><span>${S('plan.day')} ${String(i + 1).padStart(2, '0')}</span><h2>${esc(day.title)}</h2></div><ul>${day.activities.filter(a => a.trim()).map(a => `<li>${esc(a)}</li>`).join('')}</ul></section>`).join('');
  const docHtml = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>Egyphoria — ${esc(details.name || S('plan.title'))}</title><style>
    @page{margin:18mm}*{box-sizing:border-box}body{font-family:'DM Sans',Georgia,serif;color:#2a1a1c;margin:0;line-height:1.5}
    .wrap{max-width:720px;margin:0 auto;padding:20px}
    .top{border-bottom:2px solid #b51f3e;padding-bottom:18px;margin-bottom:26px}
    .brand{font-size:26px;font-weight:700;letter-spacing:.5px;color:#b51f3e}
    .tag{color:#7a6a6c;font-size:13px;margin-top:2px}
    h1{font-size:24px;margin:22px 0 4px}.sub{color:#7a6a6c;margin:0 0 6px}.meta{color:#7a6a6c;font-size:13px}
    .d{margin:0 0 18px;break-inside:avoid}.dh{display:flex;gap:12px;align-items:baseline;border-bottom:1px solid #eadfe0;padding-bottom:6px;margin-bottom:8px}
    .dh span{color:#b51f3e;font-weight:700;font-size:12px;letter-spacing:1px}.dh h2{font-size:17px;margin:0}
    ul{margin:0;padding-left:18px}li{margin:4px 0}
    .notes{background:#faf5f2;border-left:3px solid #b51f3e;padding:12px 16px;margin:18px 0;font-size:14px}
    .foot{border-top:1px solid #eadfe0;margin-top:26px;padding-top:14px;color:#7a6a6c;font-size:12px}
  </style></head><body><div class="wrap">
    <div class="top"><div class="brand">Egyphoria</div><div class="tag">${S('footer.tagline')}</div></div>
    <h1>${esc(details.name ? fmt(S('plan.docFor'), { name: details.name }) : S('plan.title'))}</h1>
    <p class="sub">${esc(summary())}</p>${meta ? `<p class="meta">${meta}</p>` : ''}
    ${days}
    ${details.notes ? `<div class="notes"><strong>${S('plan.notes')}</strong><br>${esc(details.notes)}</div>` : ''}
    <div class="foot">${S('plan.txtDisclaimer')}<br>Egyphoria</div>
  </div></body></html>`;
  document.getElementById('egy-print')?.remove();
  const frame = document.createElement('iframe');
  frame.id = 'egy-print';
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const idoc = frame.contentWindow.document;
  idoc.open(); idoc.write(docHtml); idoc.close();
  let printed = false;
  const go = () => { if (printed) return; printed = true; try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (e) { /* ignore */ } };
  frame.onload = go;
  setTimeout(go, 500);
}

wire();
