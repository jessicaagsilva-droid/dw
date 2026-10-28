/**
 * Endpoint / Serverless Function: create-pix
 * Gateway: XPay Brasil (https://api.xpaybrasil.com/v1)
 * API Key: cpk_live_ex84lopcp2xexagmazz6za11
 */

const https = require('https');

const XPAY_API_KEY = process.env.XPAY_API_KEY || 'cpk_live_ex84lopcp2xexagmazz6za11';
const XPAY_BASE_URL = 'https://api.xpaybrasil.com/v1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-KEY, Authorization, X-Requested-With, Accept, Origin, User-Agent',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
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

async function processCreatePix(parsed, clientIp) {
  const customer = parsed.customerData || parsed.customer || {};

  let cpf = String(customer.cpf || customer.taxId || customer.document || '').replace(/\D/g, '');
  if (cpf.length !== 11) cpf = '07580365316';

  const nome = String(customer.name || customer.nome || 'Contribuinte').trim();
  const email = String(customer.email || ('contato.' + (cpf.slice(0, 6) || 'cliente') + '@gmail.com')).trim();
  let phone = String(customer.phone || customer.telefone || '11999999999').replace(/\D/g, '');
  if (phone.length < 10) phone = '11999999999';

  let rawAmount = parsed.amount;
  let amountInCents = 6856;
  if (typeof rawAmount === 'number') {
    amountInCents = (rawAmount > 0 && rawAmount < 500) ? Math.round(rawAmount * 100) : Math.round(rawAmount);
  } else if (typeof rawAmount === 'string') {
    let p = parseFloat(rawAmount.replace('R$', '').replace(/\s/g, '').replace(',', '.'));
    if (!isNaN(p) && p > 0) amountInCents = p < 500 ? Math.round(p * 100) : Math.round(p);
  }

  const xpayPayload = {
    amount: amountInCents,
    expiresIn: 3600,
    externalId: 'ord_' + Date.now(),
    customer: {
      taxId: cpf,
      name: nome,
      email: email,
      phone: phone
    }
  };

  const xpayRes = await requestHttps(`${XPAY_BASE_URL}/charge/pix`, {
    method: 'POST',
    headers: {
      'X-API-KEY': XPAY_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }, xpayPayload);

  if (!xpayRes.ok || !xpayRes.data || !xpayRes.data.id) {
    const errMsg = (xpayRes.data && (xpayRes.data.message || xpayRes.data.error)) || 'Falha ao gerar PIX na XPay';
    return { ok: false, status: xpayRes.status || 400, body: { error: errMsg, details: xpayRes.data } };
  }

  const tx = xpayRes.data;
  const txId = tx.id;

  return {
    ok: true,
    status: 200,
    body: {
      success: true,
      id: txId,
      transactionId: txId,
      brCode: tx.brCode || '',
      pixCopiaECola: tx.brCode || '',
      qrCode: tx.brCode || '',
      qrCodeBase64: tx.brCodeBase64 || '',
      pix_code: tx.brCode || '',
      code: tx.brCode || '',
      status: tx.status || 'PROCESSING',
      data: tx
    }
  };
}

async function handler(eventOrReq, contextOrRes) {
  // Vercel / Express (req, res)
  if (contextOrRes && typeof contextOrRes.status === 'function') {
    const req = eventOrReq;
    const res = contextOrRes;

    if (typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
      const parsed = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const clientIp = (req.headers && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : null) || '127.0.0.1';
      const result = await processCreatePix(parsed, clientIp);
      return res.status(result.status).json(result.body);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Erro interno' });
    }
  }

  // Netlify Functions (event, context)
  const event = eventOrReq || {};
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true }) };
  }

  try {
    const parsed = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const clientIp = (event.headers && event.headers['x-forwarded-for'] ? String(event.headers['x-forwarded-for']).split(',')[0].trim() : null) || '127.0.0.1';
    const result = await processCreatePix(parsed, clientIp);
    return {
      statusCode: result.status,
      headers: CORS_HEADERS,
      body: JSON.stringify(result.body)
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
