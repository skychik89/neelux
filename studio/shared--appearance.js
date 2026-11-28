// Personal appearance is local to the authenticated user and server, never a team setting.
(()=>{
 const root=document.documentElement,defaults=()=>({version:1,theme:'liquid',motion:'auto',solid:false,compact:true});
 const presets=Object.freeze([{id:'black',name:'Чёрный',detail:'Тёмное жидкое стекло'},{id:'white',name:'Белый',detail:'Светлое жидкое стекло'},{id:'gray',name:'Серый',detail:'Серебристое жидкое стекло'},{id:'liquid',name:'Прозрачный',detail:'Прозрачное жидкое стекло'}].map(Object.freeze));
 const keyOf=(url,id)=>'neelux-appearance-v1:'+JSON.stringify([String(url||'').replace(/\/+$/,''),String(id)]);
 const identity=s=>s?.auth?.user?.id&&s?.serverConfig?.url?{id:s.auth.user.id,url:String(s.serverConfig.url).replace(/\/+$/,'')}:null;
 const clean=p=>({version:1,theme:presets.some(x=>x.id===p?.theme)?p.theme:'liquid',motion:p?.motion==='reduced'?'reduced':'auto',solid:p?.solid===true,compact:p?.compact!==false});
 let state=defaults(),account=null,revision=0,pending=Promise.resolve();
 function migrated(){let old;try{old=localStorage.getItem('neelux-theme');}catch{}return clean({theme:old==='dark'?'black':old==='light'?'white':old==='auto'?(matchMedia('(prefers-color-scheme:dark)').matches?'black':'white'):'liquid'});}
 function apply(){root.dataset.appearance=state.theme;root.dataset.theme=state.theme==='black'?'dark':'light';root.dataset.themeMode=state.theme;root.dataset.motion=state.motion;root.dataset.transparency=state.solid?'reduced':'full';root.dataset.nav=state.compact?'compact':'expanded';root.style.colorScheme=state.theme==='black'?'dark':'light';window.dispatchEvent(new CustomEvent('neelux:appearance-changed',{detail:{...state}}));requestAnimationFrame(()=>window.NeeluxTabs?.layout?.());return {...state};}
 function reset(){revision++;account=null;state=defaults();apply();}
 async function snapshot(){return chrome.storage.local.get(['auth','serverConfig']);}
 async function bind(id){const token=++revision,s=await snapshot(),who=identity(s);if(token!==revision)return false;if(!who||who.id!==id){reset();return false;}const key=keyOf(who.url,id),data=await chrome.storage.local.get(key),now=identity(await snapshot());if(token!==revision||!now||now.id!==id||now.url!==who.url)return false;account={...who,key};state=data[key]?.version===1?clean(data[key]):migrated();apply();return true;}
 function set(patch){const expected=account,token=revision;const run=pending.then(async()=>{if(!expected||token!==revision||account!==expected)throw Error('Сначала войдите в свой аккаунт');const who=identity(await snapshot());if(!who||who.id!==expected.id||who.url!==expected.url)throw Error('Аккаунт сменился — откройте настройки заново');const theme=patch.theme==='dark'?'black':patch.theme==='light'?'white':patch.theme;const next=clean({...state,...patch,...(theme?{theme}:{})});if(token!==revision||account!==expected)throw Error('Аккаунт сменился — повторите выбор');await chrome.storage.local.set({[expected.key]:next});if(token!==revision||account!==expected)return {...next};state=next;apply();return {...state};});pending=run.catch(()=>{});return run;}
 const bootstrap=window.native?.store,who=identity(bootstrap);if(who){account={...who,key:keyOf(who.url,who.id)};state=bootstrap[account.key]?.version===1?clean(bootstrap[account.key]):migrated();}
 window.NeeluxAppearance=Object.freeze({presets,keyOf,bind,set,reset,get:()=>({...state}),apply});
 window.addEventListener('neelux:account-reset',reset);
 chrome.storage.onChanged?.addListener(ch=>{if(!ch.auth&&!ch.serverConfig)return;snapshot().then(s=>{const who=identity(s);if(account&&(!who||who.id!==account.id||who.url!==account.url))reset();}).catch(()=>reset());});
 apply();
})();
