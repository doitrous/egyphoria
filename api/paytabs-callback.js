// PayTabs server-to-server callback. PayTabs POSTs the payment result here and
// signs it with an HMAC-SHA256 signature over the raw body using your server
// key. We verify the signature, then you fulfil the order (email the team,
// mark paid, etc.). Never trust an unsigned/invalid callback.
import crypto from 'node:crypto';

export const config = { api: { bodyParser: false } }; // need the raw body for the HMAC

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }
  const key = process.env.PAYTABS_SERVER_KEY;
  const raw = await rawBody(req);
  const signature = req.headers['signature'];

  if (key && signature) {
    const expected = crypto.createHmac('sha256', key).update(raw).digest('hex');
    if (expected !== signature) { res.statusCode = 400; return res.end('Invalid signature'); }
  }

  let data = {};
  try { data = JSON.parse(raw || '{}'); } catch { /* ignore */ }
  const status = data?.payment_result?.response_status; // 'A' = authorised/paid

  // ponytail: fulfilment stub. Wire this to email/CRM when ready.
  //   if (status === 'A') { await notifyTeam(data); }
  console.log('PayTabs callback', { cart_id: data.cart_id, tran_ref: data.tran_ref, status });

  res.statusCode = 200; res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ received: true }));
}
