import * as T from './teams.js';
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
const save=()=>{try{localStorage.setItem('schoolme',JSON.stringify(S))}catch(e){}};
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
urnik(){const mon=addD(sel,-wd(sel));const list=classesOn(sel);const now=new Date();const hm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');const isT=iso(sel)===iso(today);
 const evs=S.events.filter(e=>e.date===iso(sel));
 return `<h1><small>${sel.getDate()}. ${sel.toLocaleDateString('sl',{month:'long'})}</small>${isT?'Danes':DN[wd(sel)]==='Ned'?'Nedelja':sel.toLocaleDateString('sl',{weekday:'long'}).replace(/^./,c=>c.toUpperCase())}</h1>
 <div class="week"><button class="arr" data-wk="-7" aria-label="Prejšnji teden">‹</button><div class="days">${[0,1,2,3,4,5,6].map(i=>{const d=addD(mon,i);return `<button class="day ${iso(d)===iso(sel)?'on':''}" data-day="${iso(d)}">${DN[i]}<b>${d.getDate()}</b></button>`}).join('')}</div><button class="arr" data-wk="7" aria-label="Naslednji teden">›</button></div>
 ${list.length?`<div class="tl">${list.map(c=>`<div class="slot"><span class="hr">${esc(c.start)}</span><${c.teams?'div':'button'} class="cls ${isT&&c.start<=hm&&c.end>=hm?'now':''}" style="--c:${esc(c.color)}" ${c.teams?'':`data-edit-cls="${esc(c.id)}"`}><div class="t">${esc(c.subject)}</div><div class="s">${esc([c.type,c.room,c.prof].filter(Boolean).join(' · '))}</div><div class="s">${esc(c.start)}–${esc(c.end)}${c.date?'':' · vsak teden'}</div>${c.join?`<a class="join" href="${esc(c.join)}" target="_blank" rel="noopener">Pridruži se v Teams</a>`:''}</${c.teams?'div':'button'}></div>`).join('')}</div>`:'<div class="empty">Ta dan ni predavanj.</div>'}
 ${evs.length?`<h2>Roki ta dan</h2>${evs.map(e=>evHTML({t:e.title,s:e.subject,when:fmtD(e.date),time:e.time,ev:e.id},1)).join('')}`:''}
 <div class="btns"><button class="btn" data-act="addClass">+ Predavanje</button><button class="btn sec" data-act="import">Uvozi urnik (XML / .ics)</button></div>`},
predmeti(){return `<h1><small>${esc(S.program||'')}</small>Predmeti</h1>
 ${S.subjects.map(s=>{const a=avg(s);return `<button class="subj" data-sub="${esc(s.id)}"><span class="dot" style="background:${esc(s.color)}">${esc(s.name[0]||'?')}</span><span><span class="t">${esc(s.name)}</span><br><span class="s">${s.grades.length} ocen · ${S.events.filter(e=>e.subject===s.name&&e.date>=iso(today)).length} rokov</span></span><span class="avg">${a??''}</span></button>`}).join('')||'<div class="empty">Še ni predmetov.</div>'}
 <button class="btn w" data-act="addSubject">+ Dodaj predmet</button>`},
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
function avg(s){const n=s.grades.map(g=>parseFloat(String(g.value).replace(',','.'))).filter(x=>!isNaN(x));return n.length?(n.reduce((a,b)=>a+b,0)/n.length).toFixed(1).replace('.0',''):null}

function render(){$('#view').innerHTML=V[tab]?V[tab]():V.home();$('#nav').innerHTML=TABS.map(([k,l])=>`<button class="${k===tab?'on':''}" data-go="${k}" aria-label="${l}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">${I[k]}</svg>${l}</button>`).join('');$('#ava').textContent=(S.name||'T')[0].toUpperCase()}
const go=k=>{tab=k;try{history.replaceState(null,'','#'+k)}catch(e){}render();window.scrollTo(0,0)};

// sheets
const close=()=>$('#scrim').classList.remove('open');
function sheet(html,bind){$('#sheet').innerHTML=html;$('#scrim').classList.add('open');bind&&bind($('#sheet'));const f=$('#sheet').querySelector('input,textarea,select');f&&setTimeout(()=>f.focus(),50)}
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

function subjectView(s){const a=avg(s);const evs=S.events.filter(e=>e.subject===s.name).sort((x,y)=>x.date.localeCompare(y.date));const cls=S.classes.filter(c=>c.subject===s.name);
 sheet(`<h3 style="display:flex;gap:10px;align-items:center"><span class="dot" style="background:${esc(s.color)}">${esc(s.name[0])}</span>${esc(s.name)}</h3>
 <div class="row"><span>Povprečje</span><b style="font-size:22px">${a??'–'}</b></div>
 <h2>Ocene</h2>${s.grades.map(g=>`<div class="row"><span>${esc(g.label)}</span><span><b>${esc(g.value)}</b><button class="x" data-dg="${esc(g.id)}" aria-label="Izbriši oceno">×</button></span></div>`).join('')||'<p class="hint">Še ni ocen.</p>'}
 <form class="two" style="margin-top:8px" id="gf"><input name="label" placeholder="npr. Kolokvij" required><div style="display:flex;gap:6px"><input name="value" placeholder="Ocena" required><button class="btn">+</button></div></form>
 <h2>Pomembni datumi</h2>${evs.map(e=>`<div class="row"><span>${esc(e.title)}</span><b>${fmtD(e.date)} ${esc(e.time||'')}</b></div>`).join('')||'<p class="hint">Ni rokov.</p>'}
 <h2>Urnik</h2>${cls.map(c=>`<div class="row"><span>${esc(c.type)}</span><b>${c.date?fmtD(c.date):DN[c.day]} ${esc(c.start)}</b></div>`).join('')||'<p class="hint">Ni vpisanih predavanj.</p>'}
 <label>Zapiski o predmetu</label><textarea id="sn" placeholder="Pogoji, literatura, povezave …">${esc(s.note)}</textarea>
 <div class="btns"><button class="btn" id="sv">Shrani</button><button class="btn sec" id="sd">Izbriši predmet</button></div>`,el=>{
 el.querySelector('#gf').onsubmit=e=>{e.preventDefault();s.grades.push({id:uid(),label:val(el,'label'),value:val(el,'value')});save();render();subjectView(s)};
 el.querySelectorAll('[data-dg]').forEach(b=>b.onclick=()=>{s.grades=s.grades.filter(g=>g.id!==b.dataset.dg);save();render();subjectView(s)});
 el.querySelector('#sv').onclick=()=>{s.note=el.querySelector('#sn').value;done('Shranjeno')};
 el.querySelector('#sd').onclick=()=>{S.subjects=S.subjects.filter(x=>x.id!==s.id);done('Predmet izbrisan')}})}
function subjectForm(){sheet(`<h3>Nov predmet</h3><form><label>Ime predmeta</label><input name="name" required><label>Nosilec</label><input name="prof"><label>Barva</label>${swatch(COLORS,COLORS[S.subjects.length%6])}<div class="btns"><button class="btn">Dodaj</button></div></form>`,el=>{pickSw(el);el.querySelector('form').onsubmit=e=>{e.preventDefault();S.subjects.push({id:uid(),name:val(el,'name'),prof:val(el,'prof'),color:swVal(el),grades:[],note:''});done('Dodano')}})}

function profile(){sheet(`<h3>Profil</h3><form><label>Ime</label><input name="name" value="${esc(S.name)}"><label>Šola</label><input name="school" value="${esc(S.school)}"><label>Program</label><input name="program" value="${esc(S.program)}"><div class="btns"><button class="btn">Shrani</button></div></form>
 <h2>Podatki</h2><p class="hint">Podatki so shranjeni samo v tem brskalniku. Za varnostno kopijo kopiraj besedilo in ga shrani.</p>
 <div class="btns"><button class="btn sec" id="cp">Kopiraj varnostno kopijo</button><button class="btn sec" id="rs">Prilepi kopijo</button><button class="btn sec" id="cl">Počisti vzorce</button></div>`,el=>{
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
function importSheet(){sheet(`<h3>Uvozi urnik</h3><p class="hint">Izberi XML ali .ics datoteko iz e-študija. Če kaj ne pride prav, mi pošlji datoteko in prilagodim branje.</p><label>Datoteka</label><input type="file" id="f" accept=".xml,.ics,text/xml,text/calendar"><div id="res"></div>`,el=>{
 el.querySelector('#f').onchange=async ev=>{const file=ev.target.files[0];if(!file)return;const txt=await file.text();let list=[];
  try{list=/BEGIN:VCALENDAR/.test(txt)?parseICS(txt):parseXML(txt)}catch(x){el.querySelector('#res').innerHTML=`<p class="hint">${esc(x.message)}</p>`;return}
  const names=[...new Set(list.map(c=>c.subject))];names.forEach((n,i)=>{const col=S.subjects.find(s=>s.name===n)?.color||COLORS[(S.subjects.length+i)%6];list.forEach(c=>{if(c.subject===n)c.color=col})});
  el.querySelector('#res').innerHTML=list.length?`<p><b>Najdenih ${list.length} terminov</b> (${names.length} predmetov)</p>${list.slice(0,6).map(c=>`<div class="row"><span>${esc(c.subject)}</span><b>${c.date?fmtD(c.date):DN[c.day]} ${esc(c.start)}</b></div>`).join('')}${list.length>6?'<p class="hint">…</p>':''}<div class="btns"><button class="btn" id="ok">Dodaj v urnik</button></div>`:'<p class="hint">V datoteki nisem našla terminov. Pošlji mi jo, da prilagodim branje.</p>';
  el.querySelector('#ok')?.addEventListener('click',()=>{list.forEach(c=>ensureSubject(c.subject,c.color));S.classes=S.classes.concat(list);const first=list.map(c=>c.date).filter(Boolean).sort()[0];if(first)sel=new Date(first+'T00:00');tab='urnik';done(`Dodanih ${list.length} terminov`)})}})}

// --- Teams ---
function when(s,short){if(!s)return'';const d=new Date(s);const t=d.toLocaleTimeString('sl',{hour:'2-digit',minute:'2-digit'});if(iso(d)===iso(new Date()))return t;return d.getDate()+'. '+(d.getMonth()+1)+'.'+(short?'':' '+t)}
const errText=e=>e&&e.status===403?'Šola ni dovolila tega dostopa (potrebna je odobritev admina).':e&&e.status===401?'Prijava je potekla. Odjavi se in se prijavi znova.':'Napaka pri nalaganju: '+(e&&e.message||e);
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
T.initTeams().then(a=>{if(a){M.acc=a;loadMS()}else render()}).catch(e=>{M.err=errText(e);render()});

document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;const d=t.dataset;
 if(d.go)go(d.go);else if(d.day){sel=new Date(d.day+'T00:00');render()}else if(d.wk){sel=addD(sel,+d.wk);render()}
 else if(d.editCls)classForm(S.classes.find(c=>c.id===d.editCls));else if(d.editEv)eventForm(S.events.find(x=>x.id===d.editEv));
 else if(d.note)noteForm(S.notes.find(n=>n.id===d.note));else if(d.sub)subjectView(S.subjects.find(s=>s.id===d.sub));
 else if(d.act)({addClass:()=>classForm(),addEvent:()=>eventForm(),addNote:()=>noteForm(),addSubject:subjectForm,import:importSheet})[d.act]()});
$('#ava').onclick=profile;
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(V[h]&&h!==tab){tab=h;render()}});
render();
}
