// Общие помощники интерфейса и состояние приложения.
export const $ = id => document.getElementById(id);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function h(tag, props = {}, ...kids) {
 const e = document.createElement(tag);
 for (const [k, v] of Object.entries(props || {})) {
  if (v == null || v === false) continue;
  if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
  else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
  else if (k === 'dataset') Object.assign(e.dataset, v); else if (k === 'value') e.value = v; else e.setAttribute(k, v === true ? '' : v);
 }
 for (const c of kids.flat(3)) if (c != null && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
 return e;
}
export function icon(name, cls = 'ic') {const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', cls); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#i-' + name); s.append(u); return s;}
export const put = (el, ...kids) => el.replaceChildren(...kids.flat(3).filter(k => k != null && k !== false));
export function link(url, text) {try {const u = new URL(url); if (['http:','https:'].includes(u.protocol)) return h('a', {href:u.href, target:'_blank', rel:'noreferrer'}, text);} catch {} return h('span', {}, text);}
export const host = url => {try {return new URL(url).hostname.replace(/^www\./, '');} catch {return url;}};
export const fmt = (t, opts = {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) => t ? new Date(t).toLocaleString('ru-RU', opts) : '—';
export const fmtDate = t => fmt(t, {day:'numeric', month:'long'});
export const ago = t => {if (!t) return 'никогда'; const m = Math.round((Date.now() - new Date(t)) / 60000); if (m < 2) return 'онлайн'; if (m < 60) return `${m} мин назад`; const hh = Math.round(m / 60); if (hh < 24) return `${hh} ч назад`; return `${Math.round(hh / 24)} дн назад`;};
export const plural = (n, one, few, many) => {const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? many : b > 1 && b < 5 ? few : b === 1 ? one : many;};
export const initials = name => String(name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
export function avatar(name, cls = '') {const hue = [...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0) % 360; return h('span', {class:'avatar ' + cls, style:`--hue:${hue}`}, initials(name));}

let toastTimer;
export function toast(text, kind = '') {const t = $('toast'); t.textContent = text; t.className = kind; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, 4500);}
export function busy(btn, fn) {
 return async e => {e?.preventDefault?.(); if (btn.disabled) return; btn.disabled = true; try {await fn(e);} catch (x) {toast(x.message, 'err');} finally {btn.disabled = false;}};
}
export function button(label, fn, cls = 'btn', ico) {const b = h('button', {class:cls, type:'button'}, ico ? icon(ico) : null, label); b.onclick = busy(b, fn); return b;}
export function copy(text, msg = 'Скопировано') {return navigator.clipboard.writeText(text).then(() => toast(msg));}

// Модальное окно с формой. fields: [{name,label,type,value,options,placeholder,hint,required,rows}]
export function form({title, text, fields = [], submit = 'Сохранить', danger = false, onSubmit}) {
 return new Promise(resolve => {
  const dlg = h('dialog', {class:'modal'});
  const inputs = {};
  const body = fields.map(f => {
   let input;
   if (f.type === 'select') input = h('select', {name:f.name}, ...f.options.map(o => typeof o === 'string' ? h('option', {value:o}, o) : h('option', {value:o.value}, o.label)));
   else if (f.type === 'textarea') input = h('textarea', {name:f.name, rows:f.rows || 3, placeholder:f.placeholder || ''});
   else if (f.type === 'checkbox') {input = h('input', {type:'checkbox', name:f.name}); input.checked = !!f.value; inputs[f.name] = input; return h('label', {class:'check'}, input, h('span', {}, f.label));}
   else input = h('input', {name:f.name, type:f.type || 'text', placeholder:f.placeholder || '', step:f.step, min:f.min, list:f.list});
   if (f.value != null) input.value = f.value;
   if (f.required) input.required = true;
   inputs[f.name] = input;
   return h('label', {}, f.label, input, f.hint ? h('small', {}, f.hint) : null);
  });
  const err = h('p', {class:'form-err'});
  const ok = h('button', {class:'btn ' + (danger ? 'danger-fill' : 'primary'), type:'submit'}, submit);
  const cancel = h('button', {class:'btn ghost', type:'button', onclick:() => {dlg.close(); resolve(null);}}, 'Отмена');
  const f = h('form', {method:'dialog'}, h('h2', {}, title), text ? h('p', {class:'muted'}, text) : null, ...body, err, h('div', {class:'actions'}, ok, cancel));
  f.onsubmit = async e => {
   e.preventDefault();
   const values = {}; for (const [k, el] of Object.entries(inputs)) values[k] = el.type === 'checkbox' ? el.checked : el.value.trim();
   ok.disabled = true; err.textContent = '';
   try {const r = onSubmit ? await onSubmit(values) : values; dlg.close(); resolve(r ?? values);} catch (x) {err.textContent = x.message;} finally {ok.disabled = false;}
  };
  dlg.append(f); document.body.append(dlg);
  dlg.addEventListener('close', () => {setTimeout(() => dlg.remove(), 50); resolve(null);});
  dlg.showModal();
  (Object.values(inputs)[0])?.focus();
 });
}
export const confirmBox = (title, text, submit = 'Подтвердить', danger = false) => form({title, text, submit, danger}).then(r => !!r);

// Простое хранилище событий между модулями.
export const ctx = {me:null, team:null, stats:null, view:'home'};
const listeners = new Set();
export const onRefresh = fn => listeners.add(fn);
export const emit = () => {for (const fn of listeners) try {fn();} catch (e) {console.error(e);}};

// Пустое состояние.
export const empty = (ico, title, text, action) => h('div', {class:'empty-state'}, icon(ico, 'ic xl'), h('b', {}, title), text ? h('p', {}, text) : null, action || null);
// Кольцо прогресса плана.
export function ring(value, goal, label) {
 const pct = goal ? Math.min(1, value / goal) : 0, r = 26, c = 2 * Math.PI * r;
 const svg = `<svg viewBox="0 0 64 64" class="ring-svg"><circle cx="32" cy="32" r="${r}" class="ring-bg"/><circle cx="32" cy="32" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/></svg>`;
 return h('div', {class:'ring' + (pct >= 1 ? ' done' : '')}, h('div', {class:'ring-wrap', html:svg}, h('b', {}, value)), h('span', {}, label), h('small', {}, `из ${goal}`));
}
// Мини-график по дням.
export function bars(rows, keys) {
 const max = Math.max(1, ...rows.map(r => keys.reduce((s, k) => s + Number(r[k.key] || 0), 0)));
 return h('div', {class:'bars'}, ...rows.map(r => h('div', {class:'bar-col', title:`${fmtDate(r.day)}: ` + keys.map(k => `${k.label} ${r[k.key]}`).join(', ')},
  h('div', {class:'bar-stack'}, ...keys.map(k => h('i', {style:`height:${Number(r[k.key] || 0) / max * 100}%;background:${k.color}`}))),
  h('small', {}, new Date(r.day).getDate()))));
}
