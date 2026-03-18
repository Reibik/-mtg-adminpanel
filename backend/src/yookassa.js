const crypto = require('crypto');
const https = require('https');

const SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

// YooKassa webhook trusted IPs
const TRUSTED_IPS = [
  '185.71.76.', '185.71.77.', '77.75.153.', '77.75.156.',
  '2a02:5180:',
];

// ── API request helper ────────────────────────────────────
function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.yookassa.ru',
      path: `/v3${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64'),
        'Idempotence-Key': crypto.randomUUID(),
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (res.statusCode >= 400) {
            reject(new Error(json.description || json.message || `YooKassa error ${res.statusCode}`));
          } else {
            resolve(json);
          }
        } catch {
          reject(new Error(`YooKassa: invalid response ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('YooKassa timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

// ── Create payment ────────────────────────────────────────
async function createPayment({ amount, currency, description, orderId, customerId, returnUrl }) {
  if (!SHOP_ID || !SECRET_KEY) {
    throw new Error('YooKassa не настроена (YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY)');
  }
  const result = await apiRequest('POST', '/payments', {
    amount: {
      value: String(Number(amount).toFixed(2)),
      currency: currency || 'RUB',
    },
    confirmation: {
      type: 'redirect',
      return_url: returnUrl || `${SITE_URL}/payment/result?order_id=${orderId}`,
    },
    capture: true,
    description: description || `Заказ #${orderId}`,
    metadata: {
      order_id: String(orderId),
      customer_id: String(customerId),
    },
  });
  return result;
}

// ── Get payment info ──────────────────────────────────────
async function getPayment(paymentId) {
  return apiRequest('GET', `/payments/${paymentId}`);
}

// ── Verify webhook IP ─────────────────────────────────────
function isWebhookTrusted(ip) {
  // Strip ::ffff: prefix for IPv4-mapped IPv6
  const cleanIp = ip.replace(/^::ffff:/, '');
  return TRUSTED_IPS.some(prefix => cleanIp.startsWith(prefix));
}

module.exports = {
  createPayment,
  getPayment,
  isWebhookTrusted,
};
