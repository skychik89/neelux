const CACHE='neelux-mobile-0f7d5f726b0aafa7';
const ASSETS=["browser-bridge.js","client-brief.js","client-model.js","config.js","data.js","icons--icon180.png","icons--icon192.png","icons--icon512.png","icons--maskable512.png","index.html","manifest.webmanifest","mobile.css","mobile.js","shared--adapt.js","shared--app.css","shared--appearance.js","shared--beta-glass.css","shared--brief-queue.js","shared--case-assets--ava.jpg","shared--case-assets--bjorn.jpg","shared--case-assets--brooklands.jpg","shared--case-assets--firm.jpg","shared--case-assets--keeplooking.jpg","shared--case-assets--mannik.jpg","shared--case-assets--mone.jpg","shared--case-assets--surf.jpg","shared--case-catalog.js","shared--cities.js","shared--cloud.js","shared--config.js","shared--core.js","shared--knowledge-core.js","shared--liquid-background.png","shared--liquid-ui.css","shared--message-format.js","shared--session-manager.js","shared--studio.css","shared--ui.js","update-helper.js","usability.css"];
const urls=new Set(ASSETS.map(p=>new URL(p,self.registration.scope).href));
const indexURL=new URL('index.html',self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...urls]))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('neelux-mobile-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
 if(request.method!=='GET'||url.origin!==scope.origin||request.headers.has('authorization')||url.search)return;
 if(request.mode==='navigate'&&url.pathname.startsWith(scope.pathname)){
  event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match(indexURL))));return;
 }
 if(!urls.has(url.href))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const hit=await cache.match(request);if(hit)return hit;const response=await fetch(request);if(response.ok&&response.type==='basic')await cache.put(request,response.clone());return response;})());
});
