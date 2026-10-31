/**
 * Endpoint / Serverless Function: create-pix
 * Gateway: UniPay (https://api-dash.unipaybr.com/v1)
 * Documentação: https://docs.unipaybr.com
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Carrega .env se existir localmente
try {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const parts = line.trim().split('=');
      const k = parts[0] ? parts[0].trim() : '';
      const v = parts.slice(1).join('=').trim();
      if (k && !k.startsWith('#') && v && !process.env[k]) {
        process.env[k] = v;
      }
    });
  }
} catch (_) {}

const DEFAULT_SECRET_FALLBACK = Buffer.from('c2tfbGl2ZV8yNmJlZTA2ZGMxZmQ1NTA0ZWEwMzM1YjRiMjY2MWFiNjc5MGVhN2YzYWM1MzRlZTI=', 'base64').toString('utf8');
const UNIPAY_PUBLIC_KEY = process.env.UNIPAY_PUBLIC_KEY || 'pk_live_f63867fac3be706b7fc4a9f0';
const UNIPAY_SECRET_KEY = process.env.UNIPAY_SECRET_KEY || DEFAULT_SECRET_FALLBACK;
const UNIPAY_BASE_URL = process.env.UNIPAY_BASE_URL || 'https://api-dash.unipaybr.com/v1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-KEY, Authorization, X-Requested-With, Accept, Origin, User-Agent, X-CSRF-Token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Content-Type': 'application/json; charset=utf-8'
};

function getAuthHeader() {
  return 'Basic ' + Buffer.from(`${UNIPAY_PUBLIC_KEY}:${UNIPAY_SECRET_KEY}`).toString('base64');
}

function requestHttps(requestUrl, options, bodyData) {
  return new Promise((resolve, reject) => {
    const u = new URL(requestUrl);
    const postData = bodyData ? (typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData)) : null;

    const headers = Object.assign({
      'Authorization': getAuthHeader(),
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UniPayClient/1.0'
    }, options.headers || {});

    if (postData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const opts = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: headers
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
    if (postData) req.write(postData);
    req.end();
  });
}

async function processCreatePix(parsed, clientIp) {
  const customer = parsed.customerData || parsed.customer || {};
  const product = parsed.productData || parsed.product || {};

  let cpf = String(customer.cpf || customer.taxId || customer.tax_id || customer.document || '').replace(/\D/g, '');
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

  const itemTitle = 'Serviços e Taxas';

  const unipayPayload = {
    amount: amountInCents,
    payment_method: 'pix',
    product_type: 'digital',
    customer: {
      name: nome,
      email: email,
      tax_id: cpf,
      phone: phone,
      type: 'individual'
    },
    items: [
      {
        name: itemTitle,
        quantity: 1,
        unit_price: amountInCents,
        tangible: false
      }
    ],
    payment_details: {
      expires_in_seconds: 3600
    }
  };

  const unipayRes = await requestHttps(`${UNIPAY_BASE_URL}/charges`, {
    method: 'POST'
  }, unipayPayload);

  if (!unipayRes.ok || !unipayRes.data || !unipayRes.data.data) {
    const errMsg = (unipayRes.data && (unipayRes.data.message || unipayRes.data.error)) || 'Falha ao gerar PIX na UniPay';
    return { ok: false, status: unipayRes.status || 400, body: { error: errMsg, details: unipayRes.data } };
  }

  const tx = unipayRes.data.data;
  const txId = tx.id;
  const paymentFields = tx.payment_fields || {};
  const pixCode = paymentFields.copy_paste || tx.copy_paste || '';

  return {
    ok: true,
    status: 200,
    body: {
      success: true,
      id: txId,
      transactionId: txId,
      brCode: pixCode,
      pixCopiaECola: pixCode,
      qrCode: pixCode,
      qrCodeBase64: '',
      pix_code: pixCode,
      code: pixCode,
      status: tx.status || 'pending',
      data: {
        ...tx,
        brCode: pixCode,
        pix_code: pixCode,
        qrCode: pixCode
      }
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
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY, Authorization, X-Requested-With, Accept, Origin, User-Agent, X-CSRF-Token');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
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
