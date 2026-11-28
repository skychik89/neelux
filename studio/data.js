import * as cloud from './shared--cloud.js';
import {STAGES,leadPayload,dayStart,monthStart} from './shared--core.js';
import {clientQuery} from './client-model.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuid=id=>{if(!UUID.test(id))throw Error('Карточка не найдена');return id;};
export async function guard(me){if(!navigator.onLine)throw Error('Нет интернета. Подключитесь к сети и повторите действие.');const id=await cloud.userId();if(!me||id!==me.id||me.status!=='active')throw Error('Аккаунт изменился или доступ ограничен. Войдите снова.');return uuid(id);}
export async function write(me,path,method,body){const id=await guard(me);return cloud.api(path,{method,body,prefer:'return=representation',expectedUser:id});}
export async function rpc(me,name,body={}){return write(me,'rpc/'+name,'POST',body);}
export async function overview(me){const id=uuid(me.id);return Promise.all([
 cloud.rpc('my_stats',{p_day:new Date(dayStart()).toISOString(),p_month:new Date(monthStart()).toISOString()}),
 cloud.select('tasks',`assignee_id=eq.${id}&status=eq.open&select=*&order=due_at.asc.nullslast,created_at.desc&limit=5`),
 cloud.select('leads',`owner_id=eq.${id}&remind_at=lte.${encodeURIComponent(new Date().toISOString())}&stage=in.(new,contacted,replied,call)&select=id,name,niche,city,website,rating,remind_at,stage,owner_id&order=remind_at.asc&limit=5`)
]);}
export function queryClients(me,options={}){return cloud.select('leads',clientQuery(uuid(me.id),options));}
export async function getLead(me,id){const rows=await cloud.select('leads',`id=eq.${uuid(id)}&owner_id=eq.${uuid(me.id)}&select=*`);if(!rows.length)throw Error('Карточка недоступна или передана другому сотруднику');return rows[0];}
export async function saveLead(me,lead,values){const stage=values.stage;if(!Object.hasOwn(STAGES,stage))throw Error('Неизвестный этап');const rows=await write(me,`leads?id=eq.${uuid(lead.id)}&owner_id=eq.${uuid(me.id)}&updated_at=eq.${encodeURIComponent(lead.updated_at)}`,'PATCH',{stage,notes:String(values.notes).slice(0,15000),remind_at:values.remind_at?new Date(values.remind_at).toISOString():null});if(!rows?.length)throw Error('Карточку уже изменили на другом устройстве. Обновите её перед сохранением.');return rows[0];}
export async function addLead(me,values){if(!values.name?.trim())throw Error('Укажите название клиента');return rpc(me,'claim_lead',{p:leadPayload({name:values.name,city:values.city,niche:values.niche,phones:values.phone?[values.phone]:[],source:'manual'})});}
export const taskList=(me,status='open')=>cloud.select('tasks',`assignee_id=eq.${uuid(me.id)}&status=eq.${status==='done'?'done':'open'}&select=*&order=due_at.asc.nullslast,created_at.desc&limit=200`);
export async function taskStatus(me,task){const rows=await write(me,`tasks?id=eq.${uuid(task.id)}&assignee_id=eq.${uuid(me.id)}&status=eq.${task.status}`,'PATCH',{status:task.status==='open'?'done':'open'});if(!rows?.length)throw Error('Задача уже изменена. Обновите список.');return rows[0];}
export async function createTask(me,values){if(!values.title?.trim())throw Error('Укажите задачу');return write(me,'tasks','POST',{title:values.title.slice(0,500),body:values.body.slice(0,5000),assignee_id:uuid(me.id),created_by:uuid(me.id),due_at:values.due?new Date(values.due).toISOString():null});}
export async function moneyData(me){const id=uuid(me.id);return Promise.all([cloud.rpc('my_stats',{p_day:new Date(dayStart()).toISOString(),p_month:new Date(monthStart()).toISOString()}),cloud.select('earnings',`user_id=eq.${id}&select=id,kind,amount,note,created_at&order=created_at.desc&limit=100`),cloud.select('payouts',`user_id=eq.${id}&select=id,amount,status,created_at,admin_comment&order=created_at.desc&limit=100`)]);}
export async function requestPayout(me,team,values){const amount=Number(values.amount);if(!Number.isFinite(amount)||amount<=0||!values.details?.trim())throw Error('Проверьте сумму и реквизиты');const [stats,,payouts]=await moneyData(me),available=Number(stats.balance)-Number(stats.pending_payout);if(amount<(team.min_payout||500)||amount>available)throw Error('Сумма вне доступного диапазона. Обновите баланс.');if(payouts.some(p=>p.status==='pending'&&Number(p.amount)===amount))throw Error('Такая сумма уже ожидает выплаты. Проверьте историю запросов.');return write(me,'payouts','POST',{amount,details:values.details.slice(0,1000),user_id:uuid(me.id)});}
export function balanceOf(stats){return Number(stats?.balance||0)-Number(stats?.pending_payout||0);}
