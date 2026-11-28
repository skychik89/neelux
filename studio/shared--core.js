import {findCity} from './shared--cities.js';

export const SPEEDS = Object.freeze({
 safe:{label:'Аккуратно', min:6000, max:12000},
 normal:{label:'Нормально', min:2500, max:5000},
 fast:{label:'Быстро', min:800, max:1800}
});
export const STAGES = Object.freeze({new:'Новый', contacted:'Написал', replied:'Ответил', call:'Созвон', client:'Клиент', lost:'Отказ'});
export const OPEN_STAGES = ['new','contacted','replied','call'];
export const AI_PROVIDERS = ['gemini', 'groq', 'openrouter'];

export const DEFAULTS = Object.freeze({
 city:'Надым', niches:'Салоны красоты', districts:'', bounds:'', grid:0, limit:100,
 onlyPhone:true, onlyNoSite:false, minRating:0, speed:'normal', pool:false, showCards:true,
 avQueries:'маникюр\nресницы', avSlug:'', avLimit:50, avPages:5, avPrivate:true,
 gisLimit:100, gisPages:5, vkQueries:'маникюр\nбарбершоп', vkLimit:100, vkMembers:0,
 aiOrder:'gemini,groq,openrouter', geminiModel:'gemini-flash-latest', groqModel:'llama-3.3-70b-versatile', openrouterModel:'openrouter/free'
});
const TEXT = ['city','niches','districts','bounds','speed','avQueries','avSlug','vkQueries','aiOrder','geminiModel','groqModel','openrouterModel'];
const BOOL = ['onlyPhone','onlyNoSite','pool','avPrivate','showCards'];
const INT = [['grid',0,10],['limit',0,10000],['avLimit',0,5000],['avPages',1,50],['gisLimit',0,10000],['gisPages',1,30],['vkLimit',0,5000],['vkMembers',0,1000000]];
const NAMES = {grid:'размер сетки', limit:'сколько набрать', avLimit:'сколько набрать на Авито', avPages:'страниц на запрос', gisLimit:'сколько набрать в 2ГИС', gisPages:'страниц на нишу', vkLimit:'сколько групп набрать', vkMembers:'минимум участников'};

export const emptyState = () => ({version:5, settings:{...DEFAULTS}, log:[], maps:null, avito:null, gis:null, vkg:null});
export const lines = v => String(v ?? '').split(/\r?\n|;/).map(x => x.trim()).filter(Boolean);

export function phoneKey(value) {let s=String(value??'').replace(/\D/g,'');if(s.length===11&&s[0]==='8')s='7'+s.slice(1);if(s.length===10&&s[0]==='9')s='7'+s;return s.length>=10&&s.length<=15?s:'';}
export function orgId(url) {try{return new URL(url).pathname.match(/\/org\/(?:[^/]+\/)?(\d+)(?:\/|$)/)?.[1]||'';}catch{return '';}}
export function igName(value) {const s=String(value??'').trim().replace(/^@/,''); const m=s.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([\w.]+)\/?(?:\?.*)?$/i); const n=(m?.[1]||s).toLowerCase(); return /^[a-z0-9_.]{1,30}$/.test(n)&&!['p','reel','reels','stories','explore','direct','accounts'].includes(n)?n:'';}
export function publicURL(value) {try {const u=new URL(value);const h=u.hostname.toLowerCase();if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port||!h.includes('.')||h.includes(':')||/^\d+(?:\.\d+){3}$/.test(h)||/(^|\.)(localhost|local|internal|test|invalid)$/.test(h))return null;u.hash='';return u.href;}catch{return null;}}
export function websiteURL(value) {const v=publicURL(value);if(!v)return null;const h=new URL(v).hostname;return /(^|\.)(yandex\.(ru|com)|ya\.ru|instagram\.com|vk\.com|t\.me|wa\.me|facebook\.com|youtube\.com|2gis\.ru|taplink\.(cc|ru)|linktr\.ee)$/.test(h)?null:v;}

export function validateSettings(input = {}) {
 const src = {...DEFAULTS, ...input};
 if (input.niches == null && input.niche) src.niches = String(input.niche);
 const s = {};
 for (const k of Object.keys(DEFAULTS)) s[k] = src[k];
 for (const k of TEXT) s[k] = String(s[k] ?? '').trim();
 for (const k of BOOL) s[k] = !!s[k];
 if (!s.city) throw Error('Укажите город');
 if (!lines(s.niches).length) throw Error('Укажите хотя бы одну нишу');
 for (const [k, min, max] of INT) {s[k] = Number(s[k]); if (!Number.isInteger(s[k]) || s[k] < min || s[k] > max) throw Error(`Проверьте поле «${NAMES[k]}»: число от ${min} до ${max}`);}
 s.minRating = Number(String(s.minRating).replace(',', '.')); if (!Number.isFinite(s.minRating) || s.minRating < 0 || s.minRating > 5) throw Error('Минимальный рейтинг: от 0 до 5');
 if (!SPEEDS[s.speed]) s.speed = 'normal';
 const order = [...new Set(s.aiOrder.split(',').map(x => x.trim()).filter(x => AI_PROVIDERS.includes(x)))];
 s.aiOrder = [...order, ...AI_PROVIDERS.filter(p => !order.includes(p))].join(',');
 for (const k of ['geminiModel','groqModel','openrouterModel']) if (!/^[\w.:/-]{1,120}$/.test(s[k])) throw Error('Проверьте название модели нейросети');
 return s;
}

// Территория поиска: ручные границы или автоматически по справочнику городов.
export function cityArea(s) {
 if (s.bounds) {
  const b = s.bounds.split(',').map(Number);
  if (b.length !== 4 || b.some(x => !Number.isFinite(x)) || b[0] >= b[2] || b[1] >= b[3] || b[0] < -180 || b[2] > 180 || b[1] < -85 || b[3] > 85) throw Error('Границы: западная долгота, южная широта, восточная долгота, северная широта');
  return {bounds:b, grid:s.grid || 3, auto:false};
 }
 const c = findCity(s.city);
 if (!c) return null;
 const dLat = c.radius / 111, dLon = c.radius / (111 * Math.cos(c.lat * Math.PI / 180));
 const grid = s.grid || (c.radius <= 5 ? 2 : c.radius <= 9 ? 3 : c.radius <= 15 ? 4 : 5);
 return {bounds:[c.lon - dLon, c.lat - dLat, c.lon + dLon, c.lat + dLat], grid, auto:true, name:c.name};
}

// Участок карты: поиск по нише БЕЗ названия города — иначе Яндекс игнорирует координаты участка.
export function sectorUrl(niche, b) {
 const u = new URL('https://yandex.ru/maps/');
 u.searchParams.set('text', niche);
 u.searchParams.set('ll', `${((b[0] + b[2]) / 2).toFixed(5)},${((b[1] + b[3]) / 2).toFixed(5)}`);
 u.searchParams.set('spn', `${((b[2] - b[0]) * 1.05).toFixed(5)},${((b[3] - b[1]) * 1.05).toFixed(5)}`);
 return u.href;
}
export const makeJob = (label, niche, url, extra = {}) => ({label, niche, url, status:'pending', found:0, total:0, ...extra});
// Яндекс отдаёт максимум 25 организаций на запрос — плотный участок делим на 4 части.
export function splitJob(job) {
 const [w, s, e, n] = job.bbox, mx = (w + e) / 2, my = (s + n) / 2;
 return [[w, s, mx, my], [mx, s, e, my], [w, my, mx, n], [mx, my, e, n]].map((b, i) => makeJob(`${job.label}.${i + 1}`, job.niche, sectorUrl(job.niche, b), {bbox:b, depth:(job.depth || 0) + 1}));
}
// Границы города из геокодера Яндекса (для городов не из справочника), не больше ~15 км от центра.
export function geoArea(geo, s) {
 const [[w, so], [e, n]] = geo.bounds, [cx, cy] = geo.center || [(w + e) / 2, (so + n) / 2];
 const hh = Math.min((n - so) / 2, 0.14), hw = Math.min((e - w) / 2, 0.14 / Math.cos(cy * Math.PI / 180));
 return {bounds:[cx - hw, cy - hh, cx + hw, cy + hh], grid:s.grid || (hh > 0.08 ? 3 : 2), auto:true, name:geo.title};
}
export function searchJobs(s, geo = null) {
 const niches = lines(s.niches), districts = String(s.districts).split('\n').map(x => x.trim()).filter(Boolean);
 const area = cityArea(s) || (geo ? geoArea(geo, s) : null), jobs = [], many = niches.length > 1;
 const label = (t, niche) => many ? `${niche} · ${t}` : t;
 for (const niche of niches) {
  if (!geo) jobs.push(makeJob(label(s.city, niche), niche, `https://yandex.ru/maps/?text=${encodeURIComponent(niche + ' ' + s.city)}`));
  if (!geo) for (const d of districts) jobs.push(makeJob(label(d, niche), niche, `https://yandex.ru/maps/?text=${encodeURIComponent(`${niche} ${s.city} ${d}`)}`));
  if (!area) continue;
  const [w0, s0, e0, n0] = area.bounds, g = area.grid, w = (e0 - w0) / g, h = (n0 - s0) / g;
  for (let y = 0; y < g; y++) for (let x = 0; x < g; x++) {
   const b = [w0 + w * x, s0 + h * y, w0 + w * (x + 1), s0 + h * (y + 1)];
   jobs.push(makeJob(label(`Участок ${y + 1}.${x + 1}`, niche), niche, sectorUrl(niche, b), {bbox:b, depth:0}));
  }
 }
 return jobs;
}

// ---------- Авито ----------
const AV_SLUGS = {'москва':'moskva','санкт-петербург':'sankt-peterburg','нижний новгород':'nizhniy_novgorod','ростов-на-дону':'rostov-na-donu'};
export function avitoSlug(city) {
 const c = String(city).trim().toLowerCase().replace(/ё/g, 'е');
 return AV_SLUGS[c] || translit(c).replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
}
export function avitoUrl(slug, query, page = 1) {
 const u = new URL(`https://www.avito.ru/${slug}/predlozheniya_uslug`);
 u.searchParams.set('q', query); if (page > 1) u.searchParams.set('p', page);
 return u.href;
}
export function avitoJobs(s) {
 const slug = s.avSlug || avitoSlug(s.city);
 return lines(s.avQueries).map(q => makeJob(`${q} · стр. 1`, q, avitoUrl(slug, q, 1), {page:1, slug}));
}
// ---------- 2ГИС ----------
export const gisUrl = (alias, query, page = 1) => `https://2gis.ru/${alias}/search/${encodeURIComponent(query)}${page > 1 ? '/page/' + page : ''}`;
export const gisJobs = (s, alias) => lines(s.niches).map(q => makeJob(`${q} · стр. 1`, q, gisUrl(alias, q, 1), {page:1, alias}));
// ---------- Группы ВКонтакте ----------
export const vkUrl = (query, city) => `https://vk.com/search/communities?q=${encodeURIComponent(`${query} ${city}`.trim())}`;
export const vkJobs = s => lines(s.vkQueries).map(q => makeJob(q, q, vkUrl(q, s.city)));
export const SOURCES = Object.freeze({maps:'Яндекс.Карты', gis:'2ГИС', avito:'Авито', vkg:'ВКонтакте', instagram:'Instagram', manual:'Вручную'});

export function hasContact(l) {
 return (l.phones||[]).some(p=>!!phoneKey(p)) || !!igName(l.instagram) || (l.emails||[]).some(e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) || (l.socials||[]).some(v=>{try{const u=new URL(v);return u.protocol==='https:'&&/^(?:www\.)?(?:t\.me|wa\.me|vk\.com|instagram\.com|facebook\.com|api\.whatsapp\.com)$/.test(u.hostname)&&u.pathname.length>1;}catch{return false;}});
}
// Отбор карточки по фильтрам пользователя. Возвращает причину отказа или ''.
export function leadFilter(s, lead) {
 if (!hasContact(lead)) return 'нет контактов';
 if (s.onlyPhone && !(lead.phones || []).some(p => phoneKey(p))) return 'нет телефона';
 if (s.onlyNoSite && lead.website) return 'есть сайт';
 if (s.minRating > 0 && lead.rating != null && lead.rating < s.minRating) return 'низкий рейтинг';
 return '';
}
// Данные для облачной функции claim_lead (антидубль по карточке, телефону и Instagram).
export function leadPayload(lead) {
 const ig = igName(lead.instagram);
 return {
  org_key:lead.orgKey || (lead.orgId ? 'ya:' + lead.orgId : ig ? 'ig:' + ig : null),
  phone_key:(lead.phones || []).map(phoneKey).find(Boolean) || null,
  ig:ig || null, name:String(lead.name || '').slice(0, 300), city:lead.city || '', niche:lead.niche || '', address:lead.address || '',
  phones:lead.phones || [], emails:lead.emails || [], socials:lead.socials || [], website:lead.website || '',
  rating:lead.rating ?? null, reviews:lead.reviews ?? null, card_url:lead.cardUrl || '', source:lead.source || 'maps', notes:lead.note || '', pool:!!lead.pool
 };
}
export function speedDelay(s, random = Math.random) {const v = SPEEDS[s.speed] || SPEEDS.normal; return Math.round(v.min + random() * (v.max - v.min));}

// ---------- Instagram: генератор поисковых запросов для ручного поиска ----------
const TR = {а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
export const translit = s => String(s).toLowerCase().replace(/[а-яё]/g, c => TR[c] ?? c);
export function igQueries(keyword, city) {
 const kw = String(keyword).trim(), c = String(city).trim();
 if (!kw) return [];
 const out = [`${kw} ${c}`, `${translit(kw)} ${translit(c)}`, `${kw.replace(/\s+/g, '')}${c.replace(/\s+/g, '').toLowerCase()}`, `${translit(kw).replace(/\s+/g, '')}_${translit(c).replace(/\s+/g, '')}`];
 return [...new Set(out.map(q => q.trim()).filter(Boolean))];
}

export const money = n => `${Math.round(Number(n || 0)).toLocaleString('ru-RU')} ₽`;
export function dayStart(t = Date.now()) {const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime();}
export function monthStart(t = Date.now()) {const d = new Date(t); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime();}
// Подстановка переменных в шаблон: {ИМЯ} {ГОРОД} {НИША} {МОЁ_ИМЯ}.
export function fillTemplate(text, v = {}) {
 return String(text).replace(/\{(ИМЯ|ГОРОД|НИША|МОЁ_ИМЯ|ПОДПИСЬ|ЗАЦЕПКА|ССЫЛКИ|КОНТАКТЫ|САЙТ|INSTAGRAM|ИНСТАГРАМ|TELEGRAM|ТЕЛЕГРАМ|NAME|CITY|NICHE|SIGN)\}/g, (_, k) =>
  String({ИМЯ:v.name, NAME:v.name, ГОРОД:v.city, CITY:v.city, НИША:v.niche, NICHE:v.niche, МОЁ_ИМЯ:v.me, ПОДПИСЬ:v.sign, SIGN:v.sign, ЗАЦЕПКА:v.hook, ССЫЛКИ:v.links, КОНТАКТЫ:v.links,
   САЙТ:v.site, INSTAGRAM:v.instagram, ИНСТАГРАМ:v.instagram, TELEGRAM:v.telegram, ТЕЛЕГРАМ:v.telegram}[k] ?? ''));
}
