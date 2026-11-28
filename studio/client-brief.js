import * as cloud from './shared--cloud.js';
import {h,put,button,fmt,ctx} from './shared--ui.js';
import {createBriefQueue,briefFingerprint} from './shared--brief-queue.js';
import {guard} from './data.js';
import {activeLead} from './client-model.js';
// Private briefs live only in memory. Neither AI replies nor CRM facts are
// written to LocalStorage, IndexedDB, CacheStorage, or an offline write queue.
let scope='',owner=null,enabled=true,activeNodes=[];const meta=new WeakMap();
const queue=createBriefQueue({load:async()=>null,save:async()=>{},gapMs:16000,
 run:async(lead,signal)=>{const me=owner;await guard(me);return cloud.ai('AI_AUDIT',{leadId:lead.id,allowReserve:true},{myName:me.display_name?.split(' ')[0]},{expectedUser:me.id,signal});},
 onChange:(id,state)=>{for(const node of activeNodes){const item=meta.get(node);if(node.isConnected&&item?.lead.id===id&&(!state.fingerprint||state.fingerprint===briefFingerprint(item.lead)))paint(node,state);}}
});
export function bindBriefs(me){
 const next=NEELUX_MOBILE_CONFIG.url+'|'+me.id;if(scope!==next){scope=next;owner=me;queue.reset(scope);activeNodes=[];try{enabled=localStorage.getItem('neelux-mobile-auto-brief:'+scope)!=='off';}catch{enabled=true;}}
}
export function clearBriefs(){scope='';owner=null;activeNodes=[];queue.reset();}
window.addEventListener('neelux:account-reset',clearBriefs);
export function activateBriefs(root){
 activeNodes=[...root.querySelectorAll('[data-mobile-brief]')];if(!enabled||document.hidden||!owner)return;
 let count=0;for(const node of activeNodes){const {lead,compact}=meta.get(node);if(lead.owner_id!==owner.id||compact&&!activeLead(lead))continue;if(compact&&count++>=4)continue;queue.enqueue(lead,{priority:!compact});}
}
export function briefToggle(){
 const input=h('input',{type:'checkbox','aria-label':'Автоматический разбор клиентов'});input.checked=enabled;
 input.onchange=()=>{enabled=input.checked;try{localStorage.setItem('neelux-mobile-auto-brief:'+scope,enabled?'on':'off');}catch{}queue.reset(scope);for(const node of activeNodes)if(node.isConnected)paint(node,{});if(enabled)activateBriefs(document.getElementById('content'));};
 return h('label',{class:'m-brief-toggle'},input,h('span',{},h('strong',{},'Авторазбор Neelux AI'),h('small',{},'Первые 4 клиента · по очереди')));
}
function request(node,force=false){const {lead}=meta.get(node);return queue.enqueue(lead,{force,priority:true});}
function paint(node,state){
 const {lead,compact,onWrite}=meta.get(node),d=state.data;
 if(!d){const busy=['loading','queued'].includes(state.state);put(node,h('div',{class:'m-brief-title'},h('b',{},'Neelux AI'),h('span',{class:'m-chip'},state.state==='loading'?'Изучаю клиента':state.state==='queued'?'В очереди':state.error?'Повторить позже':'Подсказка для разговора')),
  h('p',{class:'m-subtle'},state.state==='loading'?(lead.website?'Читаю главную сайта и подбираю подход.':'Подбираю подход по данным карточки.'):state.state==='queued'?'Разбор начнётся после предыдущего клиента.':state.error?'Не удалось получить разбор. Данные клиента сохранены.':compact?'Что предложить и с чего начать разговор.':'Подскажет приоритетную услугу, аргумент и вопрос клиенту. Если сайт указан, проверит HTML его главной.'),
  busy?h('div',{class:'m-brief-progress',role:'progressbar','aria-label':'Подготовка разбора'}):button(state.error?'Повторить разбор':'Разобрать клиента',()=>request(node,!!state.error),'btn m-brief-action'),!compact&&onWrite?button('Написать без разбора',()=>onWrite(null),'btn ghost m-primary-block'):null);
  return;
 }
 put(node,h('div',{class:'m-brief-title'},h('b',{},'Neelux AI'),h('span',{class:'m-chip'},d.mode==='fallback'?'Резервная подсказка':'Идея для разговора')),
  h(compact?'h3':'h2',{},d.service||'Уточнить задачу бизнеса'),h('p',{},d.angle||d.summary),
  compact?h('small',{class:'m-subtle'},d.siteChecked?'Главная сайта проверена':'По данным карточки'):h('div',{},
   d.notice?h('p',{class:'m-ai-notice'},d.notice):null,
   h('div',{class:'m-brief-question'},h('small',{},'Спросите клиента'),h('p',{},d.question||'Какая задача сейчас важнее для вашего бизнеса?')),
   h('details',{class:'m-site-evidence'},h('summary',{},d.siteChecked?'Результаты проверки сайта':'Почему сайт не проверен'),
    d.siteChecked?[h('p',{class:'m-subtle'},`${fmt(d.site.checkedAt)} · HTTP ${d.site.status}`),h('p',{},d.site.title||'Заголовок title не найден'),
     ...(d.site.findings||[]).map(f=>h('div',{class:'m-site-finding'},h('strong',{},f.title),h('p',{},f.detail))),
     !(d.site.findings||[]).length?h('p',{},'В этой проверке явных замечаний не найдено. Это не полный аудит.'):null,h('p',{class:'m-subtle'},d.site.scope)]:h('p',{class:'m-subtle'},d.site?.reason||'Сайт ещё не проверен.')),
   d.problems?.length?h('details',{},h('summary',{},'Гипотезы — уточнить с клиентом'),d.problems.map(p=>h('div',{class:'m-site-finding'},h('strong',{},p.title),h('p',{},p.fix||p.why)))):null,
   h('div',{class:'m-brief-actions'},onWrite?button('Подготовить сообщение',()=>onWrite(d),'btn primary'):null,button('Обновить разбор',()=>request(node,true),'btn ghost')),
   h('p',{class:'m-subtle'},'Рекомендации ИИ проверяйте с клиентом. Разбор не отправляет сообщения.')));
}
export function mobileBrief(lead,{compact=false,onWrite}={}){
 const node=h('section',{class:'m-client-brief'+(compact?' compact':''),'data-mobile-brief':lead.id,'aria-label':'Разбор Neelux AI'});meta.set(node,{lead,compact,onWrite});paint(node,queue.peek(lead)||{});return node;
}
