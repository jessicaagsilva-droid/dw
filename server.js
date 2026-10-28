const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');

const PORT = process.env.PORT || 3000;
const XPAY_API_KEY = process.env.XPAY_API_KEY || 'cpk_live_ex84lopcp2xexagmazz6za11';
const XPAY_BASE_URL = 'https://api.xpaybrasil.com/v1';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Endpoint 1: Criar Cobrança PIX XPay
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
          res.writeHead(xpayRes.status || 400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: errMsg, details: xpayRes.data }));
        }

        const tx = xpayRes.data;
        const txId = tx.id;
        const brCode = tx.brCode || '';
        const brCodeBase64 = tx.brCodeBase64 || '';
        const status = tx.status || 'PROCESSING';

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          id: txId,
          transactionId: txId,
          brCode: brCode,
          pixCopiaECola: brCode,
          qrCode: brCode,
          qrCodeBase64: brCodeBase64,
          pix_code: brCode,
          code: brCode,
          status: status,
          data: tx
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message || 'Erro interno' }));
      }
    });
    return;
  }

  // Endpoint 2: Verificar Status da Cobrança XPay
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

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        id: id,
        status: isPaid ? 'PAID' : (paymentStatus || status || 'PROCESSING'),
        paymentStatus: paymentStatus,
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
  console.log(`Gateway ativo: XPay Brasil (https://api.xpaybrasil.com/v1)`);
});
