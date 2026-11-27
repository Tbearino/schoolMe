import * as T from './teams.js';
import * as Y from './sync.js';
{
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const COLORS=['#ff3d8b','#ffab40','#9b7bff','#43b7c9','#43b77a','#f7c43c'];
const NOTE_C=['#f7c43c','#ff7aa8','#8fd3f4','#b9f18c','#ffb37a'];
const DN=['Pon','Tor','Sre','Čet','Pet','Sob','Ned'];
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const wd=d=>(d.getDay()+6)%7;
const today=new Date();today.setHours(0,0,0,0);
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const fmtD=s=>{const d=new Date(s+'T00:00');return d.getDate()+'. '+(d.getMonth()+1)+'.'};

const sample=()=>({name:'Teja',school:'B2 Visoka šola za poslovne vede',program:'Marketing management',sample:true,
 subjects:[{id:'s1',name:'Strateški marketing',prof:'',color:COLORS[0],grades:[{id:uid(),label:'Seminarska',value:'9'}],note:''},
  {id:'s2',name:'Vedenje potrošnikov',prof:'',color:COLORS[2],grades:[],note:''},
  {id:'s3',name:'Digitalni marketing',prof:'',color:COLORS[3],grades:[{id:uid(),label:'Kolokvij',value:'8'}],note:''}],
 classes:[{id:uid(),subject:'Strateški marketing',type:'Predavanje',room:'Predavalnica 2',start:'17:00',end:'19:15',day:wd(today),color:COLORS[0]},
  {id:uid(),subject:'Vedenje potrošnikov',type:'Seminar',room:'Online (Teams)',start:'17:30',end:'20:00',day:(wd(today)+2)%7,color:COLORS[2]}],
 events:[{id:uid(),title:'Oddaja seminarske',subject:'Strateški marketing',date:iso(addD(today,5)),time:'23:59'},
  {id:uid(),title:'Kolokvij',subject:'Digitalni marketing',date:iso(addD(today,12)),time:'17:00'}],
 notes:[{id:uid(),text:'Preberi 3. poglavje',color:NOTE_C[0]},{id:uid(),text:'Napiši esej',color:NOTE_C[1]}]});
let S;
try{S=JSON.parse(localStorage.getItem('schoolme'))}catch(e){}
if(!S||!S.subjects)S=sample();
const store=()=>{try{localStorage.setItem('schoolme',JSON.stringify(S))}catch(e){}};
let pushT=null;const Z={state:'',err:'',last:null};
const save=()=>{S._updated=Date.now();store();if(Y.currentUser()){clearTimeout(pushT);pushT=setTimeout(syncPush,1200)}};
async function syncPush(){if(!Y.currentUser())return;Z.state='push';try{await Y.push(S);Z.last=new Date();Z.err=''}catch(e){Z.err=e.message}Z.state='';syncUI()}
async function syncPull(){if(!Y.currentUser())return;try{const r=await Y.pull();Z.err='';
  if(!r||!r.data){await syncPush();return}
  const remoteT=r.data._updated||Date.parse(r.updated_at)||0,localT=S._updated||0;
  if(remoteT>localT||S.sample){S=r.data;store();render()}else if(localT>remoteT)await syncPush();
  Z.last=new Date()}catch(e){Z.err=e.message}syncUI()}
function syncUI(){const b=document.querySelector('#syncbox');if(b)b.innerHTML=syncHTML()}
function syncHTML(){if(!Y.configured)return '<p class="hint">Sinhronizacija še ni nastavljena (manjka Supabase).</p>';
 const u=Y.currentUser();if(u)return `<p>Prijavljena kot <b>${esc(u.email)}</b><br><span class="hint">${Z.err?esc(Z.err):Z.state?'Sinhroniziram …':Z.last?'Sinhronizirano ob '+Z.last.toLocaleTimeString('sl',{hour:'2-digit',minute:'2-digit'}):'Povezano'}</span></p><div class="btns"><button type="button" class="btn sec" id="ysync">Sinhroniziraj zdaj</button><button type="button" class="btn sec" id="yout">Odjava</button></div>`;
 return `<p class="hint">Prijavi se in tvoji predmeti, urnik, ocene in zapiski bodo enaki na vseh napravah.</p><form id="yf"><label>E-mail</label><input type="email" name="ye" required autocomplete="email"><label>Geslo</label><input type="password" name="yp" required minlength="6" autocomplete="current-password"><div class="btns"><button class="btn" data-m="in">Prijava</button><button class="btn sec" data-m="up">Ustvari račun</button></div>${Z.err?`<p class="hint">${esc(Z.err)}</p>`:''}</form>`}
function bindSync(el){el.addEventListener('click',async e=>{const t=e.target;
  if(t.id==='ysync')syncPull();
  if(t.id==='yout'){await Y.signOut();syncUI()}
  if(t.dataset&&t.dataset.m){e.preventDefault();const f=el.querySelector('#yf');if(!f.reportValidity())return;const em=f.ye.value.trim(),pw=f.yp.value;
   try{Z.err='';const u=t.dataset.m==='in'?await Y.signIn(em,pw):await Y.signUp(em,pw);
    if(!u){Z.err='Poslala sem ti e-mail za potrditev. Klikni povezavo, nato se tu prijavi.';syncUI();return}
    await syncPull();toast('Prijavljena')}catch(x){Z.err=x.message;syncUI()}}})}
let tab=(location.hash||'').slice(1)||'home',sel=new Date(today),openSub=null;

const I={home:'<path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z"/>',urnik:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',predmeti:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',zapiski:'<path d="M5 3h14v12l-6 6H5z"/><path d="M13 21v-6h6"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>'};
const TABS=[['home','Domov'],['urnik','Urnik'],['predmeti','Predmeti'],['zapiski','Zapiski'],['chat','Chat']];
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1800)};

// Teams stanje (ni v localStorage, razen predpomnilnika koledarja)
const M={acc:null,teams:null,chats:null,events:[],err:'',view:null,msgs:null,loading:false};
try{M.events=JSON.parse(localStorage.getItem('schoolme-ms-ev'))||[]}catch(e){}
function classesOn(d){const k=iso(d),w=wd(d);return S.classes.filter(c=>c.date?c.date===k:c.day===w).concat(M.events.filter(e=>e.date===k).map(e=>({...e,type:'Teams',color:'#6264a7'}))).sort((a,b)=>a.start.localeCompare(b.start))}
function upcoming(){
 const out=[];const now=new Date();const hm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
 for(let i=0;i<14;i++){const d=addD(today,i);classesOn(d).forEach(c=>{if(i||c.end>=hm)out.push({k:iso(d)+c.start,t:c.subject,s:[c.type,c.room].filter(Boolean).join(' · '),when:i===0?'Danes':i===1?'Jutri':fmtD(iso(d)),time:c.start})})}
 S.events.filter(e=>e.date>=iso(today)).forEach(e=>out.push({k:e.date+(e.time||''),t:e.title,s:e.subject,when:e.date===iso(today)?'Danes':fmtD(e.date),time:e.time,ev:e.id}));
 return out.sort((a,b)=>a.k.localeCompare(b.k));
}
const evHTML=(u,i)=>`<button class="ev ${i===0?'hot':''}" ${u.ev?`data-edit-ev="${esc(u.ev)}"`:''}><span><span class="t">${esc(u.t)}</span><br><span class="s">${esc(u.s||'')}</span></span><span class="when">${esc(u.when)}<br>${esc(u.time||'')}</span></button>`;
const noteHTML=(n,i)=>`<button class="note" style="background:${esc(n.color)};--r:${[-3,2,-1,3][i%4]}deg" data-note="${esc(n.id)}">${esc(n.text)}</button>`;

const V={
home(){const u=upcoming();return `<h1><small>Živjo,</small>${esc(S.name||'študent')}</h1>
 ${S.sample?`<p class="hint">To so vzorčni podatki. Uredi jih ali jih počisti v profilu (krogec desno zgoraj).</p>`:''}
 <h2>Prihajajoče <button class="link" data-go="urnik">Urnik</button></h2>
 ${u.length?u.slice(0,4).map(evHTML).join(''):'<div class="empty">Nič na vidiku. Dodaj predavanje ali rok.</div>'}
 <div class="btns"><button class="btn sec" data-act="addClass">+ Predavanje</button><button class="btn sec" data-act="addEvent">+ Rok / izpit</button></div>
 <h2>Sticky notes <button class="link" data-go="zapiski">Vsi</button></h2>
 <div class="notes">${S.notes.slice(0,3).map(noteHTML).join('')}<button class="note add" data-act="addNote">+ Dodaj</button></div>`},
urnikDan(){const mon=addD(sel,-wd(sel));const list=classesOn(sel);const now=new Date();const hm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');const isT=iso(sel)===iso(today);
 const evs=S.events.filter(e=>e.date===iso(sel));
 return `<h1><small>${sel.getDate()}. ${sel.toLocaleDateString('sl',{month:'long'})}</small>${isT?'Danes':DN[wd(sel)]==='Ned'?'Nedelja':sel.toLocaleDateString('sl',{weekday:'long'}).replace(/^./,c=>c.toUpperCase())}</h1>
 <div class="week"><button class="arr" data-wk="-7" aria-label="Prejšnji teden">‹</button><div class="days">${[0,1,2,3,4,5,6].map(i=>{const d=addD(mon,i);return `<button class="day ${iso(d)===iso(sel)?'on':''} ${classesOn(d).length||S.events.some(e=>e.date===iso(d))?'has':''}" data-day="${iso(d)}">${DN[i]}<b>${d.getDate()}</b></button>`}).join('')}</div><button class="arr" data-wk="7" aria-label="Naslednji teden">›</button></div>
 ${list.length?`<div class="tl">${list.map(c=>`<div class="slot"><span class="hr">${esc(c.start)}</span><${c.teams?'div':'button'} class="cls ${isT&&c.start<=hm&&c.end>=hm?'now':''}" style="--c:${esc(c.color)}" ${c.teams?'':`data-edit-cls="${esc(c.id)}"`}><div class="t">${esc(c.subject)}</div><div class="s">${esc([c.type,c.room,c.prof].filter(Boolean).join(' · '))}</div><div class="s">${esc(c.start)}–${esc(c.end)}${c.date?'':' · vsak teden'}</div>${c.join?`<a class="join" href="${esc(c.join)}" target="_blank" rel="noopener">Pridruži se v Teams</a>`:''}</${c.teams?'div':'button'}></div>`).join('')}</div>`:'<div class="empty">Ta dan ni predavanj.</div>'}
 ${evs.length?`<h2>Roki ta dan</h2>${evs.map(e=>evHTML({t:e.title,s:e.subject,when:fmtD(e.date),time:e.time,ev:e.id},1)).join('')}`:''}
 <div class="btns"><button class="btn" data-act="addClass">+ Predavanje</button><button class="btn sec" data-act="import">Uvozi urnik</button></div>`},
urnik(){const seg=`<div class="seg" role="tablist">${[['dan','Dan'],['teden','Teden'],['mesec','Mesec']].map(([k,l])=>`<button role="tab" aria-selected="${uv===k}" class="${uv===k?'on':''}" data-uv="${k}">${l}</button>`).join('')}</div>`;
 const add=`<div class="btns"><button class="btn" data-act="addClass">+ Predavanje</button><button class="btn sec" data-act="addEvent">+ Rok</button><button class="btn sec" data-act="import">Uvozi urnik</button></div>`;
 if(uv==='teden'){const mon=addD(sel,-wd(sel)),sun=addD(mon,6);
  return `<h1><small>${mon.getDate()}. ${mon.getMonth()!==sun.getMonth()?(mon.getMonth()+1)+'. ':''}– ${sun.getDate()}. ${sun.toLocaleDateString('sl',{month:'long'})}</small>Teden</h1>${seg}
  <div class="mnav"><button class="arr" data-wk="-7" aria-label="Prejšnji teden">‹</button><button class="link" data-today>Ta teden</button><button class="arr" data-wk="7" aria-label="Naslednji teden">›</button></div>
  ${[0,1,2,3,4,5,6].map(i=>{const d=addD(mon,i),it=dayItems(d),t=iso(d)===iso(today);return `<div class="wday ${t?'today':''}"><button class="wdh" data-pick="${iso(d)}"><b>${DN[i]}</b> ${d.getDate()}. ${d.getMonth()+1}.</button>${it.length?it.map(itemHTML).join(''):'<div class="wnone">–</div>'}</div>`}).join('')}${add}`}
 if(uv==='mesec'){const y=sel.getFullYear(),m=sel.getMonth(),first=new Date(y,m,1),start=addD(first,-wd(first));const cells=[];for(let i=0;i<42;i++){const d=addD(start,i);if(i>=35&&d.getMonth()!==m)break;cells.push(d)}
  const list=dayItems(sel);
  return `<h1><small>${y}</small>${first.toLocaleDateString('sl',{month:'long'}).replace(/^./,c=>c.toUpperCase())}</h1>${seg}
  <div class="mnav"><button class="arr" data-mo="-1" aria-label="Prejšnji mesec">‹</button><button class="link" data-today>Danes</button><button class="arr" data-mo="1" aria-label="Naslednji mesec">›</button></div>
  <div class="mgrid">${DN.map(n=>`<span class="mwh">${n[0]}${n[1]}</span>`).join('')}${cells.map(d=>{const it=dayItems(d);return `<button class="mc ${d.getMonth()!==m?'out':''} ${iso(d)===iso(today)?'today':''} ${iso(d)===iso(sel)?'on':''}" data-msel="${iso(d)}"><span class="mn">${d.getDate()}</span>${it.slice(0,3).map(x=>`<span class="chip ${x.exam?'ex':''}" style="${x.exam?'':`background:${esc(x.color)}`}">${esc(x.exam?'IZP':short(x.subject))}</span>`).join('')}${it.length>3?`<span class="more">+${it.length-3}</span>`:''}</button>`}).join('')}</div>
  <h2>${sel.getDate()}. ${sel.toLocaleDateString('sl',{month:'long'})}, ${sel.toLocaleDateString('sl',{weekday:'long'})}</h2>
  ${list.length?list.map(itemHTML).join(''):'<div class="empty">Ta dan je prost.</div>'}${add}`}
 return V.urnikDan().replace('</h1>','</h1>'+seg)},
predmeti(){return `<h1><small>${esc(S.program||'')}</small>Predmeti</h1>
 <div class="btns" style="margin:-6px 0 16px"><button class="btn" data-act="addSubject">+ Dodaj predmet</button><button class="btn sec" data-act="import">Uvozi iz urnika</button></div>
 ${S.subjects.map(s=>{const a=avg(s);return `<button class="subj" data-sub="${esc(s.id)}"><span class="dot" style="background:${esc(s.color)}">${esc(s.name[0]||'?')}</span><span><span class="t">${esc(s.name)}</span><br><span class="s">${s.grades.length} ocen · ${S.events.filter(e=>e.subject===s.name&&e.date>=iso(today)).length} rokov</span></span><span class="avg">${a??''}</span></button>`}).join('')||'<div class="empty">Še ni predmetov.</div>'}`},
zapiski(){return `<h1><small>Hitri zapiski</small>Sticky notes</h1><div class="notes">${S.notes.map(noteHTML).join('')}<button class="note add" data-act="addNote">+ Dodaj</button></div>`},
chat(){
 if(!M.acc)return `<h1><small>Skupine in sporočila</small>Chat</h1>
 <div class="teams"><h3>Microsoft Teams</h3><div>Prijavi se s šolskim Microsoft računom. schoolMe bo pokazal tvoje teame, kanale, klepete in sestanke.</div>
 <div class="btns"><button class="btn" data-ms="login">Prijava z Microsoftom</button></div></div>
 ${M.err?`<p class="hint">${esc(M.err)}</p>`:''}<p class="hint">schoolMe podatke samo bere, nič ne pošilja in ne spreminja.</p>`;
 const v=M.view;
 if(v){const back=`<button class="link" data-ms="back">‹ Nazaj</button>`;
  if(v.kind==='team')return `${back}<h1><small>Team</small>${esc(v.name)}</h1>${M.loading?'<div class="empty">Nalagam …</div>':(v.channels||[]).map(c=>`<button class="subj" data-ms-ch="${esc(c.id)}"><span class="dot" style="background:#6264a7">#</span><span class="t">${esc(c.name)}</span></button>`).join('')||`<div class="empty">${esc(M.err||'Ni kanalov.')}</div>`}`;
  return `${back}<h1><small>${v.kind==='chat'?'Klepet':esc(v.team||'Kanal')}</small>${esc(v.name)}</h1>
  ${M.loading?'<div class="empty">Nalagam …</div>':M.msgs&&M.msgs.length?M.msgs.map(m=>`<div class="msg"><div class="mh"><b>${esc(m.from)}</b><span>${esc(when(m.when))}</span></div>${m.subject?`<div class="t">${esc(m.subject)}</div>`:''}<div class="mb">${esc(m.text)}</div></div>`).join(''):`<div class="empty">${esc(M.err||'Ni sporočil.')}</div>`}`}
 return `<h1><small>${esc(M.acc.name||M.acc.username)}</small>Chat</h1>
 ${M.err?`<p class="hint">${esc(M.err)}</p>`:''}
 <h2>Study groups <button class="link" data-ms="refresh">Osveži</button></h2>
 ${M.teams==null?'<div class="empty">Nalagam teame …</div>':M.teams.map(t=>`<button class="subj" data-ms-team="${esc(t.id)}"><span class="dot" style="background:var(--grad)">${esc(t.name[0]||'?')}</span><span><span class="t">${esc(t.name)}</span><br><span class="s">${esc(t.desc.slice(0,60))}</span></span></button>`).join('')||'<div class="empty">Nisi v nobenem teamu.</div>'}
 <h2>Klepeti</h2>
 ${M.chats==null?'<div class="empty">Nalagam klepete …</div>':M.chats.slice(0,15).map(c=>`<button class="subj" data-ms-chat="${esc(c.id)}"><span class="dot" style="background:${c.type==='oneOnOne'?'var(--violet)':'var(--pink)'}">${esc((c.lastFrom||c.name)[0]||'?')}</span><span><span class="t">${esc(c.name)}</span><br><span class="s">${esc((c.lastFrom?c.lastFrom+': ':'')+c.last).slice(0,70)}</span></span><span class="s" style="margin-left:auto;white-space:nowrap">${esc(when(c.when,true))}</span></button>`).join('')||'<div class="empty">Ni klepetov.</div>'}
 <div class="btns"><button class="btn sec" data-ms="logout">Odjava</button></div>`}
};

let uv='dan';try{uv=localStorage.getItem('schoolme-uv')||'dan'}catch(e){}
const short=n=>{const s=S.subjects.find(x=>x.name===n);return s&&s.code?s.code:(n||'?').split(/\s+/).filter(w=>w.length>2).map(w=>w[0]).join('').slice(0,3).toUpperCase()||(n||'?').slice(0,3).toUpperCase()};
const subjColor=n=>S.subjects.find(x=>x.name===n)?.color||'#9b7bff';
function dayItems(d){const k=iso(d);return classesOn(d).map(c=>({...c,kind:'c'})).concat(S.events.filter(e=>e.date===k).map(e=>({id:e.id,kind:'e',subject:e.subject||e.title,title:e.title,start:e.time||'',color:/^izpit/i.test(e.title)?'#e5484d':subjColor(e.subject),exam:/^izpit/i.test(e.title)}))).sort((a,b)=>(a.start||'99').localeCompare(b.start||'99'))}
const itemHTML=x=>`<button class="it ${x.exam?'ex':''}" style="--c:${esc(x.color)}" ${x.kind==='e'?`data-edit-ev="${esc(x.id)}"`:x.teams?'':`data-edit-cls="${esc(x.id)}"`}><span class="itt">${esc(x.start||'')}${x.end?'<br><small>'+esc(x.end)+'</small>':''}</span><span><b>${esc(x.kind==='e'?x.title:x.subject)}</b><br><small>${esc(x.kind==='e'?(x.title===x.subject?'':x.subject):[x.type,x.room,x.prof].filter(Boolean).join(' · '))}</small></span></button>`;
function avg(s){const n=s.grades.map(g=>parseFloat(String(g.value).replace(',','.'))).filter(x=>!isNaN(x));return n.length?(n.reduce((a,b)=>a+b,0)/n.length).toFixed(1).replace('.0',''):null}


function applyTheme(){const t=S.theme||'light';const r=document.documentElement;if(t==='auto')delete r.dataset.theme;else r.dataset.theme=t;
 const m=document.querySelector('meta[name=color-scheme]');if(m)m.content='light dark';
 const tc=document.querySelector('meta[name=theme-color]');if(tc)tc.content=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches)?'#1f1a23':'#ffffff'}
function render(){applyTheme();$('#view').innerHTML=V[tab]?V[tab]():V.home();$('#nav').innerHTML=TABS.map(([k,l])=>`<button class="${k===tab?'on':''}" data-go="${k}" aria-label="${l}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">${I[k]}</svg>${l}</button>`).join('');$('#ava').textContent=(S.name||'T')[0].toUpperCase()}
const go=k=>{tab=k;try{history.replaceState(null,'','#'+k)}catch(e){}render();window.scrollTo(0,0)};

// sheets
const close=()=>$('#scrim').classList.remove('open');
function sheet(html,bind){$('#sheet').innerHTML=html;$('#scrim').classList.add('open');bind&&bind($('#sheet'));const f=$('#sheet').querySelector('input,textarea,select');f&&!$('#sheet .shead')&&!$('#sheet [data-theme-set]')&&matchMedia('(pointer:fine)').matches&&setTimeout(()=>f.focus(),50)}
$('#scrim').addEventListener('click',e=>{if(e.target.id==='scrim')close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
const swatch=(list,cur)=>`<div class="sw">${list.map(c=>`<button type="button" data-c="${c}" class="${c===cur?'on':''}" style="background:${c}" aria-label="Barva ${c}"></button>`).join('')}</div>`;
const pickSw=el=>{el.querySelectorAll('.sw button').forEach(b=>b.onclick=()=>{el.querySelectorAll('.sw button').forEach(x=>x.classList.remove('on'));b.classList.add('on')})};
const swVal=el=>el.querySelector('.sw .on')?.dataset.c;
const subjOpts=cur=>`<datalist id="dl">${S.subjects.map(s=>`<option value="${esc(s.name)}">`).join('')}</datalist>`;
const val=(el,n)=>el.querySelector(`[name=${n}]`).value.trim();
const done=m=>{S.sample&&(S.sample=true);save();close();render();m&&toast(m)};

function classForm(c){c=c||{subject:'',type:'Predavanje',room:'',prof:'',start:'17:00',end:'19:15',day:wd(sel),color:COLORS[0]};const isNew=!c.id;
 sheet(`<h3>${isNew?'Novo predavanje':'Uredi predavanje'}</h3><form>
 <label>Predmet</label><input name="subject" list="dl" required value="${esc(c.subject)}">${subjOpts()}
 <div class="two"><div><label>Vrsta</label><select name="type">${['Predavanje','Seminar','Vaje','Konzultacije','Izpit'].map(t=>`<option ${t===c.type?'selected':''}>${t}</option>`).join('')}</select></div><div><label>Prostor</label><input name="room" value="${esc(c.room)}"></div></div>
 <label>Predavatelj</label><input name="prof" value="${esc(c.prof)}">
 <div class="two"><div><label>Začetek</label><input type="time" name="start" required value="${esc(c.start)}"></div><div><label>Konec</label><input type="time" name="end" required value="${esc(c.end)}"></div></div>
 <label>Kdaj</label><select name="when"><option value="w">Vsak teden: ${DN[c.date?wd(new Date(c.date)):c.day]}</option><option value="d" ${c.date?'selected':''}>Samo ${c.date?fmtD(c.date):fmtD(iso(sel))}</option></select>
 <label>Barva</label>${swatch(COLORS,c.color)}
 <div class="btns"><button class="btn">Shrani</button>${isNew?'':'<button type="button" class="btn sec" data-del>Izbriši</button>'}</div></form>`,el=>{pickSw(el);
 el.querySelector('form').onsubmit=e=>{e.preventDefault();const d=c.date||iso(sel);const o={...c,id:c.id||uid(),subject:val(el,'subject'),type:val(el,'type'),room:val(el,'room'),prof:val(el,'prof'),start:val(el,'start'),end:val(el,'end'),color:swVal(el)||c.color};
  if(val(el,'when')==='d'){o.date=d;delete o.day}else{o.day=c.date?wd(new Date(c.date)):c.day;delete o.date}
  ensureSubject(o.subject,o.color);S.classes=S.classes.filter(x=>x.id!==o.id).concat(o);done('Shranjeno')};
 el.querySelector('[data-del]')?.addEventListener('click',()=>{S.classes=S.classes.filter(x=>x.id!==c.id);done('Izbrisano')})})}
function ensureSubject(n,color){if(n&&!S.subjects.some(s=>s.name.toLowerCase()===n.toLowerCase()))S.subjects.push({id:uid(),name:n,prof:'',color:color||COLORS[S.subjects.length%6],grades:[],note:''})}

function eventForm(e){e=e||{title:'',subject:'',date:iso(addD(today,7)),time:'23:59'};const isNew=!e.id;
 sheet(`<h3>${isNew?'Nov rok':'Uredi rok'}</h3><form><label>Kaj</label><input name="title" required value="${esc(e.title)}" placeholder="npr. Oddaja seminarske">
 <label>Predmet</label><input name="subject" list="dl" value="${esc(e.subject)}">${subjOpts()}
 <div class="two"><div><label>Datum</label><input type="date" name="date" required value="${esc(e.date)}"></div><div><label>Ura</label><input type="time" name="time" value="${esc(e.time)}"></div></div>
 <div class="btns"><button class="btn">Shrani</button>${isNew?'':'<button type="button" class="btn sec" data-del>Izbriši</button>'}</div></form>`,el=>{
 el.querySelector('form').onsubmit=ev=>{ev.preventDefault();const o={...e,id:e.id||uid(),title:val(el,'title'),subject:val(el,'subject'),date:val(el,'date'),time:val(el,'time')};ensureSubject(o.subject);S.events=S.events.filter(x=>x.id!==o.id).concat(o);done('Shranjeno')};
 el.querySelector('[data-del]')?.addEventListener('click',()=>{S.events=S.events.filter(x=>x.id!==e.id);done('Izbrisano')})})}

function noteForm(n){n=n||{text:'',color:NOTE_C[0]};const isNew=!n.id;
 sheet(`<h3>Note editor</h3><form><label>Barva</label>${swatch(NOTE_C,n.color)}<label>Besedilo</label><textarea name="text" required style="font:600 22px Caveat,cursive">${esc(n.text)}</textarea>
 <div class="btns"><button class="btn">Shrani note</button>${isNew?'':'<button type="button" class="btn sec" data-del>Izbriši</button>'}</div></form>`,el=>{pickSw(el);
 el.querySelector('form').onsubmit=e=>{e.preventDefault();const o={...n,id:n.id||uid(),text:val(el,'text'),color:swVal(el)||n.color};const i=S.notes.findIndex(x=>x.id===o.id);i<0?S.notes.unshift(o):S.notes[i]=o;done('Shranjeno')};
 el.querySelector('[data-del]')?.addEventListener('click',()=>{S.notes=S.notes.filter(x=>x.id!==n.id);done('Izbrisano')})})}

function subjectView(s){const a=avg(s);const evs=S.events.filter(e=>e.subject===s.name).sort((x,y)=>x.date.localeCompare(y.date));const cls=S.classes.filter(c=>c.subject===s.name);s.materials=s.materials||[];
 const tm=M.teams&&s.teamId?M.teams.find(t=>t.id===s.teamId):null;
 sheet(`<div class="shead" style="--c:${esc(s.color)}"><div><div class="sname">${esc(s.name)}</div><div class="sprof">${s.prof?esc(s.prof):'<i>Profesor ni vpisan</i>'}</div></div><div class="sgrade"><span>Ocena</span><b>${a??'–'}</b></div></div>
 <button class="link" id="se">Uredi predmet</button>
 <h2>Gradiva</h2>
 ${s.teamId?(M.acc?`<div id="tf"><p class="hint">Nalagam datoteke iz teama${tm?' '+esc(tm.name):''} …</p></div>`:'<p class="hint">Predmet je povezan s Teams teamom. Datoteke se pokažejo, ko bo prijava v Teams delovala.</p>'):'<p class="hint">Ko bo Teams povezan, lahko predmet povežeš s teamom in tu se pokažejo njegove datoteke.</p>'}
 ${s.materials.map(m=>`<div class="row"><a class="mat" href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.title)}</a><button class="x" data-dm="${esc(m.id)}" aria-label="Odstrani gradivo">×</button></div>`).join('')}
 <form id="mf" style="margin-top:8px"><div class="two"><input name="mt" placeholder="Naslov gradiva" required><input name="mu" type="url" placeholder="Povezava (https://…)" required></div><div class="btns"><button class="btn sec">+ Dodaj gradivo</button></div></form>
 <h2>Ocene</h2>${s.grades.map(g=>`<div class="row"><span>${esc(g.label)}</span><span><b>${esc(g.value)}</b><button class="x" data-dg="${esc(g.id)}" aria-label="Izbriši oceno">×</button></span></div>`).join('')||'<p class="hint">Še ni ocen.</p>'}
 <form class="two" style="margin-top:8px" id="gf"><input name="label" placeholder="npr. Kolokvij" required><div style="display:flex;gap:6px"><input name="value" placeholder="Ocena" required><button class="btn">+</button></div></form>
 <h2>Pomembni datumi</h2>${evs.map(e=>`<div class="row"><span>${esc(e.title)}</span><b>${fmtD(e.date)} ${esc(e.time||'')}</b></div>`).join('')||'<p class="hint">Ni rokov.</p>'}
 <h2>Urnik</h2>${cls.map(c=>`<div class="row"><span>${esc(c.type)}</span><b>${c.date?fmtD(c.date):DN[c.day]} ${esc(c.start)}</b></div>`).join('')||'<p class="hint">Ni vpisanih predavanj.</p>'}
 <label>Zapiski o predmetu</label><textarea id="sn" placeholder="Pogoji, literatura …">${esc(s.note)}</textarea>
 <div class="btns"><button class="btn" id="sv">Shrani</button><button class="btn sec" id="sd">Izbriši predmet</button></div>`,el=>{
 const re=()=>{save();render();subjectView(s)};
 el.querySelector('#se').onclick=()=>subjectForm(s);
 el.querySelector('#mf').onsubmit=e=>{e.preventDefault();s.materials.push({id:uid(),title:val(el,'mt'),url:val(el,'mu')});re()};
 el.querySelectorAll('[data-dm]').forEach(b=>b.onclick=()=>{s.materials=s.materials.filter(m=>m.id!==b.dataset.dm);re()});
 el.querySelector('#gf').onsubmit=e=>{e.preventDefault();s.grades.push({id:uid(),label:val(el,'label'),value:val(el,'value')});re()};
 el.querySelectorAll('[data-dg]').forEach(b=>b.onclick=()=>{s.grades=s.grades.filter(g=>g.id!==b.dataset.dg);re()});
 el.querySelector('#sv').onclick=()=>{s.note=el.querySelector('#sn').value;done('Shranjeno')};
 el.querySelector('#sd').onclick=()=>{S.subjects=S.subjects.filter(x=>x.id!==s.id);done('Predmet izbrisan')};
 const tf=el.querySelector('#tf');if(tf)T.getTeamFiles(s.teamId).then(fs=>{tf.innerHTML=fs.length?fs.map(f=>`<div class="row"><a class="mat" href="${esc(f.url)}" target="_blank" rel="noopener">${f.folder?'📁 ':''}${esc(f.name)}</a><span class="s">${esc(when(f.when,true))}</span></div>`).join(''):'<p class="hint">Team nima datotek.</p>'}).catch(e=>{tf.innerHTML=`<p class="hint">${esc(errText(e))}</p>`})})}
function subjectForm(s){const isNew=!s;s=s||{name:'',prof:'',color:COLORS[S.subjects.length%6],teamId:''};
 sheet(`<h3>${isNew?'Nov predmet':'Uredi predmet'}</h3><form><label>Ime predmeta</label><input name="name" required value="${esc(s.name)}"><label>Profesor / nosilec</label><input name="prof" value="${esc(s.prof)}">
 ${M.teams&&M.teams.length?`<label>Teams team (za gradiva)</label><select name="team"><option value="">– brez –</option>${M.teams.map(t=>`<option value="${esc(t.id)}" ${t.id===s.teamId?'selected':''}>${esc(t.name)}</option>`).join('')}</select>`:''}
 <label>Barva</label>${swatch(COLORS,s.color)}<div class="btns"><button class="btn">${isNew?'Dodaj':'Shrani'}</button></div></form>`,el=>{pickSw(el);el.querySelector('form').onsubmit=e=>{e.preventDefault();
  const old=s.name,o=Object.assign(s,{name:val(el,'name'),prof:val(el,'prof'),color:swVal(el)||s.color});const tsel=el.querySelector('[name=team]');if(tsel)o.teamId=tsel.value;
  if(isNew){Object.assign(o,{id:uid(),grades:[],note:'',materials:[]});S.subjects.push(o);done('Dodano')}
  else{if(old!==o.name){S.classes.forEach(c=>{if(c.subject===old)c.subject=o.name});S.events.forEach(x=>{if(x.subject===old)x.subject=o.name})}save();render();subjectView(o)}}})}

function profile(){sheet(`<h3>Profil</h3><form><label>Ime</label><input name="name" value="${esc(S.name)}"><label>Šola</label><input name="school" value="${esc(S.school)}"><label>Program</label><input name="program" value="${esc(S.program)}"><label>Videz</label><div class="seg" style="margin:0">${[['light','Svetla'],['dark','Temna'],['auto','Kot telefon']].map(([k,l])=>`<button type="button" data-theme-set="${k}" class="${(S.theme||'light')===k?'on':''}">${l}</button>`).join('')}</div>
 <div class="btns"><button class="btn">Shrani</button></div></form>
 <h2>Sinhronizacija</h2><div id="syncbox">${syncHTML()}</div>
 <h2>Varnostna kopija</h2><p class="hint">Kopiraj besedilo in ga shrani, če želiš kopijo tudi zunaj appa.</p>
 <div class="btns"><button class="btn sec" id="cp">Kopiraj varnostno kopijo</button><button class="btn sec" id="rs">Prilepi kopijo</button><button class="btn sec" id="cl">Počisti vzorce</button></div>`,el=>{
 bindSync(el);
 el.querySelectorAll('[data-theme-set]').forEach(b=>b.onclick=()=>{S.theme=b.dataset.themeSet;save();applyTheme();el.querySelectorAll('[data-theme-set]').forEach(x=>x.classList.toggle('on',x===b))});
 el.querySelector('form').onsubmit=e=>{e.preventDefault();S.name=val(el,'name');S.school=val(el,'school');S.program=val(el,'program');done('Shranjeno')};
 el.querySelector('#cp').onclick=()=>navigator.clipboard.writeText(JSON.stringify(S)).then(()=>toast('Kopirano'),()=>toast('Kopiranje ni uspelo'));
 el.querySelector('#rs').onclick=()=>sheet(`<h3>Obnovi kopijo</h3><textarea id="bk" placeholder="Prilepi besedilo kopije"></textarea><div class="btns"><button class="btn" id="ok">Obnovi</button></div>`,e2=>{e2.querySelector('#ok').onclick=()=>{try{const o=JSON.parse(e2.querySelector('#bk').value);if(!o.subjects)throw 0;S=o;done('Obnovljeno')}catch(x){toast('To ni veljavna kopija')}}});
 el.querySelector('#cl').onclick=()=>{S={name:S.name,school:S.school,program:S.program,subjects:[],classes:[],events:[],notes:[]};done('Počiščeno')}})}

// import
const K={name:['predmet','subject','name','naziv','title','course','summary','ime','opis'],start:['start','zacetek','začetek','od','from','begin','starttime','cas_od','casod','time_from','ura_od'],end:['end','konec','do','to','endtime','cas_do','casdo','time_to','ura_do'],date:['date','datum'],day:['day','dan'],room:['room','prostor','ucilnica','učilnica','location','lokacija','soba','predavalnica'],prof:['teacher','profesor','predavatelj','izvajalec','lecturer','nosilec','professor'],type:['type','tip','vrsta','oblika']};
const pick=(f,keys)=>{for(const k of keys)if(f[k])return f[k]};
function parseDT(v){v=String(v||'').trim();let d=null,t=null;let m=v.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)d=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;else if(m=v.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/))d=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
 const tm=v.replace(/^\d{4}-\d{1,2}-\d{1,2}|^\d{1,2}\.\s*\d{1,2}\.\s*\d{4}/,'').match(/(\d{1,2})[:.](\d{2})/);if(tm)t=tm[1].padStart(2,'0')+':'+tm[2];return{d,t}}
function dayIdx(v){v=String(v||'').toLowerCase();const a=['pon','tor','sre','čet','pet','sob','ned'],b=['mon','tue','wed','thu','fri','sat','sun'];for(let i=0;i<7;i++)if(v.startsWith(a[i])||v.startsWith(b[i])||v.startsWith(a[i].replace('č','c')))return i;const n=parseInt(v);return n>=1&&n<=7?n-1:null}
function parseXML(txt){const doc=new DOMParser().parseFromString(txt,'text/xml');if(doc.querySelector('parsererror'))throw new Error('XML se ne da prebrati');const out=[];
 doc.querySelectorAll('*').forEach(el=>{const f={};for(const a of el.attributes)f[a.name.toLowerCase()]=a.value;for(const c of el.children)if(!c.children.length)f[c.tagName.toLowerCase()]=c.textContent.trim();
  const name=pick(f,K.name),st=parseDT(pick(f,K.start)),en=parseDT(pick(f,K.end));if(!name||!st.t)return;
  const dt=parseDT(pick(f,K.date)).d||st.d,day=dayIdx(pick(f,K.day));if(!dt&&day==null)return;
  const o={id:uid(),subject:name,type:pick(f,K.type)||'Predavanje',room:pick(f,K.room)||'',prof:pick(f,K.prof)||'',start:st.t,end:en.t||st.t,color:COLORS[0]};dt?o.date=dt:o.day=day;out.push(o)});return out}
function parseICS(txt){const lines=txt.replace(/\r?\n[ \t]/g,'').split(/\r?\n/);const out=[];let e=null;
 const dt=v=>{const m=v.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?(Z)?/);if(!m)return{};if(m[6]){const d=new Date(Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5]));return{d:iso(d),t:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}}return{d:`${m[1]}-${m[2]}-${m[3]}`,t:m[4]?m[4]+':'+m[5]:'00:00'}};
 for(const l of lines){if(l==='BEGIN:VEVENT')e={};else if(l==='END:VEVENT'&&e){if(e.s&&e.n)out.push({id:uid(),subject:e.n,type:'Predavanje',room:e.r||'',prof:'',start:e.s.t,end:(e.e||e.s).t,date:e.s.d,color:COLORS[0]});e=null}
  else if(e){const i=l.indexOf(':');const k=l.slice(0,i).split(';')[0],v=l.slice(i+1).replace(/\\,/g,',').replace(/\\n/g,' ');if(k==='SUMMARY')e.n=v;if(k==='LOCATION')e.r=v;if(k==='DTSTART')e.s=dt(v);if(k==='DTEND')e.e=dt(v)}}return out}
// Excel koledar iz e-študija: vrstica s kraticami, vrstica z mesecem (+ "izp"), vrstica s številkami dni; legenda "KRAT Ime - Profesor"
const MON=['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec'];
function parseGrid(rows){
 const legend={};const cell=(r,c)=>rows[r]&&rows[r][c]!=null?String(rows[r][c]).trim():'';
 let y0=null;rows.forEach(r=>(r||[]).forEach(v=>{const s=String(v??'').trim();let m=s.match(/^([A-ZČŠŽ]{2,5})\s+(.+?)\s+[-–]\s+(.+)$/);if(m)legend[m[1]]={name:m[2],prof:m[3]};if(!y0&&(m=s.match(/(20\d\d)\s*\/\s*\d{2}/)))y0=+m[1]}));
 if(!y0)y0=today.getMonth()>=8?today.getFullYear():today.getFullYear()-1;
 const classes=[],events=[];
 rows.forEach((r,i)=>{const mi=MON.indexOf(cell(i,0).toLowerCase().slice(0,3));if(mi<0)return;
  const nums=rows[i+1]||[];const year=mi>=8?y0:y0+1;
  nums.forEach((n,c)=>{const d=parseInt(n);if(!(d>=1&&d<=31)||String(n).trim()!==String(d))return;
   const date=`${year}-${String(mi+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const code=cell(i-1,c),mark=cell(i,c).toLowerCase();
   const L=legend[code];
   const isEx=mark.startsWith('izp');
   if(code&&L&&!isEx)classes.push({code,subject:L.name,prof:L.prof,date});
   else if(code&&code.length>4&&!/^\d+$/.test(code))events.push({title:code,subject:'',date,time:''});
   if(mark.startsWith('izp'))events.push({title:'Izpit'+(L?' – '+code:''),subject:L?L.name:'',date,time:'',exam:true})})});
 return{legend,classes,events}}
async function readXlsx(file){const X=await import('xlsx');const wb=X.read(await file.arrayBuffer(),{type:'array'});return X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:true,defval:null})}

function importSheet(){sheet(`<h3>Uvozi urnik</h3><p class="hint">Izberi Excel urnik iz e-študija (.xlsx) ali koledar (.ics, .xml).</p><label>Datoteka</label><input type="file" id="f" accept=".xlsx,.xls,.xml,.ics,text/xml,text/calendar,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"><div id="res"></div>`,el=>{
 const res=el.querySelector('#res');
 el.querySelector('#f').onchange=async ev=>{const file=ev.target.files[0];if(!file)return;res.innerHTML='<p class="hint">Berem …</p>';
  if(/\.xlsx?$/i.test(file.name)){let g;try{g=parseGrid(await readXlsx(file))}catch(x){res.innerHTML=`<p class="hint">Excela ne morem prebrati: ${esc(x.message)}</p>`;return}
   const codes=Object.keys(g.legend);if(!g.classes.length){res.innerHTML='<p class="hint">V tej datoteki nisem našla terminov. Pošlji mi jo, da prilagodim branje.</p>';return}
   const exams=g.events.filter(e=>e.exam).length,dates=g.classes.map(c=>c.date).sort();
   res.innerHTML=`<p><b>${g.classes.length} predavanj, ${codes.length} predmetov, ${exams} izpitov</b><br><span class="hint">${fmtD(dates[0])} – ${fmtD(dates[dates.length-1])} ${dates[dates.length-1].slice(0,4)}</span></p>
   ${codes.map(k=>`<div class="row"><span><b>${esc(k)}</b> ${esc(g.legend[k].name)}</span><span class="s" style="white-space:nowrap">${esc(g.legend[k].prof)}</span></div>`).join('')}
   <p class="hint" style="margin-top:12px">V datoteki ni ur predavanj. Nastavi običajne ure, kasneje jih lahko popraviš pri vsakem terminu.</p>
   <div class="two"><div><label>Začetek</label><input type="time" id="ts" value="17:00"></div><div><label>Konec</label><input type="time" id="te" value="20:15"></div></div>
   ${S.sample?'<label style="display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" id="cs" checked style="width:22px;min-height:22px"> Odstrani vzorčne podatke</label>':''}
   <div class="btns"><button class="btn" id="ok">Uvozi urnik</button></div>`;
   el.querySelector('#ok').onclick=()=>{const ts=el.querySelector('#ts').value||'17:00',te=el.querySelector('#te').value||'20:15';
    if(el.querySelector('#cs')?.checked){S.subjects=[];S.classes=[];S.events=[];S.notes=[];S.sample=false}
    S.classes=S.classes.filter(c=>c.src!=='xlsx');S.events=S.events.filter(e=>e.src!=='xlsx');
    codes.forEach((k,i)=>{const L=g.legend[k];let s=S.subjects.find(x=>x.name.toLowerCase()===L.name.toLowerCase());if(!s){s={id:uid(),name:L.name,prof:L.prof,color:COLORS[(S.subjects.length)%6],grades:[],note:'',materials:[]};S.subjects.push(s)}else if(!s.prof)s.prof=L.prof;s.code=k});
    const col=n=>S.subjects.find(s=>s.name===n)?.color||COLORS[0];
    S.classes=S.classes.concat(g.classes.map(c=>({id:uid(),subject:c.subject,type:'Predavanje',room:'',prof:c.prof,start:ts,end:te,date:c.date,color:col(c.subject),src:'xlsx'})));
    S.events=S.events.concat(g.events.map(e=>({id:uid(),title:e.title,subject:e.subject,date:e.date,time:e.time,src:'xlsx'})));
    const next=dates.find(d=>d>=iso(today))||dates[0];sel=new Date(next+'T00:00');tab='urnik';done(`Uvoženih ${g.classes.length} predavanj`)};
   return}
  const txt=await file.text();let list=[];
  try{list=/BEGIN:VCALENDAR/.test(txt)?parseICS(txt):parseXML(txt)}catch(x){res.innerHTML=`<p class="hint">${esc(x.message)}</p>`;return}
  const names=[...new Set(list.map(c=>c.subject))];names.forEach((n,i)=>{const col=S.subjects.find(s=>s.name===n)?.color||COLORS[(S.subjects.length+i)%6];list.forEach(c=>{if(c.subject===n)c.color=col})});
  res.innerHTML=list.length?`<p><b>Najdenih ${list.length} terminov</b> (${names.length} predmetov)</p>${list.slice(0,6).map(c=>`<div class="row"><span>${esc(c.subject)}</span><b>${c.date?fmtD(c.date):DN[c.day]} ${esc(c.start)}</b></div>`).join('')}${list.length>6?'<p class="hint">…</p>':''}<div class="btns"><button class="btn" id="ok">Dodaj v urnik</button></div>`:'<p class="hint">V datoteki nisem našla terminov. Pošlji mi jo, da prilagodim branje.</p>';
  el.querySelector('#ok')?.addEventListener('click',()=>{list.forEach(c=>ensureSubject(c.subject,c.color));S.classes=S.classes.concat(list);const first=list.map(c=>c.date).filter(Boolean).sort()[0];if(first)sel=new Date(first+'T00:00');tab='urnik';done(`Dodanih ${list.length} terminov`)})}})}

// --- Teams ---
function when(s,short){if(!s)return'';const d=new Date(s);const t=d.toLocaleTimeString('sl',{hour:'2-digit',minute:'2-digit'});if(iso(d)===iso(new Date()))return t;return d.getDate()+'. '+(d.getMonth()+1)+'.'+(short?'':' '+t)}
const errText=e=>e&&/consent|admin|AADSTS65001|AADSTS90094/i.test(String(e.errorCode||'')+e.message)?'Šola zahteva, da schoolMe odobri IT admin. Do takrat deluje vse ostalo ročno.':e&&e.status===403?'Šola ni dovolila tega dostopa (potrebna je odobritev admina).':e&&e.status===401?'Prijava je potekla. Odjavi se in se prijavi znova.':'Napaka pri nalaganju: '+(e&&e.message||e);
const rr=()=>{if(tab==='chat'||tab==='home'||tab==='urnik')render()};
async function loadMS(){M.err='';M.teams=null;M.chats=null;rr();
 const [t,c,ev]=await Promise.allSettled([T.getTeams(),T.getChats(),T.getEvents(addD(today,-7),28)]);
 M.teams=t.status==='fulfilled'?t.value:[];M.chats=c.status==='fulfilled'?c.value:[];
 if(ev.status==='fulfilled'){M.events=ev.value;try{localStorage.setItem('schoolme-ms-ev',JSON.stringify(M.events))}catch(e){}}
 const bad=[t,c,ev].find(x=>x.status==='rejected');if(bad)M.err=errText(bad.reason);rr()}
async function openMS(kind,id){M.loading=true;M.msgs=null;M.err='';
 if(kind==='team'){const tm=M.teams.find(x=>x.id===id);M.view={kind,id,name:tm.name,channels:null};render();
  try{M.view.channels=await T.getChannels(id)}catch(e){M.err=errText(e)}}
 else if(kind==='ch'){const tm=M.view;const ch=tm.channels.find(x=>x.id===id);M.view={kind,id,name:ch.name,team:tm.name,teamId:tm.id,parent:tm};render();
  try{M.msgs=await T.getChannelMessages(tm.id,id)}catch(e){M.err=errText(e)}}
 else{const c=M.chats.find(x=>x.id===id);M.view={kind:'chat',id,name:c.name};render();
  try{M.msgs=await T.getChatMessages(id)}catch(e){M.err=errText(e)}}
 M.loading=false;render();window.scrollTo(0,0)}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.ms==='login')T.login().catch(x=>{M.err=errText(x);render()});
 else if(d.ms==='logout'){try{localStorage.removeItem('schoolme-ms-ev')}catch(x){}T.logout()}
 else if(d.ms==='refresh')loadMS();
 else if(d.ms==='back'){M.err='';M.view=M.view&&M.view.parent?M.view.parent:null;M.msgs=null;render()}
 else if(d.msTeam)openMS('team',d.msTeam);else if(d.msCh)openMS('ch',d.msCh);else if(d.msChat)openMS('chat',d.msChat)});
{const g=new URLSearchParams(location.search).get('go');if(g){try{history.replaceState(null,'',location.pathname+location.hash)}catch(e){}
 if(g==='danes'){tab='urnik';uv='dan';sel=new Date(today);render()}else if(g==='mesec'){tab='urnik';uv='mesec';sel=new Date(today);render()}
 else if(g==='rok'){render();eventForm()}else if(g==='zapisek'){tab='zapiski';render();noteForm()}}}
Y.init(u=>{Z.err='';if(u)syncPull();syncUI()}).then(u=>{if(u)syncPull()}).catch(e=>{Z.err=e.message});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncPull()});
T.initTeams().then(a=>{if(a){M.acc=a;loadMS()}else{if(T.lastError())M.err=T.lastError();render()}}).catch(e=>{M.err=errText(e);render()});

document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;const d=t.dataset;
 if(d.go)go(d.go);else if(d.uv){uv=d.uv;try{localStorage.setItem('schoolme-uv',uv)}catch(x){}render()}else if(d.mo){sel=new Date(sel.getFullYear(),sel.getMonth()+ +d.mo,1);render()}else if(d.msel){sel=new Date(d.msel+'T00:00');render()}else if(d.pick){sel=new Date(d.pick+'T00:00');uv='dan';render()}else if('today' in d){sel=new Date(today);render()}else if(d.day){sel=new Date(d.day+'T00:00');render()}else if(d.wk){sel=addD(sel,+d.wk);render()}
 else if(d.editCls)classForm(S.classes.find(c=>c.id===d.editCls));else if(d.editEv)eventForm(S.events.find(x=>x.id===d.editEv));
 else if(d.note)noteForm(S.notes.find(n=>n.id===d.note));else if(d.sub)subjectView(S.subjects.find(s=>s.id===d.sub));
 else if(d.act)({addClass:()=>classForm(),addEvent:()=>eventForm(),addNote:()=>noteForm(),addSubject:()=>subjectForm(),import:importSheet})[d.act]()});
$('#ava').onclick=profile;
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(V[h]&&h!==tab){tab=h;render()}});
render();
if('serviceWorker' in navigator&&location.hostname!=='localhost')navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
