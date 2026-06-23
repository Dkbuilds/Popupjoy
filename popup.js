/* Popup UI for managing, copying, and inserting snippets. */
let snippets = [], editing = null;
const $ = s => document.querySelector(s);
const msg = m => new Promise(r => chrome.runtime.sendMessage(m, r));
async function load(){ snippets = (await SlashSnipStorage.all()).sort((a,b)=>(b.lastUsedAt||b.updatedAt||0)-(a.lastUsedAt||a.updatedAt||0)); render(); health(); }
function filtered(){ const q=$('#search').value.toLowerCase(); return snippets.filter(s => [s.title,s.shortcut,s.content,s.category].join(' ').toLowerCase().includes(q)); }
function card(s){ return `<article class="snippet"><b>${esc(s.title)}</b> <span class="pill">${esc(s.shortcut)}</span><small>${esc(s.category)} · used ${s.usageCount||0}</small><p>${esc(s.content)}</p><div class="row"><button type="button" data-insert="${s.id}">Insert</button><button type="button" data-copy="${s.id}">Copy</button><button type="button" data-edit="${s.id}">Edit</button><button type="button" data-del="${s.id}">Delete</button></div></article>`; }
function esc(v){ return String(v||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function render(){ const list=filtered(); $('#favorites').innerHTML=list.filter(s=>s.favorite).map(card).join('')||'<p>No favorites yet.</p>'; const cats=[...new Set(list.map(s=>s.category))]; $('#categories').innerHTML=cats.map(c=>`<span class="pill">${esc(c)}</span>`).join('')||'<p>No categories.</p>'; $('#recent').innerHTML=list.map(card).join('')||'<p>No snippets found.</p>'; }
function snippetById(id){ return snippets.find(s=>s.id===id); }
async function activeTab(){ const [tab]=await chrome.tabs.query({active:true,currentWindow:true}); return tab; }
async function resolveVars(text){ const names=[...new Set([...text.matchAll(/{{\s*([\w-]+)\s*}}/g)].map(m=>m[1]))]; for(const n of names){ let v=''; if(n==='date') v=new Date().toLocaleDateString(); else if(n==='time') v=new Date().toLocaleTimeString(); else if(n==='clipboard') v=await navigator.clipboard.readText().catch(()=>prompt('Enter clipboard:')||''); else v=prompt(`Enter ${n}:`)||''; text=text.replace(new RegExp(`{{\\s*${n}\\s*}}`,'g'),v); } return text; }
async function copy(s){ await navigator.clipboard.writeText(await resolveVars(s.content)); alert('Snippet copied to clipboard.'); }
async function insert(s){ const text=await resolveVars(s.content); const tab=await activeTab(); let res; try{ res=await chrome.tabs.sendMessage(tab.id,{type:'INSERT_SNIPPET',text}); }catch(e){ res={ok:false,reason:'Content script unavailable on this page.'}; } if(res?.ok){ await SlashSnipStorage.increment(s.id); window.close(); } else { await navigator.clipboard.writeText(text); alert(`Snippet copied to clipboard. ${res?.reason||'Insertion failed.'}`); } }
function edit(s){ editing=s.id; $('#form').hidden=false; $('#cancel').hidden=false; ['title','shortcut','category','content'].forEach(k=>$('#form')[k].value=s[k]); $('#form').favorite.checked=s.favorite; }
async function del(id){ if(confirm('Delete this snippet?')){ await SlashSnipStorage.remove(id); load(); } }
async function health(){ const tab=await activeTab(); $('#site').textContent=`Current Site: ${new URL(tab.url).hostname}`; try{ const h=await chrome.tabs.sendMessage(tab.id,{type:'HEALTH_CHECK'}); $('#health').innerHTML=h.editableDetected?`<div class="ok">✓ Input field detected: ${h.inputDetected?'yes':'not focused'}</div><div class="ok">✓ Editable field detected</div><div class="ok">✓ Extension active</div>`:'<div class="warn">⚠ No editable field found.</div>'; }catch(e){ $('#health').innerHTML='<div class="warn">⚠ Extension cannot access this page. Insert will copy to clipboard if needed.</div>'; } }
document.addEventListener('click', e => {
  const button = e.target.closest('button[data-copy], button[data-insert], button[data-edit], button[data-del]');
  if (!button) return;
  e.preventDefault();
  if (button.dataset.copy) copy(snippetById(button.dataset.copy));
  if (button.dataset.insert) insert(snippetById(button.dataset.insert));
  if (button.dataset.edit) edit(snippetById(button.dataset.edit));
  if (button.dataset.del) del(button.dataset.del);
});
$('#search').oninput=render; $('#new').onclick=()=>{$('#form').hidden=false;$('#cancel').hidden=false;editing=null;$('#form').reset();}; $('#cancel').onclick=()=>{$('#form').hidden=true;$('#cancel').hidden=true;};
$('#form').onsubmit=async e=>{ e.preventDefault(); const f=e.target; await SlashSnipStorage.save({id:editing,title:f.title.value,shortcut:f.shortcut.value,category:f.category.value,content:f.content.value,favorite:f.favorite.checked,usageCount:snippets.find(s=>s.id===editing)?.usageCount||0}); f.reset(); f.hidden=true; $('#cancel').hidden=true; load(); };
$('#test').onclick=()=>chrome.tabs.create({url:'data:text/html,<title>SlashSnip Test</title><body style="background:%23070b14;color:white;font:16px system-ui;padding:30px"><h1>SlashSnip Test Insertion</h1><textarea autofocus style="width:90%;height:160px"></textarea><div contenteditable style="margin-top:20px;width:90%;min-height:120px;border:1px solid %23555;padding:12px">Contenteditable test area</div></body>'});
load();
