/**
 * Endpoint / Netlify Function: check-status
 * Gateway: XPay Brasil (https://api.xpaybrasil.com/v1)
 * API Key: cpk_live_ex84lopcp2xexagmazz6za11
 */

const https = require('https');

const XPAY_API_KEY = process.env.XPAY_API_KEY || 'cpk_live_ex84lopcp2xexagmazz6za11';
const XPAY_BASE_URL = 'https://api.xpaybrasil.com/v1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-KEY, Authorization, X-Requested-With, Accept, Origin, User-Agent',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

function requestHttps(requestUrl, options, bodyData) {
  return new Promise((resolve, reject) => {
    const u = new URL(requestUrl);
    const opts = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          data: json,
          text: data
        });
      });
    });

    req.on('error', reject);
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function fetchChargeStatus(id) {
  const xpayRes = await requestHttps(`${XPAY_BASE_URL}/charge/${encodeURIComponent(id)}`, {
    headers: {
      'X-API-KEY': XPAY_API_KEY,
      'Accept': 'application/json'
    }
  });

  const json = xpayRes.data || {};
  const tx = json.data || {};
  const paymentStatus = String(tx.paymentStatus || '').toUpperCase();
  const status = String(tx.status || '').toUpperCase();
  const isPaid = (paymentStatus === 'PAID' || paymentStatus === 'RECIEVED' || status === 'COMPLETED');

  return {
    success: true,
    id: id,
    status: isPaid ? 'PAID' : (paymentStatus || status || 'PROCESSING'),
    paymentStatus: paymentStatus,
    isPaid: isPaid,
    paid: isPaid,
    raw: json
  };
}

async function handler(eventOrReq, contextOrRes) {
  // Express / Node (req, res)
  if (contextOrRes && typeof contextOrRes.status === 'function') {
    const req = eventOrReq;
    const res = contextOrRes;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY, Authorization, X-Requested-With, Accept, Origin, User-Agent, X-CSRF-Token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const id = (req.query && (req.query.id || req.query.transactionId)) ||
               (req.body && (req.body.id || req.body.transactionId));

    if (!id) return res.status(400).json({ error: 'ID da cobrança é obrigatório' });

    try {
      return res.status(200).json(await fetchChargeStatus(id));
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao verificar status: ' + (err.message || err) });
    }
  }

  // Netlify Functions (event, context)
  const event = eventOrReq || {};
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true }) };
  }

  const query = event.queryStringParameters || {};
  let id = query.id || query.transactionId;

  if (!id && event.body) {
    try {
      const b = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      id = b.id || b.transactionId;
    } catch (_) {}
  }

  if (!id) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'ID da cobrança é obrigatório' }) };
  }

  try {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(await fetchChargeStatus(id))
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message || 'Erro interno' })
    };
  }
}

module.exports = handler;
module.exports.handler = handler;
