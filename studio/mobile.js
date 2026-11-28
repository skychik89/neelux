import * as cloud from './shared--cloud.js';
import * as data from './data.js';
import {h,put,button,form,confirmBox,toast,ctx,fmt,link} from './shared--ui.js';
import {STAGES,money,phoneKey} from './shared--core.js';
import {factsOf,finalize,studioOf} from './shared--adapt.js';
import {approvedCases} from './shared--knowledge-core.js';
import {CASES,SECTORS} from './shared--case-catalog.js';
import {detectChannel,formatMessage} from './shared--message-format.js';
import {mobileBrief,activateBriefs,bindBriefs,briefToggle} from './client-brief.js';
import {CLIENT_VIEWS,dueLead} from './client-model.js';

const $=id=>document.getElementById(id),root=$('content');
let epoch=0,routeSeq=0,team=null,installPrompt=null,registration=null,aiLead=null,searchTimer=null,updating=false;
let dirtyCheck=()=>false,currentHash='#today',navigationPrompt=null,activeWriter=null,writerDraft=null;
const clientListState={term:'',stage:'',view:'all',sort:'recent'};
const names={today:'Сегодня',clients:'Клиенты',tasks:'Задачи',ai:'Neelux AI',more:'Ещё',balance:'Баланс',cases:'Кейсы',templates:'Шаблоны',feedback:'Обратная связь',settings:'Оформление',help:'Установка и помощь'};
const iconName={today:'home',clients:'users',tasks:'task',ai:'spark',more:'sliders'};
const ico=n=>{const e=document.createElementNS('http://www.w3.org/2000/svg','svg');e.setAttribute('class','ic');e.setAttribute('aria-hidden','true');const u=document.createElementNS('http://www.w3.org/2000/svg','use');u.setAttribute('href','#i-'+n);e.append(u);return e;};
const stack=(...children)=>h('div',{class:'m-stack'},children);
const card=(...children)=>h('article',{class:'card'},children);
const intro=(title,text,eyebrow='Neelux Studio')=>h('header',{class:'m-intro'},h('p',{class:'eyebrow'},eyebrow),h('h1',{},title),text?h('p',{},text):null);
const label=(text,input)=>h('label',{class:'m-label'},text,input);
const note=text=>h('p',{class:'m-subtle'},text);
const empty=text=>h('p',{class:'m-empty'},text);
const row=(...children)=>h('div',{class:'m-row'},children);
const dateLocal=value=>{if(!value)return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
const live=(e,id)=>epoch===e&&ctx.me?.id===id;
function go(route){location.hash=route;}
async function discardChanges(){if(!dirtyCheck())return true;if(!navigationPrompt)navigationPrompt=confirmBox('Уйти без сохранения?','В карточке есть изменения. Вернитесь и нажмите «Сохранить изменения», чтобы они остались в базе.','Уйти без сохранения').finally(()=>{navigationPrompt=null;});return navigationPrompt;}
function cardLink(title,subtitle,route,icon='chev'){return button('',()=>go(route),'card m-card-link').appendChild(h('div',{},row(h('div',{},h('strong',{},title),h('small',{},subtitle)),ico(icon)))).parentNode;}
function renderNav(route){put($('mobile-nav'),...['today','clients','tasks','ai','more'].map(id=>{const b=button(names[id],()=>go(id),'');b.prepend(ico(iconName[id]));b.setAttribute('aria-current',id===route||id==='more'&&!['today','clients','tasks','ai'].includes(route)?'page':'false');return b;}));$('mobile-nav').hidden=!ctx.me;}
function reset(){epoch++;routeSeq++;clearTimeout(searchTimer);activeWriter?.abort();activeWriter=null;writerDraft=null;dirtyCheck=()=>false;currentHash='#today';Object.assign(clientListState,{term:'',stage:'',view:'all',sort:'recent'});aiLead=null;ctx.me=null;ctx.team=null;team=null;for(const dlg of document.querySelectorAll('dialog')){dlg.close();dlg.remove();}put(root);$('mobile-nav').hidden=true;$('account-label').textContent='Для вашей команды';window.dispatchEvent(new Event('neelux:account-reset'));}
async function login(){reset();await window.NeeluxAppearance.reset();const user=h('input',{name:'username',autocomplete:'username',autocapitalize:'none',spellcheck:'false',required:true,placeholder:'Ваш логин Studio'}),pass=h('input',{name:'password',type:'password',autocomplete:'current-password',required:true}),err=h('p',{class:'m-error',role:'alert'}),show=h('button',{class:'btn ghost',type:'button','aria-label':'Показать пароль'},'Показать');show.onclick=()=>{pass.type=pass.type==='password'?'text':'password';show.textContent=pass.type==='password'?'Показать':'Скрыть';show.setAttribute('aria-label',pass.type==='password'?'Показать пароль':'Скрыть пароль');};
 const submit=h('button',{class:'btn primary m-primary-block',type:'submit'},'Войти в Studio');
 const f=h('form',{},h('img',{class:'m-logo',src:'icons--icon192.png',alt:''}),h('h1',{},'Ваша Studio.\nТеперь с телефона.'),note('Войдите с тем же логином и паролем, что и на компьютере.'),label('Логин',user),label('Пароль',pass),show,err,submit);
 f.onsubmit=async e=>{e.preventDefault();submit.disabled=true;err.textContent='';try{if(!navigator.onLine)throw Error('Для входа нужен интернет');await cloud.signIn(user.value.trim(),pass.value);pass.value='';history.replaceState(null,'',location.pathname+location.search+'#today');await boot();}catch(x){err.textContent=x.message;}finally{submit.disabled=false;}};
 put(root,h('div',{class:'m-login card'},f,h('p',{class:'m-privacy'},'Клиенты, задачи и баланс остаются в действующей базе Neelux. Не передавайте свой пароль коллегам.'),button('Как установить на телефон',()=>help(root,false),'btn ghost m-install')));
}
async function boot(){const stamp=++epoch;put(root,card(h('h1',{},'Открываю Studio…'),note('Проверяю вход.')));try{const me=await cloud.myProfile();if(stamp!==epoch)return;if(!me)return login();ctx.me=me;
 if(me.status!=='active'){put(root,card(h('h1',{},'Доступ пока ограничен'),note('Обратитесь к руководителю. Ваши данные сохранены.'),button('Выйти',logout)));return;}
 team=await cloud.teamSettings();if(stamp!==epoch)return;ctx.team=team;bindBriefs(me);await window.NeeluxAppearance.bind(me.id);$('account-label').textContent=me.display_name||me.username;renderNav('today');await route();
 }catch(e){if(stamp!==epoch)return;if(e.code==='auth')return login();put(root,card(h('h1',{},'Не удалось подключиться'),h('p',{class:'m-error'},e.message),note('Вход сохранён. Данные не удалялись.'),button('Повторить',boot,'btn primary'),button('Выйти из этого аккаунта',logout,'btn ghost')));}}
async function logout(){if(!await confirmBox('Выйти из Studio?','Данные в базе останутся. Несохранённые изменения и черновик AI на телефоне будут закрыты. Для повторного входа понадобятся логин и пароль.','Выйти'))return;reset();await cloud.signOut();await login();}
async function route({force=false}={}){if(!ctx.me)return;const target=location.hash||'#today';if(dirtyCheck()&&(force||target!==currentHash)){if(!await discardChanges()){history.replaceState(null,'',currentHash);return;}}activeWriter?.abort();activeWriter=null;dirtyCheck=()=>false;const me=ctx.me,stamp=epoch,seq=++routeSeq;const raw=location.hash.slice(1)||'today',[name,id]=raw.split('/');const routeName=Object.hasOwn(names,name)?name:'today';renderNav(routeName);root.classList.remove('m-enter');root.setAttribute('aria-busy','true');put(root,h('div',{class:'m-skeleton','aria-label':'Загрузка'}),note('Обновляю данные…'));const page=h('div',{});
 try{if(routeName==='clients'&&id)await client(page,me,id);else await ({today,clients,tasks,ai,more,balance,cases,templates,feedback,settings,help})[routeName](page,me);if(!live(stamp,me.id)||seq!==routeSeq)return;if(!['today','clients','tasks','ai','more'].includes(routeName))page.prepend(button('Назад в меню',()=>go('more'),'btn ghost m-back'));put(root,...page.childNodes);currentHash=location.hash||'#today';dirtyCheck=page._dirtyCheck||(()=>false);activateBriefs(root);root.classList.add('m-enter');window.scrollTo({top:0,behavior:'instant'});root.focus({preventScroll:true});document.title=`${names[routeName]} · Neelux Studio`;}catch(e){if(!live(stamp,me.id)||seq!==routeSeq)return;if(e.code==='auth')return login();put(root,intro(names[routeName]),card(h('h2',{},'Не удалось открыть раздел'),h('p',{class:'m-error'},e.message),note('Данные сохранены. Проверьте интернет и попробуйте ещё раз.'),button('Повторить',route,'btn primary'),button('На сегодня',()=>go('today'),'btn ghost')));}finally{if(seq===routeSeq)root.removeAttribute('aria-busy');}}
async function today(page,me){
 const [stats,taskRows,reminders]=await data.overview(me);
 put(page,intro(`Здравствуйте, ${(me.display_name||me.username).split(' ')[0]}`,'Всё важное для рабочего дня — на одном экране.',new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'long'})),stack(
  card(h('h2',{},'С чего начать'),note('Выберите следующий шаг. Изменения сразу будут видны и на компьютере.'),
   cardLink('Связаться с клиентами',reminders.length?`Есть напоминания: ${reminders.length}. Откройте карточку и продолжите разговор.`:'Откройте базу: Neelux AI подскажет, что предложить.','clients','users'),
   cardLink('Проверить задачи',taskRows.length?`Активных в подборке: ${taskRows.length}`:'Новых поручений нет. Можно добавить свою задачу.','tasks','task'),
   cardLink('Подготовить сообщение','Выберите клиента, задачу и получите текст для проверки.','ai','spark')),
  team?.announcement?card(h('p',{class:'eyebrow'},'От команды'),h('p',{class:'m-notes'},team.announcement)):null,
  h('div',{class:'m-section-title'},h('h2',{},'Пора связаться'),button('Все клиенты',()=>{clientListState.view='due';go('clients');},'btn ghost')),
  reminders.length?stack(reminders.slice(0,3).map(l=>leadCard(l,{brief:false}))):card(note('Просроченных напоминаний нет. Следующую дату можно поставить в карточке клиента.')),
  h('div',{class:'m-section-title'},h('h2',{},'Мои задачи'),button('Все задачи',()=>go('tasks'),'btn ghost')),
  taskRows.length?stack(taskRows.slice(0,3).map(t=>taskCard(t,me))):card(note('Активных задач нет.')),
  h('div',{class:'m-grid'},h('article',{class:'card m-stat'},h('small',{},'Доступно к выводу'),h('b',{},money(data.balanceOf(stats))),h('small',{},'Ваш реальный баланс')),h('article',{class:'card m-stat'},h('small',{},'За месяц'),h('b',{},money(stats.earned_month)),h('small',{},'Начисления Studio'))),
  cardLink('Баланс и выплаты','Посмотреть начисления и запросы выплат','balance','wallet')));
}
function leadCard(l,{brief=true}={}){
 const open=button('',()=>go('clients/'+l.id),'m-lead-open');open.append(row(h('div',{},h('strong',{},l.name),h('small',{},[l.niche,l.city].filter(Boolean).join(' · '))),ico('chev')),
  h('div',{class:'m-lead-badges'},h('span',{class:'m-chip'},STAGES[l.stage]||'Новый'),h('span',{class:'m-chip'},l.website?'Есть сайт':'Сайт не указан'),l.rating!=null?h('span',{class:'m-chip'},'Рейтинг '+l.rating):null),
  l.remind_at?h('p',{class:'m-reminder'+(dueLead(l)?' overdue':'')},`${dueLead(l)?'Пора связаться':'Напоминание'} · ${fmt(l.remind_at)}`):null);
 return h('article',{class:'card m-client-card'},open,brief?mobileBrief(l,{compact:true}):null);
}
async function clients(page,me){
 let offset=0,request=0,rows=[];const stamp=epoch;
 const search=h('input',{type:'search',value:clientListState.term,placeholder:'Название, город, ниша или телефон','aria-label':'Поиск клиентов',autocomplete:'off'});
 const stage=h('select',{'aria-label':'Этап клиента'},h('option',{value:''},'Все этапы'),...Object.entries(STAGES).map(([value,name])=>h('option',{value},name)));stage.value=clientListState.stage;
 const sort=h('select',{'aria-label':'Порядок клиентов'},h('option',{value:'recent'},'Недавно обновлённые'),h('option',{value:'reminder'},'Сначала напоминания'));sort.value=clientListState.sort;
 const list=stack(),tabs=h('div',{class:'m-client-tabs','aria-label':'Быстрые фильтры'}),status=h('p',{class:'m-subtle',role:'status'}),next=button('Показать ещё 40 клиентов',()=>load(true),'btn m-primary-block');
 function drawTabs(){put(tabs,...CLIENT_VIEWS.map(([value,title])=>h('button',{class:'btn'+(clientListState.view===value?' active':''),'aria-pressed':String(clientListState.view===value),onclick:()=>{clientListState.view=value;drawTabs();load();}},title)));}
 async function load(append=false){
  const run=++request;next.disabled=true;status.textContent='Ищу клиентов…';list.setAttribute('aria-busy','true');
  try{
   const found=await data.queryClients(me,{...clientListState,offset:append?offset:0});if(!live(stamp,me.id)||run!==request)return;
   rows=append?[...rows,...found]:found;offset=rows.length;
   put(list,...(rows.length?rows.map(l=>leadCard(l)):[card(h('h2',{},'Ничего не найдено'),note(clientListState.view==='due'?'В этой подборке нет просроченных напоминаний.':'Попробуйте другую сферу, телефон или фильтр.'),button('Сбросить поиск и фильтры',()=>{Object.assign(clientListState,{term:'',stage:'',view:'all',sort:'recent'});search.value='';stage.value='';sort.value='recent';drawTabs();load();},'btn'))]));
   next.hidden=found.length<40;status.textContent=`В подборке показано: ${rows.length}`;if(list.isConnected)activateBriefs(root);
  }catch(e){if(run===request&&live(stamp,me.id)){status.textContent='Не удалось обновить список. '+e.message;if(!rows.length)put(list,card(button('Повторить поиск',()=>load(),'btn primary')));}}
  finally{if(run===request){next.disabled=false;list.removeAttribute('aria-busy');}}
 }
 search.oninput=()=>{clientListState.term=search.value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>load(),250);};stage.onchange=()=>{clientListState.stage=stage.value;load();};sort.onchange=()=>{clientListState.sort=sort.value;load();};
 const add=async()=>{const result=await form({title:'Новый клиент',text:'Клиент закрепится за вами. База проверит совпадения.',submit:'Добавить в мою базу',fields:[{name:'name',label:'Название',required:true},{name:'phone',label:'Телефон',type:'tel'},{name:'city',label:'Город'},{name:'niche',label:'Ниша'}],onSubmit:v=>data.addLead(me,v)});if(result&&live(stamp,me.id)){toast(result.reason||'Карточка обработана');await load();}};
 drawTabs();put(page,intro('Мои клиенты','Нажмите на клиента: контакты, разбор Neelux AI и следующий шаг — внутри.'),stack(
  h('div',{class:'m-filter'},label('Найти клиента',search),tabs,h('details',{},h('summary',{},'Этап и порядок'),label('Этап клиента',stage),label('Порядок клиентов',sort))),
  briefToggle(),button('Добавить клиента',add,'btn primary'),status,list,next));await load();
}
async function client(page,me,id){
 const stamp=epoch,l=await data.getLead(me,id);if(!live(stamp,me.id))return;
 const stage=h('select',{},...Object.entries(STAGES).map(([value,name])=>h('option',{value},name)));stage.value=l.stage;
 const notes=h('textarea',{rows:5,value:l.notes||'',placeholder:'Что обсудили, что важно клиенту, какой следующий шаг…'}),reminder=h('input',{type:'datetime-local',value:dateLocal(l.remind_at)}),saveState=h('p',{class:'m-subtle',role:'status'});
 const values=()=>JSON.stringify([stage.value,notes.value,reminder.value]);let baseline=values();page._dirtyCheck=()=>values()!==baseline;
 const changed=()=>{saveState.textContent=page._dirtyCheck()?'Есть несохранённые изменения':'Все изменения сохранены';saveState.classList.toggle('m-unsaved',page._dirtyCheck());};for(const input of [stage,notes,reminder]){input.addEventListener('input',changed);input.addEventListener('change',changed);}
 const save=async()=>{await data.saveLead(me,l,{stage:stage.value,notes:notes.value,remind_at:reminder.value});if(!live(stamp,me.id))return;baseline=values();dirtyCheck=()=>false;toast('Изменения сохранены');await route();};
 const contacts=h('div',{class:'m-contact-grid'});for(const p of (l.phones||[]).slice(0,2)){const k=phoneKey(p);if(k)contacts.append(h('a',{class:'btn',href:'tel:+'+k},ico('phone'),'Позвонить'),h('a',{class:'btn',href:'https://wa.me/'+k,target:'_blank',rel:'noopener noreferrer'},'WhatsApp'));}
 for(const url of (l.socials||[]).slice(0,5)){const a=link(url,/t\.me/.test(url)?'Telegram':/vk\./.test(url)?'ВКонтакте':'Другой контакт');a.classList.add('btn');contacts.append(a);}
 if(l.website){const a=link(l.website,'Открыть сайт');a.classList.add('btn');contacts.append(a);}
 const write=brief=>{aiLead={...l,_brief:brief?{service:brief.service,angle:brief.angle,question:brief.question}:null};go('ai');};
 const quick=h('div',{class:'m-reminder-quick'},[[1,'Завтра'],[3,'Через 3 дня'],[0,'Убрать']].map(([days,title])=>button(title,()=>{if(!days)reminder.value='';else{const d=new Date();d.setDate(d.getDate()+days);d.setHours(10,0,0,0);reminder.value=dateLocal(d);}changed();},'btn ghost')));
 const history=stack(),trail=h('details',{},h('summary',{},'История действий'),history);let loaded=false;trail.ontoggle=async()=>{if(!trail.open||loaded)return;put(history,note('Загружаю историю…'));try{const rows=await cloud.select('activity',`user_id=eq.${data.uuid(me.id)}&meta->>lead=eq.${data.uuid(id)}&select=kind,meta,created_at&order=created_at.desc&limit=40`);if(!live(stamp,me.id))return;put(history,...(rows.length?rows.map(r=>h('div',{},h('b',{},({touch:'Контакт с клиентом',lead_update:'Карточка обновлена',stage:'Этап изменён',deal:'Клиент передан'}[r.kind]||'Действие')),note(fmt(r.created_at)))):[note('Записей пока нет.')]));loaded=true;}catch(e){put(history,note(e.message));}};
 put(page,button('Назад к клиентам',()=>go('clients'),'btn ghost m-back'),intro(l.name,[l.niche,l.city].filter(Boolean).join(' · ')),stack(
  card(h('p',{class:'eyebrow'},'1 · Связаться'),contacts.childNodes.length?contacts:note('Контакты пока не указаны.'),l.address?note(l.address):null),
  card(h('p',{class:'eyebrow'},'2 · Понять задачу'),mobileBrief(l,{onWrite:write})),
  card(h('p',{class:'eyebrow'},'3 · Зафиксировать следующий шаг'),h('div',{class:'m-detail'},label('Этап',stage),label('Заметки и договорённости',notes),label('Напомнить',reminder),quick,note('Выберите дату и нажмите «Сохранить изменения». Напоминание появится на экране «Сегодня».'),h('div',{class:'m-save-area'},saveState,button('Сохранить изменения',save,'btn primary m-primary-block')))),card(trail)));
}

function taskCard(t,me){const overdue=t.status==='open'&&t.due_at&&new Date(t.due_at)<Date.now();return card(h('strong',{},t.title),t.body?h('p',{class:'m-notes'},t.body):null,h('p',{class:'m-task-status'+(overdue?' overdue':'')},t.due_at?`${overdue?'Просрочено · ':''}${fmt(t.due_at)}`:'Без срока'),h('div',{class:'m-task-actions'},button(t.status==='open'?'Выполнить задачу':'Вернуть в работу',async()=>{if(!await confirmBox(t.status==='open'?'Задача выполнена?':'Вернуть задачу?',t.title,t.status==='open'?'Да, выполнена':'Вернуть'))return;await data.taskStatus(me,t);toast('Статус сохранён');await route();},'btn'+(t.status==='open'?' primary':''))));}
async function tasks(page,me){
 let status='open',sequence=0;const stamp=epoch,body=stack(),tabs=h('div',{class:'m-task-tabs','aria-label':'Какие задачи показать'});
 function drawTabs(){put(tabs,...[['open','Активные'],['done','Выполненные']].map(([value,title])=>h('button',{class:'btn','aria-pressed':String(status===value),onclick:()=>{status=value;drawTabs();draw();}},title)));}
 async function draw(){const n=++sequence;put(body,note('Обновляю задачи…'));try{const rows=await data.taskList(me,status);if(!live(stamp,me.id)||n!==sequence)return;put(body,...(rows.length?rows.map(t=>taskCard(t,me)):[card(h('h2',{},status==='open'?'Всё выполнено':'Здесь будут завершённые задачи'),note(status==='open'?'Новых поручений нет. Можно добавить своё дело кнопкой выше.':'После выполнения задача переместится сюда.'))]));}catch(e){if(live(stamp,me.id)&&n===sequence)put(body,card(note(e.message),button('Повторить загрузку',draw,'btn')));}}
 drawTabs();put(page,intro('Мои задачи','Откройте поручение, выполните его и подтвердите готовность.'),stack(tabs,button('Добавить свою задачу',async()=>{const r=await form({title:'Своя задача',text:'Задача будет доступна вам и на компьютере.',submit:'Сохранить задачу',fields:[{name:'title',label:'Что сделать',required:true},{name:'body',label:'Подробности',type:'textarea'},{name:'due',label:'Срок',type:'datetime-local'}],onSubmit:v=>data.createTask(me,v)});if(r&&live(stamp,me.id)){toast('Задача создана');status='open';drawTabs();await draw();}},'btn primary'),body));await draw();
}

async function balance(page,me){
 const [stats,earnings,payouts]=await data.moneyData(me),available=data.balanceOf(stats);
 const request=button('Запросить выплату',async()=>{
  const r=await form({title:'Запрос выплаты',text:`Доступно ${money(available)}. Минимум ${money(team?.min_payout||500)}.`,submit:'Отправить запрос',fields:[{name:'amount',label:'Сумма, ₽',type:'number',min:team?.min_payout||500,value:Math.floor(available),required:true},{name:'details',label:'Телефон СБП или карта и банк',required:true}],onSubmit:v=>data.requestPayout(me,team||{},v)});
  if(r){toast('Запрос сохранён');await route();}
 },'btn primary');
 request.disabled=available<(team?.min_payout||500);request.title=request.disabled?'Для запроса нужно накопить минимальную сумму':'';
 const kind={deal:'За сделку',payout:'Выплата',adjust:'Корректировка',bonus:'Бонус',prize:'Премия',leader:'Команда',referral:'За приглашение',reversal:'Отмена'};
 const earned=earnings.map(e=>h('article',{},row(h('div',{},h('b',{},e.note||kind[e.kind]||'Начисление'),h('small',{class:'m-date'},fmt(e.created_at))),h('strong',{class:Number(e.amount)>0?'m-positive':'m-negative'},money(e.amount)))));
 const paid=payouts.map(p=>h('article',{},row(h('strong',{},money(p.amount)),h('span',{class:'m-chip'},({pending:'Ожидает',paid:'Выплачено',rejected:'Отклонено'}[p.status]||p.status))),note(fmt(p.created_at)),p.admin_comment?h('p',{},p.admin_comment):null));
 put(page,intro('Мой баланс','Начисления и выплаты из действующей Studio.'),stack(
  h('article',{class:'card m-stat m-money'},h('small',{},'Доступно к выводу'),h('b',{},money(available)),note(`В обработке: ${money(stats.pending_payout)} · За месяц: ${money(stats.earned_month)}`)),request,note(request.disabled?`Запрос станет доступен от ${money(team?.min_payout||500)}. Уже ожидающие суммы учитываются отдельно.`:'После отправки руководитель увидит ваш запрос. Его состояние появится ниже.'),
  card(h('h2',{},'Последние начисления'),earned.length?h('div',{class:'m-list'},earned):empty('Начислений пока нет.')),
  card(h('h2',{},'Запросы выплат'),paid.length?h('div',{class:'m-list'},paid):empty('Запросов пока нет.'))
 ));
}
async function ai(page,me){
 const chosen=aiLead;aiLead=null;
 if(chosen)writerDraft={source:chosen,task:'first',channel:'Авто',name:chosen.name,niche:chosen.niche,context:chosen._brief?'Идеи предыдущего разбора — гипотезы для уточнения, не подтверждённые потребности: '+JSON.stringify(chosen._brief):'',outputs:[]};
 if(!writerDraft)writerDraft={source:null,task:'first',channel:'Авто',name:'',niche:'',context:'',outputs:[]};
 const draft=writerDraft,stamp=epoch;let source=draft.source;
 const task=h('select',{},...[['first','Первое сообщение'],['reply','Ответ клиенту'],['offer','Предложение услуги'],['call','Скрипт звонка'],['custom','Свой запрос']].map(([v,l])=>h('option',{value:v},l)));task.value=draft.task;
 const channel=h('select',{},...[['Авто','Определить по клиенту'],['tg','Telegram'],['wa','WhatsApp'],['vk','ВКонтакте'],['plain','Без форматирования']].map(([v,l])=>h('option',{value:v},l)));channel.value=draft.channel;
 const name=h('input',{value:draft.name,placeholder:'Например: барбершоп «…»'}),niche=h('input',{value:draft.niche}),context=h('textarea',{rows:5,value:draft.context,placeholder:'Вставьте сообщение клиента. Что нужно ответить или предложить?'});
 name.readOnly=niche.readOnly=!!source;
 const results=stack(),status=h('p',{class:'m-ai-notice',role:'status'}),selectedNote=note(source?'Используются данные выбранного клиента из вашей базы.':'Выберите клиента из базы или введите название и нишу вручную.');
 const choice=h('select',{'aria-label':'Клиент из моей базы'},h('option',{value:''},'Ввести вручную'));if(source)choice.append(h('option',{value:source.id},source.name));choice.value=source?.id||'';
 let available=source?[source]:[];
 data.queryClients(me).then(rows=>{if(!live(stamp,me.id)||draft!==writerDraft)return;available=[...new Map([...available,...rows].map(l=>[l.id,l])).values()];const selected=choice.value;put(choice,h('option',{value:''},'Ввести вручную'),...available.map(l=>h('option',{value:l.id},l.name)));choice.value=selected;}).catch(()=>{selectedNote.textContent='Не удалось загрузить список клиентов. Можно ввести данные вручную или открыть AI из карточки.';});
 const remember=()=>{Object.assign(draft,{source,task:task.value,channel:channel.value,name:name.value,niche:niche.value,context:context.value});};for(const e of [task,channel,name,niche,context]){e.addEventListener('input',remember);e.addEventListener('change',remember);}
 choice.onchange=()=>{source=available.find(l=>l.id===choice.value)||null;name.value=source?.name||'';niche.value=source?.niche||'';name.readOnly=niche.readOnly=!!source;selectedNote.textContent=source?'Используются данные выбранного клиента из вашей базы.':'Укажите название, нишу и контекст вручную.';remember();};
 const showOutputs=()=>put(results,...draft.outputs.map((v,i)=>{const output=h('textarea',{class:'m-answer',value:v,'aria-label':`Вариант ${i+1}`});output.oninput=()=>{draft.outputs[i]=output.value;};return card(h('h2',{},`Вариант ${i+1}`),note('Можно отредактировать текст перед копированием.'),output,button('Копировать',async()=>{await navigator.clipboard.writeText(output.value);toast('Текст скопирован');},'btn primary m-primary-block'));}));showOutputs();
 const cancel=button('Остановить подготовку',()=>activeWriter?.abort(),'btn ghost m-primary-block');cancel.hidden=true;
 const generate=button('Подготовить текст',async()=>{
  remember();const controller=new AbortController();activeWriter=controller;status.textContent='Neelux AI готовит ответ…';cancel.hidden=false;for(const field of [choice,task,channel,name,niche,context])field.disabled=true;
  try{
   await data.guard(me);const lead=source||{name:name.value,niche:niche.value};if(!lead.name?.trim())throw Error('Выберите клиента или укажите название.');
   const facts=factsOf(lead),studio=studioOf(team),selected=detectChannel({selected:channel.value,lead});
   const r=await cloud.ai('AI_WRITE',{task:task.value==='call'?'custom':task.value,tone:'Дружелюбно',channel:selected,client:lead.name,niche:lead.niche,city:lead.city,facts,context:(task.value==='call'?'Подготовь разговорный скрипт звонка: начало, выяснение потребности, предложение и следующий шаг. ':'')+context.value,myName:me.display_name?.split(' ')[0],length:'Сбалансированно',caseMode:'Авто по нише',allowReserve:true,studio:{about:studio.about}},{},{expectedUser:me.id,signal:controller.signal});
   if(!live(stamp,me.id)||controller.signal.aborted||!root.querySelector('#m-ai-form'))return;
   const valid=finalize(r.variants,{facts,studio,task:task.value,extra:context.value+'\n'+JSON.stringify(r.strategy?.case||{})+'\n'+JSON.stringify(r.approvedFacts||[])});if(!valid.variants.length)throw Error('Ответ не прошёл проверку фактов. Повторите запрос.');
   status.textContent=r.notice||'Ответ готов. Проверьте факты и скопируйте подходящий вариант.';draft.outputs=valid.variants.map(v=>['vk','plain'].includes(selected)?formatMessage(v,selected).plain:v);showOutputs();
  }catch(e){if(!live(stamp,me.id))return;status.textContent=controller.signal.aborted?'Подготовка остановлена. Предыдущий текст сохранён.':String(e.message).startsWith('NEELUX AI')?e.message:'NEELUX AI: '+e.message;}
  finally{cancel.hidden=true;for(const field of [choice,task,channel,name,niche,context])field.disabled=false;if(activeWriter===controller)activeWriter=null;}
 },'btn primary m-primary-block','spark');
 put(page,intro('Neelux AI','1. Выберите клиента. 2. Укажите задачу. 3. Проверьте и скопируйте текст.'),stack(card(h('div',{id:'m-ai-form'},label('Клиент из моей базы',choice),selectedNote,label('Клиент',name),label('Ниша',niche),label('Что подготовить',task),label('Мессенджер',channel),label('Контекст и пожелания',context),generate,cancel,status)),results,
  card(note('AI ничего не отправляет клиенту сам. Черновик остаётся в памяти этого сеанса, пока вы не выйдете из аккаунта.'),button('Очистить черновик',async()=>{if(!await confirmBox('Очистить черновик?','Введённый контекст и подготовленные варианты будут убраны с этого телефона. База клиента не изменится.','Очистить'))return;writerDraft=null;await route();},'btn ghost'))));
}

async function cases(page){let items=CASES,warning='';try{items=approvedCases(await cloud.select('neelux_current_knowledge','select=*&limit=1000'));}catch{warning='Не удалось обновить каталог. Ниже сохранённые кейсы Studio.';}put(page,intro('Кейсы студии','Примеры работ по сферам.'),warning?note(warning):null,h('div',{class:'m-cases'},items.map(c=>card(c.image?h('img',{src:'shared--'+c.image.replaceAll('/','--'),alt:c.name,loading:'lazy',width:600,height:340}):null,h('p',{class:'eyebrow'},SECTORS[c.sector]||'Проект'),h('h2',{},c.name),h('p',{},c.summary),h('div',{class:'actions'},link(c.url,'Посмотреть сайт'),button('Скопировать кейс',async()=>{await navigator.clipboard.writeText(`Проект Neelux Studio — ${c.name}\n${c.summary}\n${c.url}`);toast('Кейс скопирован');},'btn'))))));}
async function templates(page){const list=await cloud.select('templates','select=id,title,body,category,niches&order=uses.desc,created_at.desc&limit=100');put(page,intro('Шаблоны','Общие и ваши личные тексты Studio.'),stack(...(list.length?list.map(t=>card(h('details',{},h('summary',{},t.title),note([t.category,t.niches].filter(Boolean).join(' · ')),h('p',{class:'m-notes'},t.body),button('Копировать текст',async()=>{await navigator.clipboard.writeText(t.body);toast('Шаблон скопирован');},'btn')))):[card(note('Шаблонов пока нет. Подготовьте текст в Neelux AI.'))])));}
async function feedback(page,me){const rows=await cloud.select('staff_warnings',`user_id=eq.${data.uuid(me.id)}&select=*&order=created_at.desc&limit=100`);put(page,intro('Обратная связь','Замечания, договорённости и ваши пояснения.'),stack(...(rows.length?rows.map(w=>card(row(h('h2',{},w.kind==='warning'?'Выговор':'Замечание'),h('span',{class:'m-chip'},({active:'В работе',closed:'Закрыто',revoked:'Отменено'}[w.status]||w.status))),h('p',{class:'m-notes'},w.reason),h('b',{},'Что исправить'),h('p',{class:'m-notes'},w.expected_action),w.due_at?note('Срок: '+fmt(w.due_at)):null,note(w.acknowledged_at?'Вы ознакомились '+fmt(w.acknowledged_at):'Вы ещё не подтвердили ознакомление'),h('div',{class:'actions'},!w.acknowledged_at?button('Я ознакомился',async()=>{await data.rpc(me,'staff_warning_respond',{p_id:w.id,p_action:'acknowledge',p_note:''});toast('Ознакомление сохранено');await route();},'btn'):null,w.status==='active'?button('Ответить / оспорить',async()=>{const r=await form({title:'Ваше пояснение',fields:[{name:'note',label:'Что хотите пояснить',type:'textarea',required:true}],onSubmit:v=>data.rpc(me,'staff_warning_respond',{p_id:w.id,p_action:'reply',p_note:v.note})});if(r){toast('Пояснение сохранено');await route();}},'btn primary'):null),feedbackHistory(w))):[card(note('Записей нет.'))])));}
function feedbackHistory(w){const box=stack(),details=h('details',{},h('summary',{},'История'),box);let loaded=false;details.ontoggle=async()=>{if(!details.open||loaded)return;try{const rows=await cloud.select('staff_warning_events',`warning_id=eq.${data.uuid(w.id)}&select=kind,note,created_at&order=created_at.asc,id.asc`);put(box,...rows.map(e=>h('div',{},h('b',{},({issued:'Создано',acknowledged:'Ознакомление',reply:'Пояснение',closed:'Закрыто',revoked:'Отменено'}[e.kind]||'Изменение')),note(fmt(e.created_at)),e.note?h('p',{class:'m-notes'},e.note):null)));loaded=true;}catch(e){put(box,note(e.message));}};return details;}
async function settings(page,me){const A=window.NeeluxAppearance,p=A.get(),choices=h('fieldset',{class:'m-theme-choices'},h('legend',{},'Цветовая тема'));for(const t of A.presets){const input=h('input',{type:'radio',name:'appearance',value:t.id});input.checked=t.id===p.theme;input.onchange=async()=>{try{await A.set({theme:t.id});toast('Тема сохранена для вашего аккаунта на телефоне');}catch(e){toast(e.message);}};choices.append(h('label',{},input,t.name));}
 const check=(text,field,initial,make)=>{const input=h('input',{type:'checkbox'});input.checked=initial;input.onchange=async()=>{try{await A.set(make(input.checked));}catch(e){toast(e.message);}};return h('label',{class:'m-check'},input,text);};put(page,intro('Оформление','Те же четыре темы, что и на компьютере.'),card(choices,check('Уменьшить анимации','motion',p.motion==='reduced',v=>({motion:v?'reduced':'auto'})),check('Уменьшить прозрачность','solid',p.solid,v=>({solid:v})),note('Выбор сохраняется отдельно для вашего аккаунта на этом устройстве.')));}
async function more(page,me){
 put(page,intro('Моё пространство',me.display_name||me.username),stack(
  h('h2',{class:'m-menu-group'},'Для работы с клиентами'),
  cardLink('Кейсы студии','Найдите пример по сфере клиента и скопируйте ссылку','cases','folder'),
  cardLink('Шаблоны сообщений','Выберите готовый текст и адаптируйте под разговор','templates','template'),
  h('h2',{class:'m-menu-group'},'Моя работа и деньги'),
  cardLink('Баланс и выплаты','Посмотрите реальные начисления и статус запросов','balance','wallet'),
  cardLink('Обратная связь','Ознакомьтесь с договорённостями и оставьте пояснение','feedback','chat'),
  h('h2',{class:'m-menu-group'},'Моё приложение'),
  cardLink('Оформление','Четыре темы, прозрачность и плавность анимаций','settings','sun'),
  cardLink('Установка и помощь','Установка на телефон, Telegram и обновления','help','info'),
  button('Выйти из аккаунта',logout,'btn ghost')));
}

async function help(page,me){const content=stack(card(h('h2',{},'Установить на iPhone'),h('p',{},'Откройте эту страницу в Safari → «Поделиться» → «На экран Домой». Если есть переключатель «Открывать как веб-приложение», включите его.')),card(h('h2',{},'Установить на Android'),h('p',{},'Откройте страницу в Chrome → меню ⋮ → «Установить приложение» или «Добавить на главный экран».'),installPrompt?button('Установить Neelux',async()=>{await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;},'btn primary'):null),card(h('h2',{},'Уведомления через Telegram'),note('Напоминания приходят в @workneelux_bot после привязки вашего аккаунта.'),me?button('Подключить мой Telegram',async()=>{const code=await data.rpc(me,'tg_link_code');const text=typeof code==='string'?code:code?.code;if(!text)throw Error('Не удалось получить код привязки');const a=h('a',{href:`https://t.me/workneelux_bot?start=${encodeURIComponent(text)}`,class:'btn',target:'_blank',rel:'noopener noreferrer'},'Открыть бота и нажать Start');const box=card(note('Перейдите по ссылке и подтвердите запуск бота.'),a);content.append(box);box.scrollIntoView({block:'nearest',behavior:'smooth'});},'btn'):null),card(h('h2',{},'Что доступно на телефоне'),note('Клиенты, заметки и напоминания, задачи, Neelux AI, кейсы, шаблоны, баланс и обратная связь работают с общей базой.'),note('Сборщики, локальные файлы проектов и автоматизация встроенных WhatsApp/VK остаются в компьютерной Studio. Контакты на телефоне открываются отдельными приложениями.')),card(h('h2',{},'Связь и обновления'),note('Для рабочих данных нужен интернет. Без сети открывается только оболочка; отправка изменений не ставится в скрытую очередь.'),registration?.waiting?button('Установить готовое обновление',()=>{updating=true;registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});},'btn primary'):null,link('https://neelux.space/privacy.html','Политика конфиденциальности'),note('Мобильная версия '+NEELUX_MOBILE_CONFIG.version)));put(page,intro('Установка и помощь'),content);if(!me)page.append(button('Вернуться ко входу',login,'btn ghost'));}
$('refresh').onclick=()=>ctx.me?route({force:true}):boot();window.addEventListener('hashchange',()=>{if(ctx.me)route();});
window.NeeluxApplyUpdate=async reg=>{if(!reg.waiting)return;if(!await confirmBox('Обновить Studio?','Сохранённые данные останутся в базе. Несохранённые изменения и черновик AI на этом телефоне будут закрыты.','Обновить'))return;dirtyCheck=()=>false;updating=true;reg.waiting.postMessage({type:'ACTIVATE_UPDATE'});};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
function network(){const offline=!navigator.onLine;$('offline').hidden=!offline;if(!offline&&ctx.me&&!dirtyCheck())route();}
window.addEventListener('online',network);window.addEventListener('offline',network);network();
let resume=0;document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ctx.me&&Date.now()-resume>30000&&!dirtyCheck()&&!activeWriter){resume=Date.now();boot();}});
window.addEventListener('beforeunload',e=>{if(dirtyCheck()){e.preventDefault();e.returnValue='';}});
chrome.storage.onChanged.addListener(ch=>{if(!ch.auth)return;const before=ch.auth.oldValue?.user?.id,after=ch.auth.newValue?.user?.id;if(ctx.me&&(before!==after||!after)){reset();if(after)boot();else login();}});
let refreshing=false;if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js',{scope:'./'}).then(r=>{registration=r;}).catch(()=>{});navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing||!updating)return;refreshing=true;location.reload();});}
boot();
