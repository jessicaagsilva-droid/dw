const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');

const PORT = process.env.PORT || 3000;
const UNIPAY_PUBLIC_KEY = process.env.UNIPAY_PUBLIC_KEY || 'pk_live_f63867fac3be706b7fc4a9f0';
const DEFAULT_SECRET_FALLBACK = Buffer.from('c2tfbGl2ZV8yNmJlZTA2ZGMxZmQ1NTA0ZWEwMzM1YjRiMjY2MWFiNjc5MGVhN2YzYWM1MzRlZTI=', 'base64').toString('utf8');
const UNIPAY_SECRET_KEY = process.env.UNIPAY_SECRET_KEY || DEFAULT_SECRET_FALLBACK;
const UNIPAY_BASE_URL = process.env.UNIPAY_BASE_URL || 'https://api-dash.unipaybr.com/v1';

function getAuthHeader() {
  return 'Basic ' + Buffer.from(`${UNIPAY_PUBLIC_KEY}:${UNIPAY_SECRET_KEY}`).toString('base64');
}

function requestHttps(requestUrl, options = {}, bodyData = null) {
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

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer(async (req, res) => {
  // CORS universal
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Endpoint 1: Criar Cobrança PIX UniPay
  const isCreatePix = (
    pathname === '/api/create-pix' ||
    pathname === '/.netlify/functions/create-pix' ||
    pathname === '/37626323423/api/create-pix' ||
    pathname === '/37626323423/.netlify/functions/create-pix' ||
    pathname.endsWith('/create-pix')
  );

  if (isCreatePix && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
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
          res.writeHead(unipayRes.status || 400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: errMsg, details: unipayRes.data }));
        }

        const tx = unipayRes.data.data;
        const txId = tx.id;
        const paymentFields = tx.payment_fields || {};
        const pixCode = paymentFields.copy_paste || tx.copy_paste || '';

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
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
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message || 'Erro interno' }));
      }
    });
    return;
  }

  // Endpoint 2: Verificar Status da Cobrança UniPay
  const isCheckStatus = (
    pathname === '/api/check-status' ||
    pathname === '/.netlify/functions/check-status' ||
    pathname === '/37626323423/api/check-status' ||
    pathname === '/37626323423/.netlify/functions/check-status' ||
    pathname.endsWith('/check-status')
  );

  if (isCheckStatus) {
    const id = parsedUrl.query.id || parsedUrl.query.transactionId;
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'ID é obrigatório' }));
    }

    try {
      const unipayRes = await requestHttps(`${UNIPAY_BASE_URL}/charges/${encodeURIComponent(id)}`);

      const json = unipayRes.data || {};
      const tx = json.data || {};
      const st = String(tx.status || '').toUpperCase();
      const isPaid = (st === 'CAPTURED' || st === 'AUTHORIZED' || st === 'PAID' || st === 'COMPLETED');

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        id: id,
        status: isPaid ? 'PAID' : (st || 'PENDING'),
        paymentStatus: st,
        isPaid: isPaid,
        paid: isPaid,
        raw: json
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message || 'Erro interno' }));
    }
    return;
  }

  // Servir Arquivos Estáticos com Fallback Inteligente
  let safePath = pathname.replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

  // Normalização de diretório
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Fallback 1: se não achar na raiz, busca dentro da pasta 37626323423
  if (!fs.existsSync(filePath)) {
    const fallbackPath = path.join(__dirname, '37626323423', safePath);
    if (fs.existsSync(fallbackPath)) {
      filePath = fs.statSync(fallbackPath).isDirectory() ? path.join(fallbackPath, 'index.html') : fallbackPath;
    }
  }

  // Fallback 2: remove barra inicial e tenta relativo
  if (!fs.existsSync(filePath)) {
    const cleanRelative = safePath.replace(/^\/+/, '');
    const tryDirect = path.join(__dirname, cleanRelative);
    if (fs.existsSync(tryDirect)) {
      filePath = fs.statSync(tryDirect).isDirectory() ? path.join(tryDirect, 'index.html') : tryDirect;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Gateway ativo: UniPay (https://api-dash.unipaybr.com/v1)`);
});
