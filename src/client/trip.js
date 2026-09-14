// Trip page: "Make this mine" opens the itinerary dialog; "Book" starts checkout.
import { currentTrip, S } from './data.js';
import { planFromTrip } from './plan.js';
import { startPlan } from './itinerary.js';

const $ = (s) => document.querySelector(s);

$('#make-mine')?.addEventListener('click', () => startPlan(planFromTrip(currentTrip)));

// Checkout via the PayTabs serverless endpoint. Requires the backend to be
// deployed with credentials (see /api/paytabs-create). Fails gracefully.
$('#book-trip')?.addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true; const label = btn.querySelector('.btn-label'); const prev = label?.textContent;
  if (label) label.textContent = S('trip.booking');
  try {
    const res = await fetch('/api/paytabs-create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: currentTrip.id, tripName: currentTrip.name, lang: document.documentElement.lang }),
    });
    if (!res.ok) throw new Error('endpoint');
    const data = await res.json();
    if (data.redirect_url) { window.location.href = data.redirect_url; return; }
    throw new Error('no-url');
  } catch (err) {
    if (label) label.textContent = prev;
    btn.disabled = false;
    alert(S('trip.bookingUnavailable'));
  }
});
