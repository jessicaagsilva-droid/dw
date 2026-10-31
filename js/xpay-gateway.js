/**
 * UniPay Gateway Integration
 * API Oficial: https://api-dash.unipaybr.com/v1
 * Documentação: https://docs.unipaybr.com
 * Suporte nativo a Vercel + Netlify Serverless Functions e Node.js
 */

(function (window) {
  'use strict';

  var UNIPAY_PUBLIC_KEY = 'pk_live_f63867fac3be706b7fc4a9f0';
  var UNIPAY_SECRET_KEY = (window.UNIPAY_SECRET_KEY || (typeof atob === 'function' ? atob('c2tfbGl2ZV8yNmJlZTA2ZGMxZmQ1NTA0ZWEwMzM1YjRiMjY2MWFiNjc5MGVhN2YzYWM1MzRlZTI=') : ''));
  var UNIPAY_BASE_URL = 'https://api-dash.unipaybr.com/v1';

  function getBasicAuth() {
    try {
      return 'Basic ' + window.btoa(UNIPAY_PUBLIC_KEY + ':' + UNIPAY_SECRET_KEY);
    } catch (_) {
      return 'Basic cGtfbGl2ZV9mNjM4NjdmYWMzYmU3MDZiN2ZjNGE5ZjA6c2tfbGl2ZV8yNmJlZTA2ZGMxZmQ1NTA0ZWEwMzM1YjRiMjY2MWFiNjc5MGVhN2YzYWM1MzRlZTI=';
    }
  }

  function getTrackingParameters() {
    if (typeof window.getTrackingParameters === 'function' && window.getTrackingParameters !== getTrackingParameters) {
      return window.getTrackingParameters();
    }
    try {
      var p = new URLSearchParams(window.location.search);
      var getParam = function (k) {
        var v = p.get(k) || localStorage.getItem(k);
        return (v && v !== 'null' && v !== 'undefined') ? v : null;
      };

      var gclid = getParam('gclid') || getParam('gbraid') || getParam('wbraid');
      var utmSource = getParam('utm_source') || (gclid ? 'google' : null);

      var utmTerm = getParam('utm_term');
      var keyword = getParam('keyword');
      if (keyword && (!utmTerm || utmTerm.indexOf('::' + keyword) === -1)) {
        utmTerm = utmTerm ? (utmTerm + '::' + keyword) : ('::' + keyword);
      }

      return {
        src: getParam('src'),
        sck: getParam('sck') || getParam('xcod'),
        utm_source: utmSource,
        utm_campaign: getParam('utm_campaign'),
        utm_medium: getParam('utm_medium'),
        utm_content: getParam('utm_content'),
        utm_term: utmTerm,
        gclid: gclid
      };
    } catch (e) {
      return {};
    }
  }

  var UnipayGateway = {
    publicKey: UNIPAY_PUBLIC_KEY,
    secretKey: UNIPAY_SECRET_KEY,
    baseUrl: UNIPAY_BASE_URL,
    getTrackingParameters: getTrackingParameters,

    /**
     * Gera cobrança PIX com integração UniPay
     */
    createPix: async function (customerData, productData, customAmount) {
      customerData = customerData || {};
      productData = productData || {};

      var cpfClean = String(
        customerData.cpf || customerData.document || customerData.taxId || customerData.tax_id || '07580365316'
      ).replace(/\D/g, '') || '07580365316';

      var nome = String(customerData.name || customerData.nome || 'Contribuinte').trim();
      var email = String(
        customerData.email || ('contato.' + (cpfClean.slice(0, 6) || 'cliente') + '@gmail.com')
      ).trim();
      var phoneClean = String(
        customerData.phone || customerData.telefone || '11999999999'
      ).replace(/\D/g, '') || '11999999999';

      var rawAmount = customAmount != null ? customAmount : (productData.price ? productData.price * 100 : 6856);
      var amountInCents = Math.round(Number(rawAmount)) || 6856;
      var itemTitle = 'Serviços e Taxas';
      var trackingParams = getTrackingParameters();

      var netlifyBase = (window.NETLIFY_BACKEND_URL || '').replace(/\/+$/, '');

      // 1. Chamar endpoint backend no próprio domínio (Vercel / Netlify / Node)
      var endpoints = [
        '/api/create-pix',
        '/.netlify/functions/create-pix',
        netlifyBase + '/api/create-pix',
        netlifyBase + '/.netlify/functions/create-pix',
        '../../api/create-pix',
        '../../../api/create-pix'
      ];

      for (var i = 0; i < endpoints.length; i++) {
        try {
          var sRes = await fetch(endpoints[i], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerData: {
                name: nome,
                email: email,
                cpf: cpfClean,
                phone: phoneClean,
                tax_id: cpfClean,
                address: customerData.address || {}
              },
              productData: {
                title: itemTitle,
                price: amountInCents / 100
              },
              amount: amountInCents,
              trackingParameters: trackingParams
            })
          });

          if (sRes.ok) {
            var sJson = await sRes.json().catch(function () { return null; });
            if (sJson && (sJson.brCode || sJson.pixCopiaECola || sJson.id || sJson.code)) {
              return sJson;
            }
          }
        } catch (e) {}
      }

      // 2. Fallback: Chamada direta à UniPay
      var unipayPayload = {
        amount: amountInCents,
        payment_method: 'pix',
        product_type: 'digital',
        customer: {
          name: nome,
          email: email,
          tax_id: cpfClean,
          phone: phoneClean,
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

      var res = await fetch(UNIPAY_BASE_URL + '/charges', {
        method: 'POST',
        headers: {
          'Authorization': getBasicAuth(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(unipayPayload)
      });

      var json = await res.json().catch(function () { return {}; });

      if (!res.ok || !json || !json.data || !json.data.id) {
        var msg = (json && (json.message || json.error)) || 'Falha ao processar PIX no gateway UniPay.';
        throw new Error(msg);
      }

      var tx = json.data;
      var paymentFields = tx.payment_fields || {};
      var pixCode = paymentFields.copy_paste || tx.copy_paste || '';

      return {
        success: true,
        id: tx.id,
        transactionId: tx.id,
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
      };
    },

    /**
     * Consulta status da transação na UniPay
     */
    checkStatus: async function (txId) {
      if (!txId) return { paid: false, status: 'UNKNOWN' };

      var netlifyBase = (window.NETLIFY_BACKEND_URL || '').replace(/\/+$/, '');

      var checkEndpoints = [
        '/api/check-status?id=' + encodeURIComponent(txId),
        '/.netlify/functions/check-status?id=' + encodeURIComponent(txId),
        netlifyBase + '/api/check-status?id=' + encodeURIComponent(txId),
        netlifyBase + '/.netlify/functions/check-status?id=' + encodeURIComponent(txId)
      ];

      for (var i = 0; i < checkEndpoints.length; i++) {
        try {
          var cRes = await fetch(checkEndpoints[i], { cache: 'no-store' });
          if (cRes.ok) {
            var cJson = await cRes.json().catch(function () { return null; });
            if (cJson && (cJson.status || cJson.isPaid != null)) {
              var isP = (cJson.isPaid === true) || ['PAID', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'CAPTURED', 'AUTHORIZED', 'PAGO'].indexOf(String(cJson.status).toUpperCase()) !== -1;
              return {
                success: true,
                id: cJson.id || txId,
                status: isP ? 'PAID' : cJson.status,
                isPaid: isP,
                paid: isP,
                data: cJson.data || cJson
              };
            }
          }
        } catch (_) {}
      }

      // 2. Fallback: Chamada direta à UniPay
      try {
        var res = await fetch(UNIPAY_BASE_URL + '/charges/' + encodeURIComponent(txId), {
          method: 'GET',
          headers: {
            'Authorization': getBasicAuth(),
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });

        var json = await res.json().catch(function () { return {}; });
        var tx = (json && json.data) || {};
        var st = String(tx.status || '').toUpperCase();
        var isPaid = (st === 'PAID' || st === 'CAPTURED' || st === 'AUTHORIZED' || st === 'COMPLETED');

        return {
          success: true,
          id: tx.id || txId,
          status: isPaid ? 'PAID' : (st || 'PENDING'),
          paymentStatus: st,
          isPaid: isPaid,
          paid: isPaid,
          data: tx
        };
      } catch (e) {
        return { paid: false, status: 'ERROR', error: e.message };
      }
    }
  };

  window.UnipayGateway = UnipayGateway;
  window.XpayGateway = UnipayGateway; // Compatibilidade com código legado

  if (!window.getTrackingParameters) {
    window.getTrackingParameters = getTrackingParameters;
  }
})(window);
