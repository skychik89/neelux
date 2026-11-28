import * as cloud from './shared--cloud.js';
import {h,put,button,ctx,toast,fmt,form,emit} from './shared--ui.js';
import {DIRECTIONS,HANDOFF_STATUS,ORIGINS,normalizeHandoff} from './shared--handoff-core.js';
const field=(label,input)=>h('label',{},label,input);
const line=(text,value='')=>h('input',{value,placeholder:text});
export async function openHandoff(lead=null,{onSaved,mobile=false,partnerCompany=false}={}){
 const me=ctx.me;if(!me)throw Error('Войдите в Studio');
 const actor=me.id,request_id=crypto.randomUUID();let step=0;const chosen=new Set(),details={};
 const client=line('Название компании',lead?.name||''),contact=line('Телефон, Telegram или другой способ связи',partnerCompany?[lead?.phone,lead?.telegram].filter(Boolean).join(' · '):[(lead?.phones||[])[0],lead?.ig?'@'+lead.ig:''].filter(Boolean).join(' · ')),person=line('Имя контактного лица',lead?.contact_name||''),summary=h('textarea',{rows:4,placeholder:'Что обсудили и какой результат нужен клиенту'}),budget=line('Не обсуждали'),time=line('Когда удобно связаться');
 const origin=h('select',{},h('option',{value:''},'Не указан'),...Object.entries(ORIGINS).map(([v,l])=>h('option',{value:v},l)));origin.value=lead?.lead_origin||'';const originNote=line('Кто порекомендовал или передал контакт',lead?.origin_note||''),consent=h('input',{type:'checkbox'});
 const dlg=h('dialog',{class:'modal handoff-modal'+(mobile?' mobile-handoff':'')}),body=h('div',{}),error=h('p',{class:'form-err',role:'alert'}),back=h('button',{class:'btn ghost',type:'button',onclick:()=>{step--;draw();}},'Назад'),next=h('button',{class:'btn primary',type:'submit'},'Далее'),cancel=h('button',{class:'btn ghost',type:'button',onclick:()=>dlg.close()},'Отмена');
 const f=h('form',{},h('h2',{},'Передать клиента'),body,error,h('div',{class:'actions'},cancel,back,next));dlg.append(f);document.body.append(dlg);
 const accountReset=()=>dlg.close();window.addEventListener('neelux:account-reset',accountReset);dlg.addEventListener('close',()=>window.removeEventListener('neelux:account-reset',accountReset),{once:true});
 function recipient(d){return d==='merch'?'Партнёр по мерчу':'Команда Neelux';}
 function draw(){
  error.textContent='';back.hidden=step===0;next.textContent=step===2?'Передать заявку':'Далее';put(body,h('p',{class:'muted handoff-step'},`Шаг ${step+1} из 3 · ${['Что нужно клиенту','Что уже обсудили','Проверить и передать'][step]}`));
  if(step===0)body.append(h('p',{class:'muted'},'Можно выбрать несколько направлений.'),h('div',{class:'handoff-options'},DIRECTIONS.map(d=>{const input=h('input',{type:'checkbox',value:d.id});input.checked=chosen.has(d.id);input.onchange=()=>input.checked?chosen.add(d.id):chosen.delete(d.id);return h('label',{},input,h('span',{},h('b',{},d.label),h('small',{},d.hint)));})));
  if(step===1){body.append(field('Компания',client),field('Способ связи',contact),field('Контактное лицо',person),field('Что нужно и что обсудили',summary));
   for(const d of chosen){if(!details[d])details[d]=h('textarea',{rows:2,placeholder:d==='merch'?'Какая продукция, тираж, есть ли дизайн? Можно указать «не обсуждали».':d==='automation'?'Какой процесс хотят упростить?':d==='promotion'?'Каких клиентов и из каких каналов хотят привлекать?':d==='website'?'Что должен делать сайт? Есть ли текущий?':'Опишите задачу.'});body.append(field(DIRECTIONS.find(x=>x.id===d).label+' — подробности',details[d]));}
   body.append(h('details',{},h('summary',{},'Бюджет, время и источник — необязательно'),field('Бюджет, если известен',budget),field('Удобное время связи',time),field('Источник лида',origin),field('Комментарий об источнике',originNote)));
  }
  if(step===2)body.append(h('div',{class:'handoff-review'},h('b',{},client.value),h('p',{},contact.value),h('p',{},summary.value||'Потребность предстоит уточнить'),[...chosen].map(d=>h('div',{},h('b',{},DIRECTIONS.find(x=>x.id===d).label),h('small',{},'Получатель: '+recipient(d)),h('p',{},details[d]?.value||'Подробности не обсуждали')))),h('label',{class:'handoff-consent'},consent,h('span',{},'Клиент согласен, чтобы с ним связался получатель заявки')),h('p',{class:'muted'},'Заявка сохранится один раз. Начисления рассчитываются после подтверждения сделки по действующим правилам.'));
 }
 return new Promise(resolve=>{
  dlg.addEventListener('close',()=>{dlg.remove();resolve(null);},{once:true});f.onsubmit=async e=>{e.preventDefault();error.textContent='';
   if(step===0){if(!chosen.size){error.textContent='Выберите хотя бы одно направление';return;}step++;draw();return;}
   if(step===1){if(!client.value.trim()||!contact.value.trim()){error.textContent='Укажите компанию и способ связи';return;}step++;draw();return;}
   next.disabled=true;try{
    if(ctx.me?.id!==actor||await cloud.userId()!==actor)throw Error('Аккаунт изменился. Откройте передачу заново');
    const p=normalizeHandoff({request_id,lead_id:!partnerCompany?lead?.id:null,partner_company_id:partnerCompany?lead?.id:null,client_name:client.value,client_contact:contact.value,contact_name:person.value,summary:summary.value,budget:budget.value,contact_time:time.value,lead_origin:origin.value,origin_note:originNote.value,consent:consent.checked,directions:[...chosen],details:Object.fromEntries([...chosen].map(d=>[d,{note:details[d]?.value||''}]))});
    const result=await cloud.rpc('handoff_create',{p});if(ctx.me?.id!==actor)return;emit();toast('Клиент передан. Состояние — в «Передачах клиентов».');await onSaved?.(result);resolve(result);dlg.close();
   }catch(e){error.textContent=e.message;}finally{next.disabled=false;}
  };draw();dlg.showModal();
 });
}
export async function renderHandoffs(root,{mobile=false,partner=false,onOpenCompany,receive}={}){
 const me=ctx.me,actor=me.id;let scope='mine',offset=0,request=0;const body=h('div',{class:'handoff-list'}),tabs=h('div',{class:'segmented'}),next=button('Показать ещё',()=>{offset+=40;draw(true);},'btn');
 function nav(){put(tabs,...[['mine','Мои передачи'],['inbox','Входящие']].map(([id,title])=>h('button',{class:scope===id?'active':'','aria-pressed':String(scope===id),onclick:()=>{scope=id;offset=0;nav();draw();}},title)));}
 async function draw(append=false){const stamp=++request;next.disabled=true;try{const rows=await cloud.rpc('handoff_list',{p_scope:scope,p_offset:offset});if(ctx.me?.id!==actor||stamp!==request)return;const nodes=(rows||[]).map(row=>handoffCard(row,{mobile,partner,onOpenCompany,receive,refresh:()=>draw()}));if(append)body.append(...nodes);else put(body,nodes.length?nodes:h('p',{class:'muted'},scope==='mine'?'Передач пока нет. Откройте клиента и нажмите «Передать клиента».':'Входящих заявок пока нет.'));next.hidden=rows.length<40;}catch(e){if(stamp===request&&ctx.me?.id===actor)put(body,h('p',{class:'form-err'},e.message),button('Повторить',()=>draw(),'btn'));}finally{if(stamp===request)next.disabled=false;}}
 put(root,h('div',{class:'heading'},h('div',{},h('p',{class:'eyebrow'},'Работа с клиентами'),h('h1',{},'Передачи клиентов'),h('p',{},'Каждое направление имеет своего получателя и состояние.'))),tabs,body,next);nav();await draw();
}
function handoffCard(row,{partner,refresh,onOpenCompany,receive}){
 const me=ctx.me;return h('article',{class:'card handoff-card'},h('h3',{},row.client_name),h('p',{},row.client_contact),h('p',{class:'muted'},fmt(row.created_at)),row.summary?h('p',{},row.summary):null,
  row.items.map(item=>{
   const canDecide=partner?item.direction==='merch'&&item.recipient_id===me.id:me.role==='admin'||me.role==='leader';
   const act=async status=>{let note='';if(['clarify','rejected'].includes(status)){const r=await form({title:status==='clarify'?'Что нужно уточнить?':'Причина отказа',fields:[{name:'note',label:'Пояснение сотруднику',type:'textarea',required:true}]});if(!r)return;note=r.note;}if(ctx.me?.id!==me.id)throw Error('Аккаунт изменился');if(partner&&status==='accepted'&&receive)await receive(row,item);else await cloud.rpc('handoff_decide',{p_item:item.id,p_revision:item.revision,p_status:status,p_note:note});if(ctx.me?.id!==me.id)return;toast('Состояние сохранено');await refresh();};
   return h('section',{class:'handoff-item'},h('div',{class:'row'},h('b',{},DIRECTIONS.find(d=>d.id===item.direction)?.label||item.direction),h('span',{class:'tag'},HANDOFF_STATUS[item.status]||item.status)),h('small',{class:'muted'},item.direction==='merch'?(item.recipient_id?'Получатель: партнёр по мерчу':'Получатель подключается — заявка сохранена'):'Получатель: команда Neelux'),item.details?.note?h('p',{},item.details.note):null,item.comment?h('p',{},'Пояснение: '+item.comment):null,item.deal_status==='accepted'?h('p',{class:'muted'},'Сделка подтверждена по действующим правилам начислений'):null,
    canDecide&&item.status!=='done'?h('div',{class:'actions'},['new','clarify'].includes(item.status)?button('Принять в работу',()=>act('accepted'),'btn primary sm'):null,button('Уточнить',()=>act('clarify'),'btn sm'),item.status==='accepted'?button('Завершить',()=>act('done'),'btn sm'):null,button('Отказ',()=>act('rejected'),'btn ghost sm')):null);
  }));
}
