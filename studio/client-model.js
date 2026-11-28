const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const CLIENT_VIEWS=[['all','Все'],['due','Пора связаться'],['no-site','Сайт не указан'],['site','Есть сайт']];
export function clientQuery(id,{term='',stage='',offset=0,view='all',sort='recent'}={}){
 if(!UUID.test(id))throw Error('Карточка недоступна');
 const q=new URLSearchParams({owner_id:`eq.${id}`,select:'*',order:sort==='reminder'?'remind_at.asc.nullslast,updated_at.desc,id.asc':'updated_at.desc,id.asc',limit:'40',offset:String(Math.max(0,Number(offset)||0))});
 if(['new','contacted','replied','call','client','lost'].includes(stage))q.set('stage','eq.'+stage);
 const filters=[];
 if(view==='no-site')filters.push('or(website.is.null,website.eq.)');
 if(view==='site'){q.set('website','not.is.null');filters.push('website.neq.');}
 if(view==='due'){q.set('remind_at','lte.'+new Date().toISOString());filters.push('stage.in.(new,contacted,replied,call)');}
 const safe=String(term).trim().replace(/[*,()."\\%:]/g,' ').slice(0,100);
 if(safe)filters.push(`or(name.ilike.*${safe}*,city.ilike.*${safe}*,niche.ilike.*${safe}*,phone_key.ilike.*${safe.replace(/\D/g,'')||safe}*)`);
 if(filters.length)q.set('and','('+filters.join(',')+')');return q.toString();
}
export const activeLead=l=>!['client','lost'].includes(l.stage);
export const dueLead=l=>activeLead(l)&&l.remind_at&&new Date(l.remind_at)<=Date.now();
