// One account, one request at a time; bounded visible work, cancellation, dedupe.
export function briefFingerprint(l){return JSON.stringify([l.id,l.owner_id,l.name,l.city,l.niche,l.stage,l.website,l.site_status,l.rating,l.reviews,l.notes,l.socials,l.ig]);}
export function createBriefQueue({load,save,run,onChange=()=>{},clock=Date.now,gapMs=16000,ttlMs=86400000}){
 let scope='',epoch=0,active=null,timer=null,last=0;const cache=new Map(),queue=[];
 const key=l=>briefFingerprint(l);
 const notify=(id,s)=>onChange(id,s);
 function reset(next=''){epoch++;scope=next;active?.controller.abort();active=null;clearTimeout(timer);timer=null;queue.splice(0);cache.clear();last=0;}
 function peek(l){const v=cache.get(l.id);return v?.fingerprint===key(l)&&clock()-v.at<ttlMs?v:null;}
 async function pump(){
  if(active||!queue.length||!scope)return;
  const delay=last?Math.max(0,gapMs-(clock()-last)):0;if(delay){clearTimeout(timer);timer=setTimeout(pump,delay);return;}
  const job=queue.shift(),controller=new AbortController(),stamp=epoch,account=scope;active={...job,controller};last=clock();notify(job.lead.id,{state:'loading'});
  try{
   const data=await run(job.lead,controller.signal);
   if(stamp!==epoch||account!==scope)return;
   const entry={fingerprint:job.fingerprint,at:clock(),data};cache.set(job.lead.id,entry);await save(account,job.lead.id,entry);
   if(stamp===epoch)notify(job.lead.id,{state:'ready',...entry});
  }catch(e){if(stamp===epoch&&!controller.signal.aborted){const entry={fingerprint:job.fingerprint,at:clock()-ttlMs+60000,error:String(e.message||e)};cache.set(job.lead.id,entry);notify(job.lead.id,{state:'error',...entry});}}
  finally{if(stamp===epoch){active=null;pump();}}
 }
 async function enqueue(lead,{force=false,priority=false}={}){
  if(!scope||!lead.id)return;const stamp=epoch,account=scope,fingerprint=key(lead);
  if(active?.lead.id===lead.id&&active.fingerprint===fingerprint)return;
  if(!force){const current=peek(lead);if(current){notify(lead.id,{state:current.error?'error':'ready',...current});return;}const stored=await load(account,lead.id);if(stamp!==epoch)return;if(stored?.fingerprint===fingerprint&&clock()-stored.at<ttlMs){cache.set(lead.id,stored);notify(lead.id,{state:'ready',...stored});return;}}
  if(stamp!==epoch)return;if(active?.lead.id===lead.id&&active.fingerprint===fingerprint)return;const existing=queue.findIndex(j=>j.lead.id===lead.id);if(existing>=0)queue.splice(existing,1);
  if(queue.length>=12&&!priority)return;
  const job={lead:{...lead},fingerprint};priority?queue.unshift(job):queue.push(job);if(queue.length>12)queue.pop();notify(lead.id,{state:'queued'});pump();
 }
 return {reset,peek,enqueue,scope:()=>scope,pending:()=>queue.length+(active?1:0)};
}
