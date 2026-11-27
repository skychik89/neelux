(function () {
  'use strict';
  var pending = null;
  var inFlight = null;
  var uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  function uuid() {
    if (window.crypto.randomUUID) return window.crypto.randomUUID();
    var bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.from(bytes, function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
  }
  async function send(endpoint, fields) {
    if (inFlight) return inFlight;
    var target = new URL(endpoint, location.href);
    var localTest = location.hostname === '127.0.0.1' && target.origin === location.origin;
    if ((target.protocol !== 'https:' && !localTest) || target.username || target.password || target.search || target.hash) {
      throw new Error('invalid_endpoint');
    }
    var payload = {
      name: fields.name, contact: fields.contact, service: fields.service,
      serviceLabel: fields.serviceLabel, message: fields.message, calc: fields.calc,
      consent: fields.consent === true, consentRevision: '2026-11-27', website: ''
    };
    var fingerprint = JSON.stringify(payload);
    if (!pending || pending.fingerprint !== fingerprint || pending.endpoint !== target.href) {
      pending = { endpoint: target.href, fingerprint: fingerprint, requestId: uuid() };
    }
    payload.requestId = pending.requestId;
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 12000);
    inFlight = (async function () {
      var response = await fetch(target.href, {
        method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store',
        redirect: 'error', referrerPolicy: 'no-referrer',
        headers: {'Content-Type': 'application/json'}, signal: controller.signal,
        body: JSON.stringify(payload)
      });
      if (!response.ok || !/^application\/json(?:;|$)/i.test(response.headers.get('Content-Type') || '')) {
        throw new Error(response.status === 429 ? 'try_later' : 'receipt_not_confirmed');
      }
      var receipt = await response.json();
      if (!receipt || receipt.ok !== true || receipt.status !== 'received' ||
          receipt.requestId !== payload.requestId || !uuidPattern.test(receipt.receiptId || '')) {
        throw new Error('receipt_not_confirmed');
      }
      return {receiptId: receipt.receiptId};
    })();
    try { return await inFlight; }
    finally { clearTimeout(timeout); inFlight = null; }
  }
  window.NeeluxReceipt = {
    send: send,
    reset: function () { if (!inFlight) pending = null; }
  };
})();
