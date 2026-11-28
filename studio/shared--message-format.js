// Channel capabilities for worker accounts, not Bot API parse modes.
export const CHANNEL_LABELS={wa:'WhatsApp',tg:'Telegram',vk:'ВКонтакте',ig:'Instagram Direct',av:'Авито',email:'Email',plain:'Обычный текст'};
export function channelId(value=''){
 const s=String(value).trim().toLowerCase();
 if(/^(wa|whatsapp)$|whatsapp\.com/.test(s))return 'wa';
 if(/^(tg|telegram)$|telegram\.org|t\.me\//.test(s))return 'tg';
 if(/^(vk|вконтакте)$|vk\.(com|ru)\//.test(s))return 'vk';
 if(/^(ig|instagram direct|instagram)$|instagram\.com/.test(s))return 'ig';
 if(/^(av|avito|авито)$|avito\.ru/.test(s))return 'av';
 if(/^(email|почта)$/.test(s))return 'email';
 return 'plain';
}
export function detectChannel({context,selected,lead}={}){
 const actual=channelId(context?.app||context?.url);if(actual!=='plain')return actual;
 const manual=channelId(selected);if(manual!=='plain')return manual;
 const found=[...new Set((lead?.socials||[]).map(channelId).filter(x=>x!=='plain'))];
 return found.length===1?found[0]:'plain';
}
export function messageRuns(value=''){
 const s=String(value).replace(/\r\n/g,'\n'),runs=[];
 // URLs are consumed first, so their underscores and stars remain literal.
 const re=/https?:\/\/[^\s<>]+|\*\*([^*\n]+)\*\*|(?<!\S)\*([^*\n]+)\*(?!\w)|(?<![\w/])_([^_\n]+)_(?![\w/])/gu;
 let last=0,m;while((m=re.exec(s))){if(m.index>last)runs.push({text:s.slice(last,m.index)});runs.push({text:m[1]??m[2]??m[3]??m[0],...(m[1]||m[2]?{bold:true}:m[3]?{italic:true}:{})});last=re.lastIndex;}
 if(last<s.length)runs.push({text:s.slice(last)});return runs;
}
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function formatMessage(value,channel='plain'){
 const id=channelId(channel),runs=messageRuns(value),plain=runs.map(x=>x.text).join('');
 const html=runs.map(x=>{const s=escape(x.text).replace(/\n/g,'<br>');return x.bold?`<b>${s}</b>`:x.italic?`<i>${s}</i>`:s;}).join('');
 const text=id==='wa'?runs.map(x=>x.bold?`*${x.text}*`:x.italic?`_${x.text}_`:x.text).join(''):plain;
 return {channel:id,runs,plain,text,html,rich:['tg','email'].includes(id),hasStyle:runs.some(x=>x.bold||x.italic)};
}
export function formattingRules(channel){const id=channelId(channel);return ['wa','tg','email'].includes(id)?'Оформление: не больше одного короткого выделения **жирным** и одного _курсивом_, если это помогает смыслу. Короткие абзацы. Приложение преобразует выделение в формат выбранного канала. Не выделяй целиком сообщение и не меняй символы в ссылках.':'Оформление: только обычный текст, короткие абзацы, при необходимости список с «•». Без звёздочек, подчёркиваний для выделения, HTML и декоративных Unicode-шрифтов.';}
export function previewMessage(value,channel){const f=formatMessage(value,channel),box=document.createElement('div');box.className='message-preview';for(const r of f.runs){const el=document.createElement(['wa','tg','email'].includes(f.channel)&&r.bold?'strong':['wa','tg','email'].includes(f.channel)&&r.italic?'em':'span');el.textContent=r.text;box.append(el);}return box;}
export async function copyMessage(value,channel){const f=formatMessage(value,channel);if(f.rich&&typeof ClipboardItem!=='undefined'&&navigator.clipboard.write){try{await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([f.plain],{type:'text/plain'}),'text/html':new Blob([f.html],{type:'text/html'})})]);return;}catch{}}
 await navigator.clipboard.writeText(f.text);
}
