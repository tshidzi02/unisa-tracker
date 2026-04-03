// ============================================================
// UNISA Study Tracker — app-schedule.js
// Schedule generation, rendering, persistence, and tick-off.
// Depends on: app-globals.js, app-persistence.js, app-ui.js
// ============================================================

let savedScheduleSettings = JSON.parse(localStorage.getItem('schedSettings')||'null');
let savedScheduleData     = JSON.parse(localStorage.getItem('savedStudySchedule')||'null');

// ── Saved-schedules storage ──────────────────────────────────
function getSavedSchedules(){try{return JSON.parse(localStorage.getItem('savedSchedules')||'[]');}catch{return[];}}
function setSavedSchedules(list){localStorage.setItem('savedSchedules',JSON.stringify(list));}

function serializeScheduleDays(days){
  return days.map(day=>({date:day.date instanceof Date?day.date.toISOString():day.date,hoursUsed:day.hoursUsed,items:day.items.map(item=>({...item}))}));
}
function deserializeScheduleDays(days){
  return (days||[]).map(day=>({date:new Date(day.date),hoursUsed:day.hoursUsed||0,items:(day.items||[]).map(item=>({...item}))}));
}

function saveScheduleToStorage(days,allItems,endDate,hoursDay,settings){
  const payload={savedAt:new Date().toISOString(),days:serializeScheduleDays(days),allItems,endDate,hoursDay,settings};
  localStorage.setItem('schedSettings',JSON.stringify(settings));
  localStorage.setItem('savedStudySchedule',JSON.stringify(payload));
  savedScheduleData=payload;
}

function loadScheduleFromStorage(){
  try{
    const raw=localStorage.getItem('savedStudySchedule'); if(!raw) return null;
    const p=JSON.parse(raw);
    return{...p,days:deserializeScheduleDays(p.days||[]),allItems:p.allItems||[],settings:p.settings||null};
  }catch{return null;}
}

function clearSavedSchedule(){localStorage.removeItem('savedStudySchedule');localStorage.removeItem('schedSettings');}

function saveScheduleRecord(days,allItems,endDate,hoursDay,settings){
  let schedules=getSavedSchedules();
  const sd=serializeScheduleDays(days);
  const sig=JSON.stringify({endDate,hoursDay,settings,days:sd,allItems});
  const ei=schedules.findIndex(s=>JSON.stringify({endDate:s.endDate,hoursDay:s.hoursDay,settings:s.settings,days:s.days||[],allItems:s.allItems||[]})===sig);
  if(ei!==-1) return schedules[ei];
  const record={id:`sched_${Date.now()}`,savedAt:new Date().toISOString(),endDate,hoursDay,days:sd,settings};
  schedules.unshift(record);
  if (schedules.length > 3) schedules = schedules.slice(0, 3);
  setSavedSchedules(schedules); return record;
}

function loadScheduleRecord(id){
  const found=getSavedSchedules().find(s=>s.id===id);
  if(!found) return null;
  return{...found,days:deserializeScheduleDays(found.days||[])};
}

async function saveScheduleToBackend(payload){
  try{await apiFetch('/api/schedules',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});}
  catch(e){console.warn('Could not save schedule to backend:',e.message);}
}

function renderSavedSchedules(){
  const wrap=document.getElementById('saved-schedules-list'); if(!wrap) return;
  const schedules=getSavedSchedules();
  if(!schedules.length){wrap.innerHTML=`<div class="empty">No saved schedules yet.</div>`;return;}
  wrap.innerHTML=schedules.map(s=>{
    const savedDate=new Date(s.savedAt).toLocaleString('en-ZA',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    return `<div class="saved-schedule-card">
      <div>
        <div class="saved-schedule-title">Finish by ${s.endDate}</div>
        <div class="saved-schedule-meta">Saved: ${savedDate}</div>
        <div class="saved-schedule-meta">${(s.days||[]).length} study days · ${(s.days||[]).reduce((n,d)=>n+(d.items||[]).length,0)} items · ${s.hoursDay}h/day</div>
        </div>
      <button class="bulk-btn" onclick="openSavedSchedule('${s.id}')">Open</button>
    </div>`;
  }).join('');
}

function openSavedSchedule(id){
  const saved=loadScheduleRecord(id); if(!saved){alert('Saved schedule not found.');return;}
  isOpeningSavedSchedule=true; savedScheduleSettings=saved.settings||null;
  saveScheduleToStorage(saved.days||[],saved.allItems||[],saved.endDate,saved.hoursDay||3,saved.settings||null);
  if(saved.settings){
    document.getElementById('sched-end-date').value=saved.settings.endDate||'';
    document.getElementById('sched-hours').value=saved.settings.hoursDay||3;
    document.getElementById('sched-hours-val').textContent=saved.settings.hoursDay||3;
    document.querySelectorAll('.day-picker input[type="checkbox"]').forEach(cb=>{cb.checked=(saved.settings.studyDays||[]).includes(parseInt(cb.value));});
    document.querySelectorAll('.sched-mod-cb').forEach(cb=>{cb.checked=(saved.settings.selectedMods||[]).includes(cb.value);});
    document.getElementById('inc-units').checked=!!saved.settings.incUnits;
    document.getElementById('inc-assessments').checked=!!saved.settings.incAssess;
    document.getElementById('inc-done').checked=!!saved.settings.incDone;
  }
  document.getElementById('sched-form').style.display='none';
  document.getElementById('sched-output').style.display='block';
  document.querySelectorAll('.missed-banner,.on-track-banner').forEach(el=>el.remove());
  renderScheduleOutput(saved.days||[],saved.allItems||[],saved.endDate,saved.hoursDay||3);
  isOpeningSavedSchedule=false;
}
window.openSavedSchedule=openSavedSchedule;

// ── Schedule page init ───────────────────────────────────────
function initSchedulePage(){
  const list=document.getElementById('sched-module-list'); if(!list) return;
  list.innerHTML=MODULE_DATA.map(mod=>{
    const c=col(mod.color||0);
    const seenTitles=new Set();
    let pa=0;
    TASK_FIELDS.forEach(f=>{(mod[f]||[]).forEach(a=>{const t=(a.title||'').trim();if(!t||seenTitles.has(t.toLowerCase()))return;seenTitles.add(t.toLowerCase());if(!doneTasks.includes(`${mod.code}__${t}`))pa++;});});
    const pu=(mod.learningUnits||[]).filter((_,i)=>!doneTasks.includes(`${mod.code}__unit__${i}`)).length;
    return `<label class="sched-mod-row">
      <input type="checkbox" class="sched-mod-cb" value="${mod.code}" checked />
      <div class="sched-mod-icon" style="background:${c.bg};color:${c.text}">${mod.code.substring(0,3)}</div>
      <div class="sched-mod-info"><span class="sched-mod-code">${mod.code}</span><span class="sched-mod-name">${mod.title}</span></div>
      <span class="sched-mod-count">${pu} units · ${pa} assessments pending</span>
    </label>`;
  }).join('');
  const ei=document.getElementById('sched-end-date'); if(ei&&!ei.value) ei.value='2026-10-30';
  renderSavedSchedules();
  const saved=loadScheduleFromStorage(); if(!saved) return;
  if(saved.settings){
    savedScheduleSettings=saved.settings;
    document.getElementById('sched-end-date').value=saved.settings.endDate||'2026-10-30';
    document.getElementById('sched-hours').value=saved.settings.hoursDay||3;
    document.getElementById('sched-hours-val').textContent=saved.settings.hoursDay||3;
    document.querySelectorAll('.day-picker input[type=checkbox]').forEach(cb=>{cb.checked=(saved.settings.studyDays||[]).includes(parseInt(cb.value));});
    document.querySelectorAll('.sched-mod-cb').forEach(cb=>{cb.checked=(saved.settings.selectedMods||[]).includes(cb.value);});
    document.getElementById('inc-units').checked=!!saved.settings.incUnits;
    document.getElementById('inc-assessments').checked=!!saved.settings.incAssess;
    document.getElementById('inc-done').checked=!!saved.settings.incDone;
  }
  if(saved.days&&saved.days.length){
    document.getElementById('sched-form').style.display='none';
    document.getElementById('sched-output').style.display='block';
    renderScheduleOutput(saved.days,saved.allItems||[],saved.endDate,saved.hoursDay||3);
  }
}

function schedSelectAll(val){document.querySelectorAll('.sched-mod-cb').forEach(cb=>cb.checked=val);}

// ── Sessions-per-unit config ─────────────────────────────────
const UNIT_SESSIONS = {
  "FYE1500":  9,
  "APM1513": 13,
  "APM2616":  9,
  "COS1521":  6,
  "COS2611": 20,
  "COS2614":  8,
  "COS3751":  9,
  "COS3761": 26,
  "MAT2612": 16,
};

function shouldScheduleAssessment(a, today, endDate) {
  const type = (a.type || '').toLowerCase();
  const due  = a.due || a.closes || null;
  if (type === 'exam' && !due) {
    return endDate >= new Date('2026-09-01');
  }
  if (due && new Date(due) < today) return false;
  return true;
}

function expandUnitSessions(unit, unitIdx, mod, hardDue, totalSessions) {
  const uId   = `${mod.code}__unit__${unitIdx}`;
  const items = [];
  for (let s = 1; s <= totalSessions; s++) {
    items.push({
      module:        mod.code,
      moduleTitle:   mod.title,
      type:          'Learning Unit',
      title:         unit.title,
      sessionLabel:  `${s}/${totalSessions}`,
      id:            `${uId}__session__${s}`,
      unitId:        uId,
      sessionNum:    s,
      sessionTotal:  totalSessions,
      due:           hardDue,
      hardDue:       hardDue,
      done:          doneTasks.includes(`${uId}__session__${s}`),
      hours:         2,
      color:         mod.color || 0,
      isUnit:        true,
      forAssessment: null,
    });
  }
  return items;
}

// ── Generate schedule ────────────────────────────────────────
function generateSchedule() {
  console.group('🗓️ generateSchedule() START');

  const endDateVal = document.getElementById('sched-end-date').value;
  console.log('[1] endDateVal from input:', endDateVal);
  if (!endDateVal) { console.error('[1] ❌ No end date set — aborting.'); return alert('Please set a finish date first.'); }

  const endDate  = new Date(endDateVal); endDate.setHours(23, 59, 59);
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const hoursDay = parseInt(document.getElementById('sched-hours').value) || 3;
  const incUnits  = document.getElementById('inc-units').checked;
  const incAssess = document.getElementById('inc-assessments').checked;
  const incDone   = document.getElementById('inc-done').checked;
  console.log('[1] Parsed settings →', { endDate: endDate.toISOString(), today: today.toISOString(), hoursDay, incUnits, incAssess, incDone });

  const studyDays = Array.from(document.querySelectorAll('.day-picker input[type=checkbox]'))
                        .filter(c => c.checked).map(c => parseInt(c.value));
  console.log('[1] Study days (0=Sun … 6=Sat):', studyDays);
  if (!studyDays.length) { console.error('[1] ❌ No study days selected — aborting.'); return alert('Please select at least one study day.'); }

  const selectedMods = Array.from(document.querySelectorAll('.sched-mod-cb'))
                           .filter(c => c.checked).map(c => c.value);
  console.log('[1] Selected modules:', selectedMods);
  if (!selectedMods.length) { console.error('[1] ❌ No modules selected — aborting.'); return alert('Please select at least one module.'); }

  // Step 2: Build ordered item list
  console.group('[2] Building allOrderedItems');
  const allOrderedItems = [];

  selectedMods.forEach(code => {
    const mod = MODULE_DATA.find(m => m.code === code);
    if (!mod) { console.warn(`  [2] ⚠️ Module ${code} not found in MODULE_DATA — skipping.`); return; }

    const links = (typeof UNIT_LINKS !== 'undefined' && UNIT_LINKS[code]) || {};
    const sessionsPerUnit = UNIT_SESSIONS[code] || 4;
    console.group(`  [2] Processing module: ${code} | sessionsPerUnit=${sessionsPerUnit}`);
    console.log(`  [2] UNIT_LINKS for ${code}:`, links);

    const assessList = [];
    const seenTitles = new Set();
    TASK_FIELDS.forEach(field => {
      (mod[field] || []).forEach(a => {
        const t = (a.title || '').trim();
        if (!t || seenTitles.has(t.toLowerCase())) return;
        seenTitles.add(t.toLowerCase());
        assessList.push(a);
      });
    });
    console.log(`  [2] Deduplicated assessList (${assessList.length} items):`, assessList.map(a => a.title));

    const scheduledUnitIdxs = new Set();

    assessList.forEach(a => {
      const aId   = `${code}__${a.title}`;
      const aDone = doneTasks.includes(aId);
      const aDue  = a.due || a.closes || null;
      const shouldSched = shouldScheduleAssessment(a, today, endDate);
      console.log(`    [2] Assessment "${a.title}" | id=${aId} | due=${aDue} | done=${aDone} | shouldSchedule=${shouldSched}`);

      if (!shouldSched) { console.log(`    [2]   ↳ Skipped (shouldScheduleAssessment returned false)`); return; }

      const reqIdxs = links[a.title] || [];
      console.log(`    [2]   Prerequisite unit indexes for "${a.title}":`, reqIdxs);

      if (incUnits) {
        reqIdxs.forEach(i => {
          if (scheduledUnitIdxs.has(i)) { console.log(`    [2]   Unit[${i}] already scheduled — skipping.`); return; }
          const u = (mod.learningUnits || [])[i];
          if (!u) { console.warn(`    [2]   ⚠️ Unit[${i}] not found in learningUnits for ${code}`); return; }
          const uDone = doneTasks.includes(`${mod.code}__unit__${i}`);
          if (!incDone && uDone) {
            console.log(`    [2]   Unit[${i}] "${u.title}" is done and incDone=false — marking scheduled, skipping sessions.`);
            scheduledUnitIdxs.add(i);
            return;
          }
          scheduledUnitIdxs.add(i);
          const sessions = expandUnitSessions(u, i, mod, aDue, sessionsPerUnit);
          sessions.forEach(s => { s.forAssessment = a.title; });
          console.log(`    [2]   ✅ Added ${sessions.length} sessions for unit[${i}] "${u.title}" (forAssessment="${a.title}")`);
          allOrderedItems.push(...sessions);
        });
      }

      if (incAssess) {
        if (!incDone && aDone) { console.log(`    [2]   Assessment done + incDone=false — skipping.`); return; }
        const type = (a.type || '').toLowerCase();
        const hrs = type === 'exam' ? 4 : type === 'assignment' ? 3 : type === 'quiz' ? 1 : type === 'test' ? 2 : 1.5;
        console.log(`    [2]   ✅ Adding assessment "${a.title}" | type=${type} | hours=${hrs}`);
        allOrderedItems.push({
          module: code, moduleTitle: mod.title,
          type: a.type || 'Assessment', title: a.title,
          sessionLabel: '', id: aId, due: aDue, hardDue: aDue,
          done: aDone, hours: hrs, color: mod.color || 0,
          isUnit: false,
        });
      }
    });

    if (incUnits) {
      (mod.learningUnits || []).forEach((u, i) => {
        if (scheduledUnitIdxs.has(i)) return;
        const uDone = doneTasks.includes(`${mod.code}__unit__${i}`);
        if (!incDone && uDone) { console.log(`  [2]   Unit[${i}] "${u.title}" done + incDone=false — skipping.`); return; }
        const sessions = expandUnitSessions(u, i, mod, null, sessionsPerUnit);
        console.log(`  [2]   ✅ Adding ${sessions.length} unlinked sessions for unit[${i}] "${u.title}"`);
        allOrderedItems.push(...sessions);
      });
    }

    console.groupEnd();
  });

  console.log(`[2] allOrderedItems total: ${allOrderedItems.length}`);
  console.groupEnd();

  if (!allOrderedItems.length) {
    console.error('[2] ❌ No pending items found — aborting.');
    return alert('No pending items found for the selected modules!');
  }

  // Step 3: Build available study days
  console.group('[3] Building availableDays');
  const availableDays = [];
  let cursor = new Date(today);
  while (cursor <= endDate) {
    if (studyDays.includes(cursor.getDay())) availableDays.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  console.log(`[3] availableDays count: ${availableDays.length}`);
  console.groupEnd();
  if (!availableDays.length) { console.error('[3] ❌ No study days before finish date — aborting.'); return alert('No study days available before your finish date!'); }

  // Step 4: Skeleton
  const schedule = availableDays.map(d => ({ date: new Date(d), items: [], hoursUsed: 0 }));

  // Step 5: Categorise items
  console.group('[5] Splitting items');
  const unitItems   = allOrderedItems.filter(i => i.isUnit);
  const assessItems = allOrderedItems.filter(i => !i.isUnit);
  const freeQueues   = {};
  const pinnedItems  = [];

  unitItems.forEach(item => {
    if (!freeQueues[item.module]) freeQueues[item.module] = [];
    freeQueues[item.module].push(item);
  });
  assessItems.forEach(item => {
    if (item.hardDue) { pinnedItems.push(item); }
    else { if (!freeQueues[item.module]) freeQueues[item.module] = []; freeQueues[item.module].push(item); }
  });
  console.log('[5] freeQueues lengths:', Object.fromEntries(Object.entries(freeQueues).map(([k, v]) => [k, v.length])));
  console.log('[5] pinnedItems:', pinnedItems.map(p => `${p.module} "${p.title}" due=${p.hardDue}`));
  console.groupEnd();

  const modCodes = Object.keys(freeQueues);
  pinnedItems.sort((a, b) => new Date(a.hardDue) - new Date(b.hardDue));
  const dayModules = schedule.map(() => new Set());

  // Step 6: Place pinned assessments
  console.group('[6] Placing pinned assessments');
  pinnedItems.forEach(item => {
    const dueD = new Date(item.hardDue); dueD.setHours(23, 59, 59);
    let placed = false;
    for (let i = schedule.length - 1; i >= 0; i--) {
      const ok = schedule[i].date <= dueD
              && schedule[i].hoursUsed + item.hours <= hoursDay
              && !dayModules[i].has(item.module);
      if (ok) {
        schedule[i].items.push(item); schedule[i].hoursUsed += item.hours; dayModules[i].add(item.module);
        placed = true; console.log(`  [6] ✅ Placed "${item.title}" on day[${i}] = ${schedule[i].date.toDateString()}`); break;
      }
    }
    if (!placed) {
      let fallback = schedule.length - 1;
      for (let fi = schedule.length - 1; fi >= 0; fi--) { if (schedule[fi].date <= dueD) { fallback = fi; break; } }
      schedule[fallback].items.push(item); schedule[fallback].hoursUsed += item.hours; dayModules[fallback].add(item.module);
      console.warn(`  [6] ⚠️ Fallback placed "${item.title}" on day[${fallback}]`);
    }
  });
  console.groupEnd();

  // Step 7: Round-robin free sessions
  console.group('[7] Round-robin free sessions');
  const rotation = [...modCodes]
    .filter(c => freeQueues[c]?.length > 0)
    .sort((a, b) => (freeQueues[b]?.length || 0) - (freeQueues[a]?.length || 0));
  let rotIdx  = 0;
  let totalFree = rotation.reduce((sum, c) => sum + (freeQueues[c]?.length || 0), 0);
  console.log(`[7] rotation: ${rotation.join(', ')} | totalFree: ${totalFree}`);

  for (let dayIdx = 0; dayIdx < schedule.length && totalFree > 0; dayIdx++) {
    const day = schedule[dayIdx];
    const slotsAvailable = Math.max(0, Math.floor((hoursDay - day.hoursUsed) / 2));
    if (slotsAvailable === 0) continue;
    let slotsPlaced = 0, skips = 0;
    while (slotsPlaced < slotsAvailable && skips < rotation.length) {
      const code = rotation[rotIdx % rotation.length]; rotIdx++;
      const queue = freeQueues[code];
      if (!queue || queue.length === 0) { skips++; continue; }
      if (dayModules[dayIdx].has(code)) { skips++; continue; }
      skips = 0;
      dayModules[dayIdx].add(code);
      const item = queue.shift(); totalFree--;
      day.items.push(item); day.hoursUsed += item.hours; slotsPlaced++;
    }
  }
  console.groupEnd();

  // Step 8: Overflow
  console.group('[8] Overflow');
  const overflowItems = [];
  modCodes.forEach(code => { while (freeQueues[code]?.length > 0) overflowItems.push(freeQueues[code].shift()); });
  if (overflowItems.length > 0) {
    let oi = 0;
    for (let pass = 0; pass < 10 && oi < overflowItems.length; pass++) {
      for (let di = 0; di < schedule.length && oi < overflowItems.length; di++) {
        const item = overflowItems[oi];
        if (!dayModules[di].has(item.module) && schedule[di].hoursUsed + item.hours <= hoursDay + 2) {
          schedule[di].items.push(item); schedule[di].hoursUsed += item.hours; dayModules[di].add(item.module); oi++;
        }
      }
    }
    while (oi < overflowItems.length) {
    // Spread remaining overflow across all days instead of dumping on last day
    let placed = false;
    for (let di = 0; di < schedule.length; di++) {
      if (schedule[di].hoursUsed + overflowItems[oi].hours <= hoursDay) {
        schedule[di].items.push(overflowItems[oi]);
        schedule[di].hoursUsed += overflowItems[oi].hours;
        dayModules[di].add(overflowItems[oi].module);
        placed = true;
        oi++;
        break;
      }
  }
  // If truly no day has room, skip it rather than blow out a day's hours
  if (!placed) oi++;
}
  }
  console.groupEnd();

  console.groupEnd(); // generateSchedule START

  const filledDays = schedule.filter(d => d.items.length > 0);
  renderScheduleOutput(filledDays, allOrderedItems, endDateVal, hoursDay);
}

// ── Render schedule output ───────────────────────────────────
function renderScheduleOutput(days,allItems,endDate,hoursDay){
  if(!isOpeningSavedSchedule){
    savedScheduleSettings={
      endDate,hoursDay,
      studyDays:Array.from(document.querySelectorAll('.day-picker input[type=checkbox]')).filter(c=>c.checked).map(c=>parseInt(c.value)),
      selectedMods:Array.from(document.querySelectorAll('.sched-mod-cb')).filter(c=>c.checked).map(c=>c.value),
      incUnits:document.getElementById('inc-units')?.checked??true,
      incAssess:document.getElementById('inc-assessments')?.checked??true,
      incDone:document.getElementById('inc-done')?.checked??false,
    };
    saveScheduleToStorage(days,allItems,endDate,hoursDay,savedScheduleSettings);
    const savedRecord=saveScheduleRecord(days,allItems,endDate,hoursDay,savedScheduleSettings);
    renderSavedSchedules(); saveScheduleToBackend(savedRecord);
  }

  document.getElementById('sched-form').style.display='none';
  const out=document.getElementById('sched-output'); out.style.display='block';
  const today=new Date(); today.setHours(0,0,0,0);

  const missedItems=[];
  days.forEach(day=>{const d=new Date(day.date);d.setHours(0,0,0,0);if(d<today)day.items.forEach(item=>{if(!doneTasks.includes(item.id))missedItems.push(item);});});

  const unitIds    = new Set(allItems.filter(i=>i.isUnit).map(i=>i.id));
  const totalHours = Math.round(allItems.reduce((s,i)=>s+i.hours,0));
  const totalDays  = days.length;
  const modules    = [...new Set(allItems.map(i=>i.module))].length;
  const assessments= allItems.filter(i=>!i.isUnit).length;
  const units      = unitIds.size;

  document.getElementById('sched-output-title').textContent=
    `Study plan — finish by ${new Date(endDate).toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})}`;

  const missedBanner=missedItems.length>0?`
    <div class="missed-banner">
      <div class="missed-banner-left">
        <span class="missed-banner-icon">⚠️</span>
        <div>
          <div class="missed-banner-title">${missedItems.length} item${missedItems.length!==1?'s':''} not completed from past days</div>
          <div class="missed-banner-sub">These will be rescheduled from today if you click the button →</div>
        </div>
      </div>
      <button class="btn-primary missed-reschedule-btn" onclick="rescheduleFromToday()">Reschedule missed items</button>
    </div>`:`<div class="on-track-banner">✅ You're on track — no missed items!</div>`;

  document.querySelectorAll('.missed-banner,.on-track-banner').forEach(el=>el.remove());
  document.getElementById('sched-output').insertAdjacentHTML('afterbegin',missedBanner);

  document.getElementById('sched-stats').innerHTML=`
    <div class="stat-card"><div class="stat-label">Study days</div><div class="stat-value">${totalDays}</div></div>
    <div class="stat-card"><div class="stat-label">Total hours</div><div class="stat-value">${totalHours}</div></div>
    <div class="stat-card"><div class="stat-label">Modules</div><div class="stat-value">${modules}</div></div>
    <div class="stat-card"><div class="stat-label">Units to study</div><div class="stat-value">${units}</div></div>
    <div class="stat-card"><div class="stat-label">Assessments</div><div class="stat-value">${assessments}</div></div>
    ${missedItems.length>0
      ?`<div class="stat-card"><div class="stat-label">Missed</div><div class="stat-value" style="color:#c0392b">${missedItems.length}</div></div>`
      :`<div class="stat-card"><div class="stat-label">Hrs/day</div><div class="stat-value">${hoursDay}</div></div>`}
  `;

  const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  let lastMonth=-1,html='';

  days.forEach(day=>{
    const d=new Date(day.date); d.setHours(0,0,0,0);
    const month=d.getMonth();
    if(month!==lastMonth){html+=`<div class="sched-month-header">${monthNames[month]} ${d.getFullYear()}</div>`;lastMonth=month;}
    const isToday=d.getTime()===today.getTime(), isPast=d<today;
    const dayName=d.toLocaleDateString('en-ZA',{weekday:'long'});
    const dayStr=d.toLocaleDateString('en-ZA',{day:'numeric',month:'short'});
    const hrs=Math.round(day.hoursUsed*10)/10;

    let dayStatus='',dayClass=isToday?'sched-day-today':'';
    if(isPast){
      const uniqueIds=[...new Set(day.items.map(i=>i.id))];
      const dc=uniqueIds.filter(id=>doneTasks.includes(id)).length;
      const ti=uniqueIds.length;
      if(dc===ti){dayStatus=`<span class="day-status day-status-done">✅ All done</span>`;dayClass='sched-day-completed';}
      else if(dc>0){dayStatus=`<span class="day-status day-status-partial">⚠️ ${dc}/${ti} done</span>`;dayClass='sched-day-partial';}
      else{dayStatus=`<span class="day-status day-status-missed">❌ Missed</span>`;dayClass='sched-day-missed';}
    }

    const byMod={};
    day.items.forEach(item=>{if(!byMod[item.module])byMod[item.module]={title:item.moduleTitle,color:item.color,items:[]};byMod[item.module].items.push(item);});

    const modBlocks=Object.entries(byMod).map(([code,group])=>{
      const c=col(group.color);
      const rows=group.items.map(item=>{
        const isDone = doneTasks.includes(item.id);
        const typeIcon=item.isUnit?'📖':item.type==='Assignment'?'📝':item.type==='Quiz'?'📋':item.type==='Exam'?'🎓':item.type==='Test'?'🖊':'✅';
        const sessionTag=item.isUnit&&item.sessionLabel?`<span class="sched-session-label">Session ${item.sessionLabel}</span>`:'';
        const dueTag=item.hardDue&&!item.isUnit?`<span class="sched-due">Due ${new Date(item.hardDue).toLocaleDateString('en-ZA',{day:'numeric',month:'short'})}</span>`:'';
        const prepTag=item.isUnit&&item.forAssessment?`<span class="sched-prep">for: ${item.forAssessment}</span>`:'';
        const missedTag=isPast&&!isDone?`<span class="sched-missed-tag">not done</span>`:'';
        return `<div class="sched-item ${item.isUnit?'sched-item-unit':'sched-item-assess'} ${isDone?'sched-item-done':''}">
          <div class="${isDone?'sched-tick checked':'sched-tick'}" onclick="schedToggleDone('${item.id}')" title="Mark as done"></div>
          <span class="sched-item-icon">${typeIcon}</span>
          <div class="sched-item-body">
            <span class="sched-item-title">${item.title}</span>
            <div class="sched-item-meta-row">${sessionTag}${prepTag}${dueTag}${missedTag}</div>
          </div>
          <span class="sched-item-type">${item.type}</span>
          <span class="sched-item-hrs">${item.hours}h</span>
        </div>`;
      }).join('');
      return `<div class="sched-mod-block" style="border-left:3px solid ${c.accent}">
        <div class="sched-mod-block-header" style="color:${c.text};background:${c.bg}">
          <span style="font-weight:700">${code}</span>
          <span style="font-size:12px;margin-left:8px;">${group.title}</span>
        </div>${rows}
      </div>`;
    }).join('');

    html+=`<div class="sched-day ${dayClass}">
      <div class="sched-day-header">
        <div class="sched-day-date"><span class="sched-day-name">${dayName}</span><span class="sched-day-num">${dayStr}</span></div>
        <div style="display:flex;align-items:center;gap:10px;">${dayStatus}<div class="sched-day-meta">${day.items.length} items · ${hrs}h</div></div>
      </div>
      <div class="sched-day-body">${modBlocks}</div>
    </div>`;
  });

  document.getElementById('sched-days').innerHTML=html;
  out.scrollIntoView({behavior:'smooth',block:'start'});
}

// ── Schedule tick-off ─────────────────────────────────────────
function schedToggleDone(id) {
  if (doneTasks.includes(id)) { doneTasks = doneTasks.filter(x => x !== id); }
  else { doneTasks.push(id); }

  const sessionMatch = id.match(/^(.+__unit__\d+)__session__(\d+)$/);
  if (sessionMatch) {
    const unitId = sessionMatch[1];
    const saved = loadScheduleFromStorage();
    const allSessions = (saved?.allItems || []).filter(i => i.unitId === unitId);
    const total = allSessions.length;
    const doneSessions = allSessions.filter(i => doneTasks.includes(i.id)).length;
    if (doneSessions === total && total > 0) {
      if (!doneTasks.includes(unitId)) doneTasks.push(unitId);
    } else {
      doneTasks = doneTasks.filter(x => x !== unitId);
    }
  }

  localStorage.setItem('doneTasks', JSON.stringify(doneTasks));
  rescheduleCurrentView();
  renderDashboard();
  if (activeModule) renderModuleDetail(activeModule);
  updateModuleFilter();
}

// ── Reschedule helpers ────────────────────────────────────────
function rescheduleFromToday(){
  document.querySelectorAll('.missed-banner,.on-track-banner').forEach(el=>el.remove());
  if(!savedScheduleSettings){generateSchedule();return;}
  document.getElementById('sched-end-date').value=savedScheduleSettings.endDate;
  document.getElementById('sched-hours').value=savedScheduleSettings.hoursDay;
  document.getElementById('sched-hours-val').textContent=savedScheduleSettings.hoursDay;
  document.querySelectorAll('.day-picker input[type=checkbox]').forEach(cb=>{cb.checked=savedScheduleSettings.studyDays.includes(parseInt(cb.value));});
  initSchedulePage();
  setTimeout(()=>{
    document.querySelectorAll('.sched-mod-cb').forEach(cb=>{cb.checked=savedScheduleSettings.selectedMods.includes(cb.value);});
    document.getElementById('inc-units').checked=savedScheduleSettings.incUnits;
    document.getElementById('inc-assessments').checked=savedScheduleSettings.incAssess;
    document.getElementById('inc-done').checked=false;
    document.getElementById('sched-output').style.display='none';
    generateSchedule();
  },50);
}

function rescheduleCurrentView(){
  if(!savedScheduleSettings) return;
  document.querySelectorAll('.missed-banner,.on-track-banner').forEach(el=>el.remove());
  rescheduleFromToday();
}

function resetSchedule(){
  document.querySelectorAll('.missed-banner,.on-track-banner').forEach(el=>el.remove());
  savedScheduleSettings=null; savedScheduleData=null;
  document.getElementById('sched-form').style.display='block';
  document.getElementById('sched-output').style.display='none';
  document.getElementById('sched-days').innerHTML='';
  document.getElementById('sched-stats').innerHTML='';
}
