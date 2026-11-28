// Loaded by the network-first HTML too, so an older installed shell can offer
// a deliberate update without silently discarding an employee's draft.
(()=>{
 if(!('serviceWorker'in navigator))return;
 let requested=false,box;
 const show=reg=>{
  if(!reg.waiting||box)return;
  box=document.createElement('aside');box.className='m-update';box.setAttribute('aria-label','Обновление приложения');
  const text=document.createElement('span');text.textContent='Доступна новая версия Studio';
  const apply=document.createElement('button');apply.className='btn primary';apply.textContent='Обновить';apply.onclick=async()=>{
   if(window.NeeluxApplyUpdate){await window.NeeluxApplyUpdate(reg);return;}
   if(!confirm('Обновить Studio? Несохранённые изменения и черновики на этом экране будут закрыты. Данные в базе сохранятся.'))return;
   requested=true;reg.waiting?.postMessage({type:'ACTIVATE_UPDATE'});
  };
  const later=document.createElement('button');later.className='btn ghost';later.textContent='Позже';later.onclick=()=>box.remove();box.append(text,apply,later);document.body.append(box);
 };
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(requested)location.reload();});
 navigator.serviceWorker.ready.then(reg=>{
  const watch=worker=>worker?.addEventListener('statechange',()=>{if(worker.state==='installed')setTimeout(()=>show(reg),0);});
  show(reg);watch(reg.installing);reg.addEventListener('updatefound',()=>watch(reg.installing));
  if(navigator.onLine)reg.update().catch(()=>{});
 }).catch(()=>{});
})();
