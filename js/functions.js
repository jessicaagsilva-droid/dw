// functions.js — preserva a query EXATA (ordem/duplicatas), TTL + last-click, propaga em links/forms
document.addEventListener('DOMContentLoaded', function () {
  // ===== Config =====
  const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
  const RAW_KEY = 'persisted_query_raw_v1'; // chave de storage do RAW (último clique)

  // ===== Helpers =====
  const cssEsc = (window.CSS && CSS.escape) ? CSS.escape : s => String(s).replace(/"/g, '\\"');

  // Usa .search e .hash como já vêm (com "?" e "#") — evita "??"
  const buildUrl = (u) => u.pathname + (u.search || '') + (u.hash || '');

  function saveRaw(raw) {
    try { localStorage.setItem(RAW_KEY, JSON.stringify({ ts: Date.now(), raw })); } catch {}
  }
  function loadRaw(ttlMs) {
    try {
      const o = JSON.parse(localStorage.getItem(RAW_KEY) || 'null');
      if (!o || !o.ts) return '';
      if (Date.now() - o.ts > ttlMs) return '';
      return o.raw || '';
    } catch { return ''; }
  }

  // Itera pares do RAW preservando ordem e duplicatas
  function forEachRawPair(raw, cb) {
    const s = raw && raw.startsWith('?') ? raw.slice(1) : raw;
    if (!s) return;
    s.split('&').forEach(part => {
      if (!part) return;
      const i = part.indexOf('=');
      const k = decodeURIComponent(i >= 0 ? part.slice(0, i) : part);
      const v = i >= 0 ? decodeURIComponent(part.slice(i + 1)) : '';
      cb(k, v);
    });
  }

  function isSkippableHref(href) {
    return !href || href.startsWith('#') || href.startsWith('mailto:')
           || href.startsWith('tel:') || href.startsWith('javascript:');
  }

  // ===== Coleta do RAW + política "último clique vence" =====
  // RAW da visita atual; se vazio, tenta o salvo (respeitando TTL)
  let RAW_QS = (location.search && location.search !== '?') ? location.search : '';
  if (RAW_QS) {
    // novo clique com query -> salva (substitui o anterior e renova TTL)
    saveRaw(RAW_QS);
  } else {
    RAW_QS = loadRaw(TTL_MS);
  }

  // ===== Pinta a barra com o RAW EXATO (ordem/duplicatas intactas) =====
  if (RAW_QS) {
    const url = new URL(location.href);
    if (url.search !== RAW_QS) {
      url.search = RAW_QS;
      history.replaceState(null, '', buildUrl(url));
    }
  }

  // ===== Propagação =====
  function mergeInto(href) {
    const u = new URL(href, location.href);
    if (u.origin !== location.origin) return href; // só mesmo domínio
    if (RAW_QS) {
      // Política "EXATA": sobrescreve a query do destino pelo RAW original
      u.search = RAW_QS; // preserva duplicatas, ordem e encoding
    }
    return buildUrl(u);
  }

  function applyTo(container = document) {
    if (!RAW_QS) return;

    // Links
    container.querySelectorAll('a[href]').forEach(a => {
      if (a.dataset.keepParams === 'false') return;
      const href = a.getAttribute('href');
      if (isSkippableHref(href)) return;
      a.setAttribute('href', mergeInto(href));
    });

    // Forms
    container.querySelectorAll('form').forEach(form => {
      if (form.dataset.keepParams === 'false') return;

      // Hidden inputs: 1 por PAR do RAW (mantém duplicatas)
      forEachRawPair(RAW_QS, (k, v) => {
        // Se já existe um input com esse name (visível ou hidden), não duplicamos
        // (se quiser mandar todas duplicatas mesmo assim, remova este if)
        if (form.querySelector(`input[name="${cssEsc(k)}"]`)) return;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = v;
        form.appendChild(input);
      });

      // Action com o RAW exato
      const action = form.getAttribute('action') || location.href;
      try { form.setAttribute('action', mergeInto(action)); } catch {}
    });
  }

  // Primeira aplicação no DOM atual
  applyTo(document);

  // Observa conteúdo dinâmico (SPAs, injeções depois do load)
  if ('MutationObserver' in window) {
    const mo = new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes && m.addedNodes.forEach(node => {
        if (node.nodeType === 1) applyTo(node);
      }));
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Garante ajuste imediatamente antes da navegação
  document.addEventListener('click', (e) => {
    const a = e.target && (e.target.closest ? e.target.closest('a[href]') : null);
    if (!a || a.dataset.keepParams === 'false') return;
    const href = a.getAttribute('href');
    if (isSkippableHref(href)) return;
    a.setAttribute('href', mergeInto(href));
  }, true);

  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement) || form.dataset.keepParams === 'false') return;

    // Garante os hidden e action exatamente no momento do submit
    forEachRawPair(RAW_QS, (k, v) => {
      if (form.querySelector(`input[name="${cssEsc(k)}"]`)) return;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });

    const action = form.getAttribute('action') || location.href;
    try { form.setAttribute('action', mergeInto(action)); } catch {}
  }, true);
});
