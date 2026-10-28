/**
 * XPay Brasil Gateway Integration
 * API Oficial: https://api.xpaybrasil.com/v1
 * Suporte nativo a Vercel + Netlify Serverless Functions
 */

(function (window) {
  'use strict';

  var XPAY_API_KEY = 'cpk_live_ex84lopcp2xexagmazz6za11';
  var XPAY_BASE_URL = 'https://api.xpaybrasil.com/v1';

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

  var XpayGateway = {
    apiKey: XPAY_API_KEY,
    baseUrl: XPAY_BASE_URL,
    getTrackingParameters: getTrackingParameters,

    /**
     * Gera cobranca PIX com integracao XPay Brasil
     */
    createPix: async function (customerData, productData, customAmount) {
      customerData = customerData || {};
      productData = productData || {};

      var cpfClean = String(
        customerData.cpf || customerData.document || customerData.taxId || '07580365316'
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
      var itemTitle = String(productData.title || 'Serviços e Taxas').trim();
      var trackingParams = getTrackingParameters();

      // 1. Chamar endpoint backend no proprio dominio (Vercel / Netlify / Node)
      var endpoints = [
        '/api/create-pix',
        '/.netlify/functions/create-pix',
        '../../api/create-pix'
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
            if (sJson && (sJson.brCode || sJson.pixCopiaECola || sJson.id)) {
              return sJson;
            }
          }
        } catch (e) {}
      }

      // 2. Fallback: Chamada direta à XPay Brasil
      var xpayPayload = {
        amount: amountInCents,
        expiresIn: 3600,
        externalId: 'ord_' + Date.now(),
        customer: {
          taxId: cpfClean,
          name: nome,
          email: email,
          phone: phoneClean
        }
      };

      var res = await fetch(XPAY_BASE_URL + '/charge/pix', {
        method: 'POST',
        headers: {
          'X-API-KEY': XPAY_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(xpayPayload)
      });

      var json = await res.json().catch(function () { return {}; });

      if (!res.ok || !json || !json.id) {
        var msg = (json && (json.message || json.error)) || 'Falha ao processar PIX no gateway XPay Brasil.';
        throw new Error(msg);
      }

      return {
        success: true,
        id: json.id,
        transactionId: json.id,
        brCode: json.brCode || '',
        pixCopiaECola: json.brCode || '',
        qrCode: json.brCode || '',
        qrCodeBase64: json.brCodeBase64 || '',
        pix_code: json.brCode || '',
        code: json.brCode || '',
        status: json.status || 'PROCESSING',
        data: json
      };
    },

    /**
     * Consulta status da transação na XPay Brasil
     */
    checkStatus: async function (txId) {
      if (!txId) return { paid: false, status: 'UNKNOWN' };

      var checkEndpoints = [
        '/api/check-status?id=' + encodeURIComponent(txId),
        '/.netlify/functions/check-status?id=' + encodeURIComponent(txId)
      ];

      for (var i = 0; i < checkEndpoints.length; i++) {
        try {
          var cRes = await fetch(checkEndpoints[i], { cache: 'no-store' });
          if (cRes.ok) {
            var cJson = await cRes.json().catch(function () { return null; });
            if (cJson && (cJson.status || cJson.isPaid != null)) {
              var isP = (cJson.isPaid === true) || ['PAID', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'PAGO'].indexOf(String(cJson.status).toUpperCase()) !== -1;
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

      // 2. Fallback: Chamada direta à XPay Brasil
      try {
        var res = await fetch(XPAY_BASE_URL + '/charge/' + encodeURIComponent(txId), {
          method: 'GET',
          headers: {
            'X-API-KEY': XPAY_API_KEY,
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });

        var json = await res.json().catch(function () { return {}; });
        var tx = (json && json.data) || {};
        var pStatus = String(tx.paymentStatus || '').toUpperCase();
        var st = String(tx.status || '').toUpperCase();
        var isPaid = (pStatus === 'PAID' || pStatus === 'RECIEVED' || st === 'COMPLETED');

        return {
          success: true,
          id: tx.id || txId,
          status: isPaid ? 'PAID' : (pStatus || st || 'PROCESSING'),
          paymentStatus: pStatus,
          isPaid: isPaid,
          paid: isPaid,
          data: tx
        };
      } catch (e) {
        return { paid: false, status: 'ERROR', error: e.message };
      }
    }
  };

  window.XpayGateway = XpayGateway;
  if (!window.getTrackingParameters) {
    window.getTrackingParameters = getTrackingParameters;
  }
})(window);
