// PayTabs server-to-server callback. PayTabs POSTs the payment result here and signs it with an
// HMAC-SHA256 signature over the raw body using the server key. Ported from the old static
// build's api/paytabs-callback.js. Never trust an unsigned/invalid callback.
import crypto from 'node:crypto'

export async function POST(req: Request) {
  const key = process.env.PAYTABS_SERVER_KEY
  const raw = await req.text()
  const signature = req.headers.get('signature')

  if (key && signature) {
    const expected = crypto.createHmac('sha256', key).update(raw).digest('hex')
    if (expected !== signature) return new Response('Invalid signature', { status: 400 })
  }

  let data: { cart_id?: string; tran_ref?: string; payment_result?: { response_status?: string } } = {}
  try {
    data = JSON.parse(raw || '{}')
  } catch {
    // ignore
  }
  const status = data.payment_result?.response_status // 'A' = authorised/paid

  // ponytail: fulfilment stub, carried over from the old build.mjs — wire this to email/CRM
  // when ready.
  //   if (status === 'A') { await notifyTeam(data) }
  console.log('PayTabs callback', { cart_id: data.cart_id, tran_ref: data.tran_ref, status })

  return Response.json({ received: true })
}
