// Session updates are conditional: an old request must never replace a newer login.
export function createSessionManager({storage, resolveServer, refresh, ErrorType = Error, now = () => Date.now(), lock = fn => fn()}) {
 let epoch = 0, mutations = Promise.resolve();
 const pending = new Map(), backoff = new Map(), renewed = new Map();
 const error = (message, code) => {const e = new ErrorType(message, code); e.code = code; return e;};
 const scope = s => JSON.stringify([s.url, s.key]);
 const sameAccount = (a, b) => a.epoch === b.epoch && scope(a.server) === scope(b.server) && a.auth?.user?.id === b.auth?.user?.id;
 const sameToken = (a, b) => sameAccount(a, b) && a.auth?.access_token === b.auth?.access_token && a.auth?.refresh_token === b.auth?.refresh_token;
 const key = c => JSON.stringify([c.epoch, scope(c.server), c.auth?.access_token, c.auth?.refresh_token]);
 const snapshot = async () => {const generation = epoch, data = await storage.get(['auth', 'serverConfig']); return {auth:data.auth || null, server:resolveServer(data.serverConfig), epoch:generation};};
 const serialize = fn => {const work = mutations.then(fn); mutations = work.catch(() => {}); return work;};
 const changed = () => error('Аккаунт изменился — откройте раздел заново', 'account_changed');
 const temporary = () => error('Временно нет связи с сервером входа. Вход сохранён — повторите чуть позже.', 'network');
 const valid = a => Number(a?.expires_at) * 1000 > now();
 const terminal = e => ['refresh_token_not_found', 'refresh_token_already_used', 'session_expired', 'session_not_found', 'user_not_found', 'user_banned'].includes(e.serverCode) || /Invalid Refresh Token/i.test(e.message || '');
 function normalize(s, previous) {
  if (!s || typeof s.access_token !== 'string' || !s.access_token || !(s.user?.id || previous?.user?.id)) throw temporary();
  const seconds = Number(s.expires_in);
  const expires_at = seconds > 0 ? Math.floor(now() / 1000) + seconds : Number(s.expires_at);
  if (!Number.isFinite(expires_at) || expires_at <= now() / 1000) throw temporary();
  return {access_token:s.access_token, refresh_token:s.refresh_token || previous?.refresh_token || '', expires_at, user:{id:s.user?.id || previous.user.id}};
 }
 async function assertCurrent(c) {const current = await snapshot(); if (!sameAccount(c, current)) throw changed(); return current;}
 async function renew(c, force = false) {
  let current = await assertCurrent(c);
  if (!sameToken(c, current)) return current.auth;
  if (!c.auth?.refresh_token) {if (valid(c.auth) && !force) return c.auth; throw error('Сессия истекла — войдите снова', 'auth');}
  const id = key(c);
  if (pending.has(id)) return pending.get(id);
  if (force && (renewed.get(id) || 0) > now()) throw error('Сервер не подтвердил доступ. Вход сохранён — повторите позже.', 'api');
  if ((backoff.get(id)?.until || 0) > now()) {if (valid(c.auth) && !force) return c.auth; throw temporary();}
  const work = lock(async () => {
   const latest = await assertCurrent(c); if (!sameToken(c, latest)) return latest.auth;
   try {
    const data = await refresh(c.auth, c.server), auth = normalize(data, c.auth);
    return await serialize(async () => {
     current = await assertCurrent(c);
     if (!sameToken(c, current)) return current.auth;
     await storage.set({auth});
     const next = {...c, auth}; renewed.set(key(next), now() + 30000); backoff.delete(id);
     return auth;
    });
   } catch (e) {
    current = await assertCurrent(c);
    if (!sameToken(c, current)) return current.auth;
    if (terminal(e)) {
     const cleared = await serialize(async () => {const latest = await snapshot(); if (!sameToken(c, latest)) return false; await storage.remove('auth'); return true;});
     if (!cleared) {current = await assertCurrent(c); return current.auth;}
     throw error('Сессия завершена сервером — войдите снова', 'auth');
    }
    if (e.code === 'account_changed') throw e;
    const attempts = (backoff.get(id)?.attempts || 0) + 1;
    backoff.set(id, {attempts, until:now() + Math.min(300000, Math.max(Number(e.retryAfter) || 0, 5000 * 2 ** Math.min(attempts - 1, 6)))});
    if (backoff.size > 32) backoff.delete(backoff.keys().next().value);
    if (renewed.size > 32) renewed.delete(renewed.keys().next().value);
    if (valid(c.auth) && !force) return c.auth;
    throw temporary();
   }
  });
  pending.set(id, work);
  try {return await work;} finally {if (pending.get(id) === work) pending.delete(id);}
 }
 async function context() {
  const c = await snapshot();
  if (c.auth && Number(c.auth.expires_at) * 1000 - now() <= 90000) c.auth = await renew(c);
  await assertCurrent(c);
  return c;
 }
 return {
  context,
  session:async () => (await context()).auth,
  assertCurrent,
  recover:async c => {const auth = await renew(c, true); return {...c, auth};},
  beginLogin:async () => {++epoch; return snapshot();},
  acceptLogin:async (ticket, data) => serialize(async () => {
   const current = await snapshot();
   if (ticket.epoch !== epoch || scope(ticket.server) !== scope(current.server)) throw changed();
   await storage.set({auth:normalize(data)});
  }),
  signOut:async () => {++epoch; await serialize(() => storage.remove('auth'));}
 };
}
