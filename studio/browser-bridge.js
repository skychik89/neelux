// Web-only storage adapter. No Electron bridge, provider keys, or desktop sessions.
(()=>{
 'use strict';
 if(!AbortSignal.timeout)AbortSignal.timeout=ms=>{const c=new AbortController();setTimeout(()=>c.abort(new DOMException('Timeout','TimeoutError')),ms);return c.signal;};
 if(!AbortSignal.any)AbortSignal.any=signals=>{const c=new AbortController();for(const s of signals){if(s.aborted){c.abort(s.reason);break;}s.addEventListener('abort',()=>c.abort(s.reason),{once:true});}return c.signal;};
 const prefix='neelux-mobile:v1:',listeners=new Set();
 const read=key=>{const raw=localStorage.getItem(prefix+key);return raw==null?undefined:JSON.parse(raw);};
 const emit=changes=>{if(Object.keys(changes).length)queueMicrotask(()=>listeners.forEach(fn=>fn(structuredClone(changes),'local')));};
 window.chrome={storage:{local:{
  get:async keys=>{const names=keys==null?Object.keys(localStorage).filter(k=>k.startsWith(prefix)).map(k=>k.slice(prefix.length)):typeof keys==='string'?[keys]:Array.isArray(keys)?keys:Object.keys(keys);const result={};for(const k of names){const v=read(k);if(v!==undefined)result[k]=v;else if(keys&&typeof keys==='object'&&!Array.isArray(keys))result[k]=keys[k];}if(names.includes('serverConfig')&&!result.serverConfig)result.serverConfig={url:NEELUX_MOBILE_CONFIG.url,key:NEELUX_MOBILE_CONFIG.key};return structuredClone(result);},
  set:async data=>{const changes={};for(const [k,v]of Object.entries(data)){const oldValue=read(k);localStorage.setItem(prefix+k,JSON.stringify(v));changes[k]={oldValue,newValue:v};}emit(changes);},
  remove:async keys=>{const changes={};for(const k of [].concat(keys)){const oldValue=read(k);localStorage.removeItem(prefix+k);changes[k]={oldValue};}emit(changes);}
 },onChanged:{addListener:fn=>listeners.add(fn)}}};
 addEventListener('storage',e=>{if(!e.key?.startsWith(prefix))return;try{emit({[e.key.slice(prefix.length)]:{oldValue:e.oldValue?JSON.parse(e.oldValue):undefined,newValue:e.newValue?JSON.parse(e.newValue):undefined}});}catch{window.dispatchEvent(new Event('neelux:storage-error'));}});
})();
