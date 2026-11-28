// «Голос студии»: ссылки студии в сообщениях, правдивые зацепки из данных клиента и защита от выдумок ИИ.
// Чистые функции без DOM — их можно проверять тестами.

// ---------- Ссылки студии ----------
const clean = s => String(s ?? '').trim();
export function normSite(v) {
 const s = clean(v).replace(/\s+/g, ''); if (!s || !/[.:]/.test(s)) return '';
 return /^https?:\/\//i.test(s) ? s : 'https://' + s.replace(/^\/+/, '');
}
const handleOf = (v, re) => clean(v).replace(re, '').replace(/^@/, '').replace(/[/?#].*$/, '').replace(/[^\w.]/g, '');
export function normIg(v) {const h = handleOf(v, /^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i); return h ? `https://instagram.com/${h}` : '';}
export function normTg(v) {const h = handleOf(v, /^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\//i); return h ? `https://t.me/${h}` : '';}

// Настройки студии из team_settings. Если Telegram не указан отдельно — используем бота команды.
export function studioOf(team = {}) {
 const mode = ['off', 'first', 'all'].includes(team?.links_mode) ? team.links_mode : 'first';
 return {site:normSite(team?.link_site), instagram:normIg(team?.link_instagram), telegram:normTg(team?.link_telegram) || normTg(team?.tg_bot_username), about:clean(team?.studio_about).slice(0, 1500), mode};
}
export const hasLinks = s => !!(s && (s.site || s.instagram || s.telegram));

// Адрес без протокола/www/хвоста — для сравнения «эта ссылка уже есть в тексте».
export const bare = u => clean(u).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[?#].*$/, '').replace(/[\s/.,;:!)»"']+$/g, '');

const LABELS = [['site', 'Сайт'], ['instagram', 'Instagram'], ['telegram', 'Telegram']];
// Строки со ссылками, которых ещё нет в тексте.
export function linksBlock(studio, text = '') {
 if (!hasLinks(studio)) return '';
 const have = String(text).toLowerCase();
 return LABELS.filter(([k]) => studio[k] && !have.includes(bare(studio[k]))).map(([k, l]) => `${l}: ${studio[k]}`).join('\n');
}
// Нужны ли ссылки в сообщении этого типа. «first» — приветствия, предложения, дожимы; «all» — вообще везде.
const OUTBOUND = new Set(['first', 'followup', 'offer', 'post']);
export function linksWanted(mode, {task = '', category = ''} = {}) {
 if (mode === 'off' || task === 'summary') return false;
 if (mode === 'all') return true;
 return OUTBOUND.has(task) || /перв|дожим|предлож|знаком|привет/i.test(category);
}
const PLACEHOLDER = /\{(?:ССЫЛКИ|КОНТАКТЫ|САЙТ|INSTAGRAM|ИНСТАГРАМ|TELEGRAM|ТЕЛЕГРАМ)\}/i;
export const hasLinkVar = body => PLACEHOLDER.test(String(body));
export function withLinks(text, studio, opts) {
 if (!hasLinks(studio) || !linksWanted(studio.mode, opts)) return text;
 const block = linksBlock(studio, text);
 return block ? `${String(text).trimEnd()}\n\n${block}` : text;
}

// ---------- Правдивая зацепка ----------
const plural = (n, [a, b, c]) => {const m = Math.abs(n) % 100, d = m % 10; return m > 10 && m < 20 ? c : d > 1 && d < 5 ? b : d === 1 ? a : c;};
export const hostOf = u => {try {return new URL(/^https?:/i.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, '');} catch {return '';}};
// Только то, что реально видно в данных о клиенте. Нет данных — пустая строка (а не выдумка).
export function hook(lead = {}) {
 const out = [], rating = Number(lead.rating), reviews = Number(lead.reviews);
 if (rating >= 4.5 && reviews >= 10) out.push(`У вас рейтинг ${String(rating).replace('.', ',')} и ${reviews} ${plural(reviews, ['отзыв', 'отзыва', 'отзывов'])} — видно, что клиенты вас ценят.`);
 if (lead.website && hostOf(lead.website)) out.push(`Нашли ваш сайт ${hostOf(lead.website)}.`);
 else if (MAPS.has(lead.source)) out.push('В вашей карточке на картах не нашли ссылку на сайт.');
 else if (lead.ig) out.push(`Нашли ваш Instagram @${lead.ig}.`);
 return out.slice(0, 2).join(' ');
}

// ---------- Факты о клиенте для ИИ ----------
const MAPS = new Set(['maps', 'gis', '2gis']);
export function factsOf(lead = {}, extra = {}) {
 const f = {'название':lead.name, 'ниша':lead.niche, 'город':lead.city, 'рейтинг':lead.rating || undefined, 'отзывов':lead.reviews || undefined,
  'сайт':lead.website ? hostOf(lead.website) : MAPS.has(lead.source) ? 'в карточке на картах не указан' : undefined, 'instagram':lead.ig ? '@' + lead.ig : undefined,
  'соцсети':(lead.socials || []).map(hostOf).filter(Boolean).join(', ') || undefined, 'адрес':lead.address || undefined,
  'уже писали раз':lead.touches || undefined, 'заметки сотрудника':String(lead.notes || '').split('\n').filter(Boolean).slice(-3).join(' | ').slice(0, 300) || undefined, ...extra};
 return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== ''));
}

// ---------- Защита от выдумок ----------
const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"')]+|\b(?:t\.me|wa\.me|instagram\.com|vk\.com)\/[^\s<>"')]+|\b(?:[a-z0-9-]+\.)+(?:ru|com|net|org|рф|io|me|su|pro|studio|site|online|shop|app|tech|biz|info|dev|ly|by|kz|ua)\b(?:\/[^\s<>"')]*)?/gi;
const PHONE_RE = /(?:\+7|\b8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}|\+\d[\d\s().-]{9,}\d/g;
const HANDLE_RE = /(?:^|[\s(])@([A-Za-z0-9_.]{3,})/g;
const MONEY_RE = /(\d[\d\s]*(?:[.,]\d+)?)\s*(?:₽|руб(?:л[а-я]*)?\.?|р\.|тыс(?:яч[а-я]*)?\.?|%)/gi;
const TERM_RE = /(\d+)(?:\s*[–-]\s*(\d+))?\s*(?:дн(?:я|ей|ь)|нед(?:ели|ель|елю)|час(?:а|ов)?|мин(?:ут[а-я]*)?)/gi;
const CLAIM_RE = /гарантир|№\s*1|лучш(?:ая|ие|ий|ее)\s+в\b|тысяч[а-я]*\s+(?:клиент|проект)|\d+\+?\s*(?:проектов|клиентов|лет\s+на\s+рынке)/gi;
const digitsOf = s => String(s).replace(/\D/g, '');
// Числа из текста, включая «25 000» как 25000 (пробел-разделитель тысяч).
const numbersIn = s => {const src = String(s), out = new Set(); for (const x of [src, src.replace(/(\d)[\s\u00a0](?=\d{3}(?!\d))/g, '$1')]) for (const m of x.match(/\d+(?:[.,]\d+)?/g) || []) out.add(m.replace(',', '.')); return out;};

// Возвращает список проблем: чего нет в разрешённом тексте (шаблон, данные клиента, описание студии), но есть в ответе ИИ.
export function guard(text, allowed = '') {
 const t = String(text), a = String(allowed), al = a.toLowerCase(), problems = [];
 if (/\[[^\]]{2,40}\]|\{[^}]{2,40}\}/.test(t)) problems.push({type:'placeholder', text:(t.match(/\[[^\]]{2,40}\]|\{[^}]{2,40}\}/) || [''])[0]});
 const allowedUrls = (a.match(URL_RE) || []).map(bare);
 for (const u of t.match(URL_RE) || []) {const b = bare(u); if (b && !allowedUrls.some(x => x === b || x.startsWith(b) || b.startsWith(x))) problems.push({type:'link', text:u});}
 const allowedPhones = (a.match(PHONE_RE) || []).map(p => digitsOf(p).slice(-10));
 for (const p of t.match(PHONE_RE) || []) if (!allowedPhones.includes(digitsOf(p).slice(-10))) problems.push({type:'phone', text:p});
 for (const m of t.matchAll(HANDLE_RE)) if (!al.includes('@' + m[1].toLowerCase()) && !al.includes('/' + m[1].toLowerCase())) problems.push({type:'handle', text:'@' + m[1]});
 const nums = numbersIn(a);
 for (const m of t.matchAll(MONEY_RE)) {const n = m[1].replace(/\s/g, '').replace(',', '.'); if (!nums.has(n) && !nums.has(m[1].trim())) problems.push({type:'price', text:m[0].trim()});}
 for (const m of t.matchAll(TERM_RE)) for (const n of [m[1], m[2]].filter(Boolean)) if (!nums.has(n)) problems.push({type:'term', text:m[0].trim()});
 for (const m of t.match(CLAIM_RE) || []) if (!al.includes(m.toLowerCase())) problems.push({type:'claim', text:m});
 return problems;
}

const tidy = v => String(v ?? '').replace(/^\s*(?:вариант\s*\d+\s*[:.)-]|\d+[.)])\s*/i, '').replace(/^["«»“”]+|["«»“”]+$/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
// Проверка и доработка вариантов ИИ: убирает выдумки, добавляет ссылки студии. Если всё забраковано — подставляет запасной текст.
export function finalize(variants, {source = '', facts = {}, studio = {}, task = '', category = '', fallback = '', extra = ''} = {}) {
 const allowed = [source, extra, fallback, studio.about, studio.site, studio.instagram, studio.telegram, JSON.stringify(facts)].filter(Boolean).join('\n');
 const good = [], dropped = [], seen = new Set();
 for (const raw of variants || []) {
  const v = tidy(raw); if (v.length < 8) continue;
  const problems = guard(v, allowed);
  if (problems.length) {dropped.push({text:v, problems}); continue;}
  const key = v.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ''); if (seen.has(key)) continue; seen.add(key);
  good.push(withLinks(v, studio, {task, category}));
 }
 if (!good.length && fallback) return {variants:[withLinks(fallback, studio, {task, category})], dropped, usedFallback:true};
 return {variants:good, dropped, usedFallback:false};
}

export const TONE_STEPS = [['Короче', 'Сократи до 1–2 предложений, сохрани суть и вопрос в конце.'], ['Теплее', 'Сделай теплее и человечнее, без лести. Максимум один эмодзи.'], ['Деловее', 'Сделай деловым тоном на «вы», без эмодзи.'], ['Проще', 'Перепиши простыми короткими словами, как говорят в жизни.']];
