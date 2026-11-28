// Мини-клиент Supabase (Auth + REST) без внешних библиотек.
import {SUPABASE_URL, SUPABASE_ANON_KEY} from './shared--config.js';
import {createSessionManager} from './shared--session-manager.js';

const DOMAIN = 'neelux.team';
export const emailOf = username => `${String(username).trim().toLowerCase()}@${DOMAIN}`;
export const USERNAME_RE = /^[a-z0-9_.]{3,32}$/;

const resolveServer = config => ({url:String(config?.url || SUPABASE_URL || '').replace(/\/+$/, ''), key:config?.key || SUPABASE_ANON_KEY || ''});
async function server() {return resolveServer((await chrome.storage.local.get('serverConfig')).serverConfig);}
export async function isConfigured() {const s = await server(); return !!(s.url && s.key);}
export function connectionCode(url, key) {return btoa(unescape(encodeURIComponent(JSON.stringify({u:url, k:key}))));}
export async function applyConnectionCode(code) {
 let data;
 try {data = JSON.parse(decodeURIComponent(escape(atob(String(code).trim()))));} catch {throw Error('Код подключения не распознан. Скопируйте его из админ-панели целиком.');}
 if (!/^https:\/\/[\w-]+\.supabase\.co$/.test(String(data.u).replace(/\/+$/, '')) || !data.k) throw Error('Код подключения повреждён');
 await chrome.storage.local.set({serverConfig:{url:data.u, key:data.k}});
}
export async function currentConnectionCode() {const s = await server(); return s.url && s.key ? connectionCode(s.url, s.key) : '';}

const RU = [
 [/Invalid login credentials/i, 'Неверный логин или пароль'],
 [/User already registered/i, 'Такой логин уже занят'],
 [/Password should be at least (\d+)/i, 'Пароль должен быть не короче $1 символов'],
 [/Email not confirmed/i, 'В Supabase включено подтверждение email — выключите его (см. инструкцию для администратора)'],
 [/duplicate key value.*username/i, 'Такой логин уже занят'],
 [/violates row-level security|permission denied/i, 'Недостаточно прав для этого действия'],
 [/JWT expired/i, 'Сессия истекла — войдите снова'],
 [/Failed to fetch|NetworkError/i, 'Нет связи с сервером команды. Проверьте интернет.']
];
const human = m => {m = String(m || 'Ошибка сервера'); for (const [re, t] of RU) {const x = m.match(re); if (x) return t.replace('$1', x[1] || '');} return m;};
export class CloudError extends Error {constructor(message, code) {super(human(message)); this.code = code;}}

async function authRequest(path, body, selectedServer) {
 const s = selectedServer || await server();
 if (!s.url) throw new CloudError('Сервер команды не подключён', 'config');
 let r;
 try {r = await fetch(`${s.url}/auth/v1/${path}`, {method:'POST', headers:{apikey:s.key, 'Content-Type':'application/json'}, body:JSON.stringify(body), signal:AbortSignal.timeout(20000)});}
 catch (e) {throw new CloudError(e.message, 'network');}
 const data = await r.json().catch(() => ({}));
 if (!r.ok) {
  const e = new CloudError(data.msg || data.error_description || data.message || `HTTP ${r.status}`, r.status === 429 || r.status >= 500 ? 'network' : 'auth');
  e.status = r.status; e.serverCode = data.error_code || data.code || data.error;
  const retry = r.headers.get('retry-after'); e.retryAfter = /^\d+$/.test(retry || '') ? Number(retry) * 1000 : Math.max(0, Date.parse(retry) - Date.now()) || 0;
  throw e;
 }
 return data;
}
const sessions = createSessionManager({
 lock:fn=>navigator.locks?navigator.locks.request('neelux-mobile-auth-refresh',fn):fn(),
 storage:{get:keys => chrome.storage.local.get(keys), set:data => chrome.storage.local.set(data), remove:key => chrome.storage.local.remove(key)},
 resolveServer, ErrorType:CloudError,
 refresh:(auth, target) => authRequest('token?grant_type=refresh_token', {refresh_token:auth.refresh_token}, target)
});
const session = () => sessions.session();
async function authorizedFetch(snapshot, request) {
 let response = await request(snapshot);
 await sessions.assertCurrent(snapshot);
 if (response.status === 401) {
  const recovered = await sessions.recover(snapshot);
  response = await request(recovered);
  await sessions.assertCurrent(recovered);
  if (response.status === 401) throw new CloudError('Сервер не подтвердил доступ. Вход сохранён — повторите позже.', 'api');
 }
 return response;
}

export async function signIn(username, password) {
 const ticket = await sessions.beginLogin();
 const s = await authRequest('token?grant_type=password', {email:emailOf(username), password}, ticket.server);
 await sessions.acceptLogin(ticket, s); return s.user?.id;
}
export async function signUp({username, password, displayName, telegram, invite}) {
 username = String(username).trim().toLowerCase();
 if (!USERNAME_RE.test(username)) throw new CloudError('Логин: 3–32 символа, латиница, цифры, точка или _', 'input');
 if (String(password).length < 6) throw new CloudError('Пароль должен быть не короче 6 символов', 'input');
 const ticket = await sessions.beginLogin();
 const s = await authRequest('signup', {email:emailOf(username), password, data:{username, display_name:String(displayName || '').trim(), telegram:String(telegram || '').trim(), invite:String(invite || '').trim()}}, ticket.server);
 if (!s.access_token) throw new CloudError('Email not confirmed', 'auth');
 await sessions.acceptLogin(ticket, s);
}
export async function signOut() {await sessions.signOut();}
export async function changePassword(password) {
 if (String(password).length < 6) throw new CloudError('Пароль должен быть не короче 6 символов', 'input');
 const snapshot = await sessions.context();
 if (!snapshot.auth) throw new CloudError('Войдите в аккаунт', 'auth');
 const r = await authorizedFetch(snapshot, ({server:s,auth}) => fetch(`${s.url}/auth/v1/user`, {method:'PUT', headers:{apikey:s.key, Authorization:'Bearer ' + auth.access_token, 'Content-Type':'application/json'}, body:JSON.stringify({password}),signal:AbortSignal.timeout(20000)}));
 if (!r.ok) {const d = await r.json().catch(() => ({})); throw new CloudError(d.msg || d.message || `HTTP ${r.status}`, 'api');}
}

export async function userId() {return (await session())?.user?.id || null;}

async function rawApi(path, {method = 'GET', body, prefer} = {},snapshot) {
 let r;
 try {
  r = await authorizedFetch(snapshot, ({server:s,auth}) => fetch(`${s.url}/rest/v1/${path}`, {method, headers:{apikey:s.key, Authorization:'Bearer ' + auth.access_token, 'Content-Type':'application/json', ...(prefer ? {Prefer:prefer} : {})}, body:body === undefined ? undefined : JSON.stringify(body),signal:AbortSignal.timeout(20000)}));
 } catch (e) {if (e instanceof CloudError) throw e; throw new CloudError(e.message, 'network');}
 const text = await r.text();
 let data = null; try {data = text ? JSON.parse(text) : null;} catch {if (r.ok) throw new CloudError('Сервер вернул непонятный ответ', 'api');}
 if (!r.ok) throw new CloudError(data?.message || data?.hint || `HTTP ${r.status}`, 'api');
 return data;
}
const pendingReads=new Map();
export async function api(path,options={}){
 const snapshot=await sessions.context();if(!snapshot.auth)throw new CloudError('Войдите в аккаунт','auth');
 if(options.expectedUser && snapshot.auth.user?.id!==options.expectedUser)throw new CloudError('Аккаунт изменился — повторите действие','account_changed');
 const read=(options.method||'GET')==='GET',key=JSON.stringify([snapshot.epoch,snapshot.server.url,snapshot.server.key,snapshot.auth.user?.id,path]);
 const work=async()=>{const data=await rawApi(path,options,snapshot);await sessions.assertCurrent(snapshot);return data;};
 if(!read)return work();if(pendingReads.has(key))return structuredClone(await pendingReads.get(key));
 const promise=work().finally(()=>pendingReads.delete(key));if(pendingReads.size>=64)pendingReads.delete(pendingReads.keys().next().value);pendingReads.set(key,promise);return structuredClone(await promise);
}
export const rpc = (fn, args = {}) => api('rpc/' + fn, {method:'POST', body:args});
export const select = (table, query = '') => api(`${table}?${query}`);
export const insert = (table, row) => api(table, {method:'POST', body:row, prefer:'return=representation'}).then(r => Array.isArray(r) ? r[0] : r);
export const update = (table, filter, patch) => api(`${table}?${filter}`, {method:'PATCH', body:patch, prefer:'return=representation'});
export const remove = (table, filter) => api(`${table}?${filter}`, {method:'DELETE'});

// Загрузка файла в хранилище (публикация обновлений приложения — только админ, по правилам хранилища).
export async function upload(bucket, path, file, onProgress) {
 const s = await server(), auth = await session();
 if (!auth) throw new CloudError('Войдите в аккаунт', 'auth');
 return new Promise((resolve, reject) => {
  const x = new XMLHttpRequest();
  x.open('POST', `${s.url}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`);
  x.setRequestHeader('apikey', s.key); x.setRequestHeader('Authorization', 'Bearer ' + auth.access_token);
  x.setRequestHeader('x-upsert', 'true'); x.setRequestHeader('cache-control', 'no-cache');
  if (file.type) x.setRequestHeader('Content-Type', file.type);
  x.upload.onprogress = e => onProgress?.(e.lengthComputable ? Math.round(e.loaded / e.total * 100) : 0);
  x.onload = () => {if (x.status < 300) resolve(true); else {let m = x.responseText; try {m = JSON.parse(m).message || m;} catch {} reject(new CloudError(m || `HTTP ${x.status}`, 'api'));}};
  x.onerror = () => reject(new CloudError('Нет связи с сервером', 'network'));
  x.send(file);
 });
}
export async function publicUrl(bucket, path) {const s = await server(); return `${s.url}/storage/v1/object/public/${bucket}/${path}`;}

export async function myProfile() {const snapshot = await sessions.context(), id = snapshot.auth?.user?.id; if (!id) return null; const rows = await rawApi(`profiles?id=eq.${id}&select=*`, {}, snapshot); await sessions.assertCurrent(snapshot); return rows[0] || null;}
const TEAM_FIELDS='id,worker_rate,leader_rate,referral_bonus,plan_contacts,plan_followups,plan_deals,max_open_leads,min_payout,services,announcement,updated_at,latest_version,update_url,update_notes,update_required,bonus_streak_days,bonus_streak_amount,t_enabled,t_w1,t_w1_rate,t_w2,t_w3_prize,t_m1,t_m1_prize,t_m2,t_m3,t_m_leader,t_day_lead,t_day_sniper,t_day_raffle,followup_days,followup_max,call_script,idle_minutes,daily_new_limit,tg_bot_username,review_samples,link_site,link_instagram,link_telegram,studio_about,links_mode';
export async function teamSettings({privateFields=false}={}) {const team=(await select('team_settings','id=eq.1&select='+TEAM_FIELDS))[0]||null;if(privateFields&&team){const secrets=(await select('admin_secrets','id=eq.1&select=ai_gemini,ai_groq,ai_openrouter'))[0];if(secrets)Object.assign(team,secrets);}return team;}
export async function ai(action,input={},extra={},options={}){
 const snapshot=await sessions.context();if(!snapshot.auth)throw new CloudError('Войдите в аккаунт команды','auth');
 if(options.expectedUser && snapshot.auth.user?.id!==options.expectedUser)throw new CloudError('Аккаунт изменился — повторите действие','account_changed');
 let response;try{response=await authorizedFetch(snapshot,({server:s,auth})=>fetch(`${s.url}/functions/v1/neelux-ai`,{method:'POST',headers:{apikey:s.key,Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json'},body:JSON.stringify({action,input,...extra}),signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(100000)]):AbortSignal.timeout(100000)}));}catch(e){if(options.signal?.aborted)throw new CloudError('NEELUX AI: ожидание остановлено.','cancelled');if(e instanceof CloudError)throw e;throw new CloudError('NEELUX AI не отвечает. Проверьте интернет и повторите запрос.','network');}
 const data=await response.json().catch(()=>({}));
 if(!response.ok||data.error){const known=String(data.error||'');const message=known.startsWith('NEELUX AI:')?known:response.status===401?'NEELUX AI: сессия истекла. Войдите снова.':response.status===403?'NEELUX AI: доступ к этой задаче ограничен.':response.status===429?'NEELUX AI: много запросов. Подождите минуту.':'NEELUX AI: ответ сейчас недоступен. Повторите запрос чуть позже.';throw new CloudError(message,String(response.status));}
 return action==='status'?data:data.data;
}
export const log = (kind, meta = {}) => insert('activity', {kind, meta}).catch(() => {});
