const https = require('https');

function fetchRazorpayPayment(keyId, keySecret, paymentId) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const req = https.request(
      {
        hostname: 'api.razorpay.com',
        path: `/v1/payments/${encodeURIComponent(paymentId)}`,
        method: 'GET',
        headers: { Authorization: `Basic ${auth}` }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
            else reject(new Error(parsed.error?.description || 'Payment lookup failed'));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { paymentId, orderId } = body;

    if (!/^pay_[a-zA-Z0-9]+$/.test(paymentId || '')) {
      return res.status(400).json({ error: 'Invalid paymentId' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TPCjiGiPIeo7SN';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!keySecret) {
      return res.status(200).json({ verified: false, pending: true });
    }

    const payment = await fetchRazorpayPayment(keyId, keySecret, paymentId);
    const matchesOrder = !orderId || payment.order_id === orderId;
    const isPaid = payment.status === 'captured' || payment.status === 'authorized';

    return res.status(200).json({
      verified: Boolean(isPaid && matchesOrder),
      paymentId: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      currency: payment.currency
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Verification failed' });
  }
};
