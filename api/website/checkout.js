const https = require('https');

const TEMPLATE_PRICES = {
  101: { tier: 4, inr: 4999, usd: 75 },
  102: { tier: 3, inr: 2999, usd: 49 },
  103: { tier: 2, inr: 1999, usd: 29 },
  104: { tier: 4, inr: 4999, usd: 75 },
  105: { tier: 3, inr: 3999, usd: 59 }
};

const TIER_BASE_PRICE = {
  2: { inr: 1999, usd: 29 },
  3: { inr: 2999, usd: 45 },
  4: { inr: 4999, usd: 75 }
};

const DELIVERY_SPEEDS = {
  standard_48h: { hours: 48, inr: 0, usd: 0 },
  express_24h: { hours: 24, inr: 79900, usd: 900 },
  express_12h: { hours: 12, inr: 149900, usd: 1800 }
};

const EMAIL_RSVP_ADDON = { inr: 200000, usd: 2400 };

function createRazorpayOrder(keyId, keySecret, amount, currency, receipt, notes) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ amount, currency, receipt, notes });
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const req = https.request(
      {
        hostname: 'api.razorpay.com',
        path: '/v1/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Authorization: `Basic ${auth}`
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300 && parsed.id) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.error?.description || 'Failed to create Razorpay order'));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const currency = body.currency === 'USD' ? 'USD' : 'INR';
    const isINR = currency === 'INR';
    const designId = body.designId ? Number(body.designId) : null;
    const tpl = designId ? TEMPLATE_PRICES[designId] : null;
    const tier = tpl ? tpl.tier : ([2, 3, 4].includes(Number(body.tier)) ? Number(body.tier) : 2);

    const baseMajor = tpl ? (isINR ? tpl.inr : tpl.usd) : (isINR ? TIER_BASE_PRICE[tier].inr : TIER_BASE_PRICE[tier].usd);
    let amount = Math.round(baseMajor * 100);

    const checkoutVersion = body.checkoutVersion === 2 ? 2 : 1;
    const speedKey = checkoutVersion === 2
      ? (Object.hasOwn(DELIVERY_SPEEDS, body.deliverySpeed) ? body.deliverySpeed : 'standard_48h')
      : (body.express || tier === 4 ? 'express_24h' : 'standard_48h');
    const speedInfo = DELIVERY_SPEEDS[speedKey];
    const surcharge = isINR ? speedInfo.inr : speedInfo.usd;

    if (checkoutVersion === 2) {
      amount += surcharge;
    } else if (body.express && tier !== 4) {
      amount += isINR ? DELIVERY_SPEEDS.express_24h.inr : DELIVERY_SPEEDS.express_24h.usd;
    }

    if (body.emailRsvp && tier !== 4) {
      amount += isINR ? EMAIL_RSVP_ADDON.inr : EMAIL_RSVP_ADDON.usd;
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TPCjiGiPIeo7SN';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    let orderId;

    if (keySecret) {
      const receipt = `ist_${String(body.clientKey || Date.now()).slice(0, 32)}`;
      const order = await createRazorpayOrder(keyId, keySecret, amount, currency, receipt, {
        designId: String(designId || ''),
        tier: String(tier),
        deliverySpeed: speedKey
      });
      orderId = order.id;
    }

    const responsePayload = {
      keyId,
      amount,
      currency,
      ...(orderId ? { orderId } : {}),
      ...(checkoutVersion === 2 ? {
        checkoutVersion: 2,
        deliverySpeed: speedKey,
        deliverySnapshot: {
          speed: speedKey,
          firstDraftHours: speedInfo.hours,
          surcharge,
          currency,
          startsAfter: 'payment_and_complete_details'
        }
      } : {})
    };

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message || 'Unable to initialize checkout' });
  }
};
