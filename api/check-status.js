/**
 * Endpoint / Serverless Function: check-status
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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

function getAuthHeader() {
  return 'Basic ' + Buffer.from(`${UNIPAY_PUBLIC_KEY}:${UNIPAY_SECRET_KEY}`).toString('base64');
}

function requestHttps(requestUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(requestUrl);
    const headers = Object.assign({
      'Authorization': getAuthHeader(),
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UniPayClient/1.0'
    }, options.headers || {});

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
    req.end();
  });
}

async function fetchChargeStatus(id) {
  const unipayRes = await requestHttps(`${UNIPAY_BASE_URL}/charges/${encodeURIComponent(id)}`);

  const json = unipayRes.data || {};
  const tx = json.data || {};
  const st = String(tx.status || '').toUpperCase();
  const isPaid = (st === 'CAPTURED' || st === 'AUTHORIZED' || st === 'PAID' || st === 'COMPLETED');

  return {
    success: true,
    id: id,
    status: isPaid ? 'PAID' : (st || 'PENDING'),
    paymentStatus: st,
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
