/* Neelux: optional event analytics. No form values or outbound URLs are sent. */
(function () {
  'use strict';
  if (window.NeeluxAnalytics) return;
  var COUNTER = 114704088, KEY = 'neelux-analytics-consent-v1', active = false, started = false;
  var events = ['cta_discuss','lead_draft','lead_received','calc_send','calc_share','calc_pdf','tg_click','tg_quick','pkg_select','mail_click','phone_click'];
  var paths = ['/','/index.html','/about.html','/privacy.html','/consent.html','/cookies.html','/terms.html','/services/website-development.html','/services/business-promotion.html','/services/business-automation.html','/services/telegram-bots.html'];
  var sources = ['yandex','google','vk','telegram','partner','yandex_business','tiktok','instagram'];
  var mediums = ['organic','social','referral','cpc','email','video','profile'];
  var campaigns = ['services_2026','studio_profile','automation_2026','bots_2026','websites_2026','promotion_2026','case_firm','case_brooklands'];
  var choices = ['granted','denied'], memory = null;
  function read() { if (memory !== null) return memory; try { var v = localStorage.getItem(KEY); return choices.indexOf(v) >= 0 ? v : null; } catch (_) { return null; } }
  function allowedHost() { return location.hostname === 'neelux.space' || location.hostname === 'www.neelux.space'; }
  function campaign() {
    var query = new URLSearchParams(location.search), out = {};
    [['utm_source',sources],['utm_medium',mediums],['utm_campaign',campaigns]].forEach(function (field) {
      var v = query.get(field[0]); if (field[1].indexOf(v) >= 0) out[field[0]] = v;
    });
    return out;
  }
  function safeUrl() {
    var url = new URL('https://neelux.space' + (paths.indexOf(location.pathname) >= 0 ? location.pathname : '/'));
    var fields = campaign(); Object.keys(fields).forEach(function (k) { url.searchParams.set(k,fields[k]); });
    return url.href;
  }
  function safeReferrer() { try { return new URL(document.referrer).origin + '/'; } catch (_) { return ''; } }
  function start() {
    if (started || read() !== 'granted' || !allowedHost()) return;
    started = active = true;
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    var script = document.createElement('script'); script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + COUNTER;
    script.dataset.neeluxMetrika = 'true';
    script.onerror = function () { active = false; document.documentElement.dataset.analyticsStatus='blocked'; script.remove(); };
    document.head.appendChild(script);
    window.ym(COUNTER,'init',{defer:true,clickmap:false,trackLinks:false,webvisor:false,ecommerce:false,disableYtm:true,sendTitle:false,trackHash:false,accurateTrackBounce:true,url:safeUrl(),referrer:safeReferrer(),triggerEvent:true});
    window.ym(COUNTER,'hit',safeUrl(),{title:'Neelux Studio',referer:safeReferrer(),callback:function(){document.documentElement.dataset.analyticsStatus='hit-sent';}});
  }
  function track(name) {
    if (!active || read() !== 'granted' || events.indexOf(name) < 0 || typeof window.ym !== 'function') return false;
    try { window.ym(COUNTER,'reachGoal',name); return true; } catch (_) { return false; }
  }
  function choose(value) {
    if (choices.indexOf(value) < 0) return;
    memory = value; try { localStorage.setItem(KEY,value); } catch (_) {}
    var panel = document.getElementById('neelux-analytics-choice'); if (panel) panel.remove();
    updateState();
    if (value === 'granted') start();
    else if (started) { active = false; location.reload(); }
  }
  function updateState() {
    var state = document.getElementById('analytics-current-choice');
    if (state) state.textContent = read() === 'granted' ? 'Аналитика включена' : 'Аналитика выключена';
  }
  function openSettings() {
    if (document.getElementById('neelux-analytics-choice')) return;
    var panel = document.createElement('section'); panel.id = 'neelux-analytics-choice';
    panel.setAttribute('aria-label','Выбор аналитики');
    var text = document.createElement('p'); text.textContent = 'Разрешить Яндекс Метрике учитывать посещения и действия на сайте? Это помогает улучшать услуги. Имя, телефон и текст обращения в события не передаём.';
    var details = document.createElement('a'); details.href = '/cookies.html'; details.textContent = 'Cookies и настройки';
    var actions = document.createElement('div'); actions.className = 'neelux-analytics-actions';
    [['Разрешить','granted'],['Без аналитики','denied']].forEach(function (item) {
      var button = document.createElement('button'); button.type = 'button'; button.textContent = item[0];
      button.addEventListener('click',function () { choose(item[1]); }); actions.appendChild(button);
    });
    panel.appendChild(text); panel.appendChild(details); panel.appendChild(actions); document.body.appendChild(panel);
  }
  window.NeeluxAnalytics = {
    track:track, openSettings:openSettings, consent:read,
    attributionLabel:function () {
      var fields=campaign();
      return fields.utm_source ? [fields.utm_source,fields.utm_medium,fields.utm_campaign].filter(Boolean).join(' / ') : 'neelux.space';
    }
  };
  document.addEventListener('click',function (event) {
    var link=event.target.closest('a,button'); if (!link) return;
    if (link.hasAttribute('data-analytics-settings')) { event.preventDefault(); openSettings(); return; }
    var href=link.getAttribute('href') || '';
    if (href.indexOf('mailto:') === 0) track('mail_click');
    else if (href.indexOf('tel:') === 0) track('phone_click');
    // Also covers an older site.js still cached under its existing URL.
    if (!window.NEELUX_ANALYTICS_HOOKED) {
      if (link.dataset.quick) track('tg_quick');
      else if (/^https:\/\/t\.me\//.test(href)) track('tg_click');
      if (href === '#contact') track('cta_discuss');
      if (link.dataset.pkg) track('pkg_select');
      var calcEvents={cSend:'calc_send',cShare:'calc_share',cPdf:'calc_pdf'};
      if (calcEvents[link.id]) track(calcEvents[link.id]);
    }
  },true);
  var lastDraftAt=0;
  document.addEventListener('submit',function (event) {
    if (window.NEELUX_ANALYTICS_HOOKED || event.target.id !== 'form') return;
    var form=event.target;
    setTimeout(function () {
      var done=document.getElementById('done'),now=Date.now();
      if (event.defaultPrevented && form.hidden && done && !done.hidden && now-lastDraftAt>=30000) {
        lastDraftAt=now; track('lead_draft');
      }
    },0);
  },true);
  function ready() {
    updateState();
    if (read() === 'granted') start();
    else if (!read() && !/^\/(privacy|cookies|consent|terms)\.html$/.test(location.pathname)) openSettings();
  }
  window.addEventListener('storage',function (event) {
    if (event.key !== KEY) return;
    memory = choices.indexOf(event.newValue) >= 0 ? event.newValue : null;
    if (started && read() !== 'granted') { active=false; location.reload(); }
    else { updateState(); if (read() === 'granted') start(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',ready,{once:true}); else ready();
})();
