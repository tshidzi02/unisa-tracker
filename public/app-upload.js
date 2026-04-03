// ============================================================
// UNISA Study Tracker — app-upload.js
// File upload, parsing, upsert pipeline, and result rendering.
// Depends on: app-globals.js, app-persistence.js, app-ui.js
// ============================================================

// ── File queue state ─────────────────────────────────────────
let _chosenFiles = [];

// ── Drag-and-drop wiring ─────────────────────────────────────
(function wireDrop() {
  document.addEventListener('DOMContentLoaded', () => {
    const zone = document.getElementById('file-drop-zone');
    if (!zone) return;
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (e.dataTransfer?.files?.length) handleFilesChosen(e.dataTransfer.files);
    });
  });
})();

function handleFilesChosen(fileList) {
  if (!fileList || !fileList.length) return;
  Array.from(fileList).forEach(file => {
    if (!_chosenFiles.find(f => f.name===file.name && f.size===file.size)) _chosenFiles.push(file);
  });
  renderFileQueue();
  document.getElementById('parse-result').classList.add('hidden');
}

function removeQueuedFile(index) { _chosenFiles.splice(index, 1); renderFileQueue(); }

function renderFileQueue() {
  const queueEl = document.getElementById('file-queue');
  const btn     = document.getElementById('btn-extract');
  if (!queueEl) return;
  if (!_chosenFiles.length) { queueEl.style.display='none'; if (btn) btn.style.display='none'; return; }
  const icons = { pdf:'📄',docx:'📝',doc:'📝',xlsx:'📊',xls:'📊',ods:'📊',csv:'📊',pptx:'📑',ppt:'📑',txt:'📃',md:'📃',html:'🌐',htm:'🌐' };
  queueEl.style.display = 'block';
  queueEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;">
      <span>Queued (${_chosenFiles.length} file${_chosenFiles.length>1?'s':''})</span>
      <button style="background:none;border:none;font-size:12px;color:#E24B4A;cursor:pointer;" onclick="_chosenFiles=[];renderFileQueue()">✕ Clear all</button>
    </div>
    ${_chosenFiles.map((f,i) => {
      const ext  = (f.name.split('.').pop()||'').toLowerCase();
      const size = f.size<1024*1024 ? (f.size/1024).toFixed(1)+' KB' : (f.size/(1024*1024)).toFixed(1)+' MB';
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">
        <span>${icons[ext]||'📎'}</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}</span>
        <span style="color:var(--muted);font-size:11px;white-space:nowrap;">${size}</span>
        <button style="background:none;border:none;color:#E24B4A;cursor:pointer;font-size:13px;padding:0 4px;" onclick="removeQueuedFile(${i})" title="Remove">✕</button>
      </div>`;
    }).join('')}`;
  if (btn) { btn.style.display='inline-block'; btn.textContent=`Extract tasks from ${_chosenFiles.length} file${_chosenFiles.length>1?'s':''}`; }
}

// ── Main: parse & upsert (fully client-side) ─────────────────
async function parseAndUpsertFiles() {
  if (!_chosenFiles.length) return showResult('Please choose at least one file first.', true);
  const btn = document.getElementById('btn-extract');
  if (btn) { btn.disabled=true; btn.textContent='Processing…'; }
  showResult('Processing files…', false);
  const results = [];

  for (const file of _chosenFiles) {
    const r = { file:file.name, action:null, code:null, title:null, error:null };
    try {
      const ext = (file.name.split('.').pop()||'').toLowerCase();
      let html = '';
      if      (ext==='html'||ext==='htm')             { html = await file.text(); }
      else if (ext==='pdf')                            { html = `<html><body><pre>${escHtml(await _extractPdf(file))}</pre></body></html>`; }
      else if (ext==='docx'||ext==='doc')              { html = `<html><body><pre>${escHtml(await _extractDocx(file))}</pre></body></html>`; }
      else if (ext==='xlsx'||ext==='xls'||ext==='ods') { html = `<html><body><pre>${escHtml(await _extractExcel(file))}</pre></body></html>`; }
      else if (ext==='csv')                            { html = `<html><body><pre>${escHtml(await file.text())}</pre></body></html>`; }
      else if (ext==='pptx'||ext==='ppt')              { html = `<html><body><pre>${escHtml(await _extractPptx(file))}</pre></body></html>`; }
      else if (ext==='txt'||ext==='md')                { html = `<html><body><pre>${escHtml(await file.text())}</pre></body></html>`; }
      else { r.error='Unsupported file type'; results.push(r); continue; }

      const mod = parseMyUnisaHtml(html, file.name);
      if (mod) {
        const action = upsertModuleLocally(mod);
        r.action = action; r.code = mod.code; r.title = mod.title;
      } else {
        const looseTasks = extractLooseTasks(html);
        let added = 0;
        looseTasks.forEach(t => {
          if (!allTasks().find(x => x.title===t.title && x.module===t.module)) {
            customTasks.push({...t, id:'custom_'+Date.now()+Math.random().toString(36).slice(2), custom:true});
            added++;
          }
        });
        if (added) localStorage.setItem('customTasks', JSON.stringify(customTasks));
        r.action='tasks-extracted'; r.title=`${added} tasks added`;
      }
      results.push(r);
    } catch(err) { r.error=err.message; results.push(r); }
  }

  renderUploadResults(results);
  _chosenFiles=[];
  renderFileQueue();
  if (btn) { btn.disabled=false; btn.textContent='Extract tasks from all files'; }
  refreshAll();
}

// ── Upsert a module into MODULE_DATA + localStorage ──────────
function upsertModuleLocally(mod) {
  const cleanAssessments = [];
  const seenTitles = new Set();
  (mod.assessments || []).forEach(a => {
    const t = (a.title || '').trim();
    if (!t || SKIP_TITLES.has(t) || seenTitles.has(t.toLowerCase())) return;
    seenTitles.add(t.toLowerCase());
    cleanAssessments.push(a);
  });
  mod.assessments = cleanAssessments;

  const existingIdx = MODULE_DATA.findIndex(m => m.code === mod.code);

  if (existingIdx === -1) {
    mod.color = MODULE_DATA.length % 6;
    MODULE_DATA.push(mod);
    saveModuleOverridesToStorage();
    return 'inserted';
  } else {
    const existing = MODULE_DATA[existingIdx];

    if (mod.title && mod.title.length > 10 && !mod.title.match(/^[A-Z0-9]{4,8}$/)) {
      existing.title = mod.title;
    }
    if (mod.description && mod.description.length > existing.description?.length) {
      existing.description = mod.description;
    }
    if (mod.lecturer) existing.lecturer = mod.lecturer;
    if (mod.email)    existing.email    = mod.email;
    if (mod.tel)      existing.tel      = mod.tel;

    const existingAssessmentTitles = new Set(
      (existing.assessments || []).map(a => a.title.toLowerCase())
    );
    (mod.assessments || []).forEach(a => {
      if (!existingAssessmentTitles.has(a.title.toLowerCase())) {
        existing.assessments = existing.assessments || [];
        existing.assessments.push(a);
        existingAssessmentTitles.add(a.title.toLowerCase());
      } else {
        const existing_a = existing.assessments.find(x => x.title.toLowerCase() === a.title.toLowerCase());
        if (existing_a && !existing_a.due && a.due) existing_a.due = a.due;
      }
    });

    if (mod.learningUnits && mod.learningUnits.length > 0) {
      const existingUnitTitles = new Set(
        (existing.learningUnits || []).map(u => u.title.toLowerCase())
      );
      mod.learningUnits.forEach(u => {
        if (!existingUnitTitles.has(u.title.toLowerCase())) {
          existing.learningUnits = existing.learningUnits || [];
          existing.learningUnits.push(u);
        }
      });
    }

    MODULE_DATA[existingIdx] = existing;
    saveModuleOverridesToStorage();
    return 'updated';
  }
}

// ── Extract loose tasks from non-module HTML/text ────────────
function extractLooseTasks(html) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(html, 'text/html');
  const body   = doc.body.innerText || doc.body.textContent || '';
  const tasks  = [];
  const seenA  = new Set();

  const codeMatch = body.match(/\b([A-Z]{2,4}\d{4}[A-Z]?)\b/);
  const moduleCode = codeMatch ? codeMatch[1].toUpperCase() : 'UNKNOWN';

  const aRx = /\b(Assignment|Assessment|Quiz|Test|Exam|Task)\s*(\d+)?[:\s–\-]*([^\n]{3,80})/gi;
  let am;
  while ((am = aRx.exec(body)) !== null) {
    const key = `${am[1]} ${am[2]||''}`.trim();
    if (seenA.has(key.toLowerCase())) continue;
    seenA.add(key.toLowerCase());
    const snip = body.substring(am.index, am.index + 200);
    const dm   = snip.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}\s+\w+\s+\d{4})\b/);
    let due = null;
    if (dm) { const d = new Date(dm[1]); if (!isNaN(d)) due = d.toISOString().split('T')[0]; }
    const typeMap = {assignment:'Assignment',assessment:'Assessment',quiz:'Quiz',test:'Test',exam:'Exam',task:'Task'};
    tasks.push({ title:key, module:moduleCode, type:typeMap[am[1].toLowerCase()]||'Assessment', due, note:'' });
    if (tasks.length >= 20) break;
  }
  return tasks;
}

// ── Parse myUnisa HTML into a module object ───────────────────
function parseMyUnisaHtml(html, filename) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(html, 'text/html');
  const body   = doc.body.innerText || doc.body.textContent || '';
  let code = null;
  const fnMatch = filename.match(/\b([A-Z]{2,4}\d{4}[A-Z]?)\b/i);
  if (fnMatch) code = fnMatch[1].toUpperCase();
  if (!code) { const te = doc.querySelector('title,h1,h2'); if (te) { const m=(te.textContent||'').match(/\b([A-Z]{2,4}\d{4}[A-Z]?)\b/i); if(m) code=m[1].toUpperCase(); } }
  if (!code) { const m=body.match(/\b([A-Z]{2,4}\d{4}[A-Z]?)\b/); if(m) code=m[1].toUpperCase(); }
  if (!code) return null;

  let title='';
  const tm=body.match(new RegExp(code+'[\\s:–\\-]+([^\\n]{5,80})'));
  if (tm) title=tm[1].trim().replace(/\s+/g,' ');
  if (!title && doc.querySelector('title')) title=doc.querySelector('title').textContent.replace(code,'').replace(/[-–:|]/g,'').trim();
  if (!title) title=code;

  let period='Year — 2026';
  if (/semester\s*1/i.test(body)) period='Semester 1 — 2026';
  else if (/semester\s*2/i.test(body)) period='Semester 2 — 2026';

  let lecturer=null,email=null,tel=null;
  const em=body.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/); if(em) email=em[0];
  const tm2=body.match(/\b(0\d{2}[\s\-]?\d{3}[\s\-]?\d{4}|\+27[\s\-]?\d{2}[\s\-]?\d{3}[\s\-]?\d{4})\b/); if(tm2) tel=tm2[1];
  const lm=body.match(/(?:lecturer|contact|e-tutor)[:\s]+([A-Z][a-z]+ [A-Z][a-zA-Z ]{2,30})/i); if(lm) lecturer=lm[1].trim();

  const assessments=[]; const seenA=new Set();
  const aRx=/\b(Assignment|Assessment|Quiz|Test|Exam|Task)\s*(\d+)?[:\s–\-]*([^\n]{3,80})/gi;
  let am;
  while ((am=aRx.exec(body))!==null) {
    const key=`${am[1]} ${am[2]||''}`.trim();
    if (seenA.has(key.toLowerCase())) continue; seenA.add(key.toLowerCase());
    const snip=body.substring(am.index,am.index+200);
    const dm=snip.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4})\b/);
    let due=null; if(dm){const d=new Date(dm[1]);if(!isNaN(d))due=d.toISOString().split('T')[0];}
    const typeMap={assignment:'Assignment',assessment:'Assessment',quiz:'Quiz',test:'Test',exam:'Exam',task:'Task'};
    assessments.push({title:key, type:typeMap[am[1].toLowerCase()]||'Assessment', due, note:''});
    if(assessments.length>=20) break;
  }

  const learningUnits=[];
  const uRx=/(?:^|\n)\s*(?:unit|chapter|topic|learning unit|study unit)\s*(\d+)[:\s.\-–]+([^\n]{5,120})/gi;
  let um;
  while ((um=uRx.exec(body))!==null) {
    const t=um[2].trim();
    if (!learningUnits.find(u=>u.title===t)) learningUnits.push({title:t,description:''});
    if (learningUnits.length>=20) break;
  }

  let description='';
  const paras=body.split(/\n{2,}/);
  for (const p of paras) { if(p.length>100&&p.includes(code)){description=p.trim().replace(/\s+/g,' ');break;} }
  if (!description&&paras.length>1) description=paras.slice(1,3).join('\n\n').trim().replace(/\s+/g,' ').substring(0,800);

  return {code,title,period,lecturer,email,tel,description,assessments,learningUnits,tasks:[]};
}

// ── Colour-coded upload result rows ─────────────────────────
function renderUploadResults(results) {
  const el = document.getElementById('upload-results');
  if (!el) { showResult(results.map(r=>r.error||r.title||r.action).join(' · '),false); return; }
  el.innerHTML = results.map(r => {
    if (r.error)                      return `<div class="upload-result-row upload-result-error">✗ <strong>${r.file}</strong> — ${r.error}</div>`;
    if (r.action==='inserted')        return `<div class="upload-result-row upload-result-new">✚ <strong>${r.code}</strong> — New module added: "${r.title}"</div>`;
    if (r.action==='updated')         return `<div class="upload-result-row upload-result-updated">↻ <strong>${r.code}</strong> — Module updated: "${r.title}"</div>`;
    if (r.action==='tasks-extracted') return `<div class="upload-result-row upload-result-tasks">✓ <strong>${r.file}</strong> — ${r.title}</div>`;
    return '';
  }).join('');
  el.style.display='block';
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ── Result banner & misc helpers ─────────────────────────────
function showResult(msg, isError=false) {
  const el=document.getElementById('parse-result');
  if (!el) return;
  el.textContent=msg; el.classList.remove('hidden','error');
  if (isError) el.classList.add('error');
}

function escHtml(str) { return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function parsePaste() {
  const html=document.getElementById('html-paste').value.trim();
  if (!html) return showResult('Paste some HTML first',true);
  parseHtmlContent(html);
}

async function parseHtmlContent(html) {
  try {
    showResult('Parsing…',false);
    const res=await fetch('/api/parse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({html})});
    const data=await res.json();
    if (data.error) return showResult('Error: '+data.error,true);
    let added=0;
    (data.tasks||[]).forEach(t=>{
      if (!allTasks().find(x=>x.title===t.title&&x.module===t.module)){
        customTasks.push({...t,id:'custom_'+Date.now()+Math.random().toString(36).slice(2),custom:true});
        added++;
      }
    });
    localStorage.setItem('customTasks',JSON.stringify(customTasks));
    showResult(`Done! Found ${data.tasks.length} tasks, added ${added} new ones.`);
    document.getElementById('html-paste').value='';
    refreshAll();
  } catch(e) { showResult('Something went wrong: '+e.message,true); }
}

// ── CDN extraction helpers ────────────────────────────────────
async function _extractPdf(file) {
  showResult('Loading PDF library…',false);
  if (!window.pdfjsLib) {
    await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  showResult('Extracting text from PDF…',false);
  const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
  const pages=[];
  for (let i=1;i<=pdf.numPages;i++) { const pg=await pdf.getPage(i); pages.push((await pg.getTextContent()).items.map(it=>it.str).join(' ')); }
  return pages.join('\n');
}

async function _extractDocx(file) {
  showResult('Loading Word library…',false);
  if (!window.mammoth) await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
  showResult('Extracting text from Word document…',false);
  return (await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value;
}

async function _extractExcel(file) {
  showResult('Loading Excel library…',false);
  if (!window.XLSX) await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  showResult('Extracting text from spreadsheet…',false);
  const wb=window.XLSX.read(await file.arrayBuffer(),{type:'array'});
  return wb.SheetNames.map(n=>`=== ${n} ===\n`+window.XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n');
}

async function _extractPptx(file) {
  showResult('Loading PowerPoint library…',false);
  if (!window.JSZip) await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  showResult('Extracting text from presentation…',false);
  const zip=await window.JSZip.loadAsync(await file.arrayBuffer());
  const slides=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a,b)=>parseInt(a.match(/\d+/)?.[0]||0)-parseInt(b.match(/\d+/)?.[0]||0));
  const parts=[];
  for (const s of slides){const txt=(await zip.files[s].async('string')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();if(txt)parts.push(txt);}
  return parts.join('\n');
}

function _loadScript(src) {
  return new Promise((resolve,reject)=>{
    if (document.querySelector(`script[src="${src}"]`)){resolve();return;}
    const s=document.createElement('script');
    s.src=src; s.onload=resolve; s.onerror=()=>reject(new Error('Failed to load '+src));
    document.head.appendChild(s);
  });
}

// ── Expose globals ────────────────────────────────────────────
window.parseAndUpsertFiles = parseAndUpsertFiles;
window.parseMyUnisaHtml    = parseMyUnisaHtml;
window.upsertModuleLocally  = upsertModuleLocally;
