// ============================================================
// UNISA Study Tracker — app.js
// ============================================================

let customTasks = JSON.parse(localStorage.getItem('customTasks') || '[]');
let doneTasks   = JSON.parse(localStorage.getItem('doneTasks')   || '[]');
let isOpeningSavedSchedule = false;

let calMonth       = new Date(); calMonth.setDate(1);
let moduleCalMonth = new Date(); moduleCalMonth.setDate(1);
let activeModule   = null;
let activeInner    = 'about';



const MODULE_COLORS = [
  { bg:'#eaf2fb', text:'#1a5fa8', accent:'#378ADD' },  // blue
  { bg:'#edf7ee', text:'#2e7d32', accent:'#639922' },  // green
  { bg:'#fdf4e7', text:'#b8650a', accent:'#EF9F27' },  // orange
  { bg:'#f3eefb', text:'#5e35b1', accent:'#7c4dff' },  // purple
  { bg:'#fdf0ee', text:'#b71c1c', accent:'#E24B4A' },  // red
  { bg:'#e8f7f5', text:'#00695c', accent:'#1D9E75' },  // teal
  { bg:'#fff8e1', text:'#f57f17', accent:'#FBC02D' },  // yellow
  { bg:'#fce4ec', text:'#880e4f', accent:'#E91E8C' },  // pink
  { bg:'#e8eaf6', text:'#283593', accent:'#3F51B5' },  // indigo
];

const col = i => MODULE_COLORS[i % MODULE_COLORS.length];

const API_BASE = '';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try { const data = await res.json(); if (data && data.error) message = data.error; } catch (_) {}
    throw new Error(message);
  }
  return res.json();
}

// ── Build flat task list ──────────────────────────────────
// Reads from ALL possible field names UNISA modules use.
// Skips generic single-word junk titles. Deduplicates within each module.
function buildAllTasks() {
  const list = [];

  const TASK_FIELDS = ['assessments', 'tasks', 'lessons', 'classes',
                       'exercises', 'activities', 'practicals', 'workshops'];

  const SKIP_TITLES = new Set([
    'assessment', 'exam', 'test', 'quiz', 'assignment', 'task', 'lesson',
    'class', 'exercise', 'activity', 'practical', 'workshop',
    'ASSESSMENT', 'ASSESSMENT 9', 'Assessment', 'Exam', 'Test',
    'Quiz', 'Assignment', 'Task', 'Lesson', 'Class',
  ]);

  MODULE_DATA.forEach(mod => {
    const seen = new Set();
    TASK_FIELDS.forEach(field => {
      (mod[field] || []).forEach(a => {
        const titleKey = (a.title || '').trim();
        if (!titleKey) return;
        if (SKIP_TITLES.has(titleKey)) return;
        const dedupKey = `${mod.code}::${titleKey.toLowerCase()}`;
        if (seen.has(dedupKey)) return;
        seen.add(dedupKey);
        const due = a.due || a.closes || null;
        list.push({
          id: `${mod.code}__${titleKey}`, title: titleKey, module: mod.code,
          type: a.type || 'Assessment', due, note: a.note || '',
          done: doneTasks.includes(`${mod.code}__${titleKey}`), custom: false,
        });
      });
    });
  });

  customTasks.forEach(t => list.push({ ...t, done: doneTasks.includes(t.id), custom: true }));
  return list;
}

function allTasks() { return buildAllTasks(); }

// ── Persistence ───────────────────────────────────────────
function toggleDone(id) {
  if (doneTasks.includes(id)) doneTasks = doneTasks.filter(x => x !== id);
  else doneTasks.push(id);
  localStorage.setItem('doneTasks', JSON.stringify(doneTasks));
  refreshAll();
}

function deleteCustomTask(id) {
  if (!confirm('Delete this task?')) return;
  customTasks = customTasks.filter(t => t.id !== id);
  localStorage.setItem('customTasks', JSON.stringify(customTasks));
  refreshAll();
}

function clearCustomData() {
  if (!confirm('Clear all custom tasks and completion states?')) return;
  customTasks = []; doneTasks = [];
  localStorage.removeItem('customTasks');
  localStorage.removeItem('doneTasks');
  refreshAll();
}

function refreshAll() {
  renderDashboard();
  if (document.getElementById('tab-tasks').classList.contains('active')) renderTasks();
  if (document.getElementById('tab-modules').classList.contains('active')) renderModules();
  if (document.getElementById('tab-calendar').classList.contains('active')) renderCalendar();
  if (document.getElementById('tab-module-detail').classList.contains('active') && activeModule)
    renderModuleDetail(activeModule);
  updateModuleFilter();
  renderSavedSchedules();
}

// ── Navigation ────────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => { e.preventDefault(); showTab(link.dataset.tab); });
});

function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.tab === tab || (tab === 'module-detail' && l.dataset.tab === 'modules'));
  });
  const el = document.getElementById('tab-' + tab);
  if (el) el.classList.add('active');
  if (tab === 'dashboard') renderDashboard();
  if (tab === 'modules')   renderModules();
  if (tab === 'tasks')     renderTasks();
  if (tab === 'calendar')  renderCalendar();
  if (tab === 'upload')    populateManualModuleSelect();
  if (tab === 'schedule')  initSchedulePage();
}

function showInnerTab(name) {
  activeInner = name;
  document.querySelectorAll('.inner-tab').forEach((b, i) => {
    b.classList.toggle('active', ['about','units','assessments','modcal','resources'][i] === name);
  });
  document.querySelectorAll('.inner-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('inner-' + name);
  if (panel) panel.classList.add('active');
  if (name === 'modcal' && activeModule) renderModuleCalendar(activeModule);
  if (name === 'resources' && activeModule && typeof renderResourcesPanel === 'function') renderResourcesPanel(activeModule);
}

// ── Urgency helpers ───────────────────────────────────────
function getUrgency(due, done) {
  if (done) return 'done';
  if (!due)  return 'none';
  const now  = new Date(); now.setHours(0,0,0,0);
  const diff = (new Date(due) - now) / 86400000;
  if (diff < 0)   return 'overdue';
  if (diff <= 7)  return 'soon';
  if (diff <= 21) return 'upcoming';
  return 'later';
}

const DOT_COLORS = { overdue:'#c0392b', soon:'#e67e22', upcoming:'#2e7d32', later:'#1a5fa8', none:'#bbb', done:'#bbb' };
const BADGE_CLS  = { overdue:'badge-red', soon:'badge-amber', upcoming:'badge-green', later:'badge-blue', done:'', none:'' };

function urgencyBadge(due, done) {
  if (!due || done) return '';
  const u = getUrgency(due, done);
  const d = new Date(due).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' });
  return `<span class="badge ${BADGE_CLS[u] || 'badge-blue'}">${u === 'overdue' ? 'Overdue' : 'Due'} ${d}</span>`;
}

function taskCard(task, showMod = true) {
  const u = getUrgency(task.due, task.done);
  const meta = showMod ? `${task.module} · ${task.type}` : task.type;
  const delBtn = task.custom ? `<button class="del-btn" onclick="deleteCustomTask('${task.id}')" title="Delete">&#10005;</button>` : '';
  return `<div class="item-card ${task.done ? 'done' : ''}">
    <div class="checkbox ${task.done ? 'checked' : ''}" onclick="toggleDone('${task.id}')"></div>
    <div class="dot" style="background:${DOT_COLORS[u]};flex-shrink:0;margin-top:5px;"></div>
    <div class="item-body">
      <div class="item-title">${task.title}</div>
      <div class="item-meta">${meta}</div>
      ${urgencyBadge(task.due, task.done)}
      ${task.note ? `<div class="item-note">${task.note}</div>` : ''}
    </div>
    ${delBtn}
  </div>`;
}

// ── Dashboard ─────────────────────────────────────────────
function renderDashboard() {
  const tasks = allTasks();
  const now   = new Date(); now.setHours(0,0,0,0);
  const week  = new Date(now); week.setDate(now.getDate() + 7);
  const sixty = new Date(now); sixty.setDate(now.getDate() + 60);
  const pending  = tasks.filter(t => !t.done);
  const overdue  = pending.filter(t => t.due && new Date(t.due) < now);
  const soon     = pending.filter(t => t.due && new Date(t.due) >= now && new Date(t.due) <= week);
  const upcoming = pending.filter(t => t.due && new Date(t.due) > week && new Date(t.due) <= sixty);
  const done     = tasks.filter(t => t.done);

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card"><div class="stat-label">Modules</div><div class="stat-value">${MODULE_DATA.length}</div></div>
    <div class="stat-card"><div class="stat-label">Total tasks</div><div class="stat-value">${tasks.length}</div></div>
    <div class="stat-card"><div class="stat-label">Overdue</div><div class="stat-value" style="color:#c0392b">${overdue.length}</div></div>
    <div class="stat-card"><div class="stat-label">Due this week</div><div class="stat-value" style="color:#e67e22">${soon.length}</div></div>
    <div class="stat-card"><div class="stat-label">Completed</div><div class="stat-value" style="color:#2e7d32">${done.length}</div></div>
    <div class="stat-card"><div class="stat-label">Remaining</div><div class="stat-value">${pending.length}</div></div>
  `;
  const sort = arr => arr.sort((a, b) => new Date(a.due) - new Date(b.due));
  const el   = id  => document.getElementById(id);
  el('overdue-list').innerHTML  = overdue.length  ? sort(overdue).map(t => taskCard(t)).join('')  : '<div class="empty">No overdue tasks 🎉</div>';
  el('due-soon-list').innerHTML = soon.length     ? sort(soon).map(t => taskCard(t)).join('')     : '<div class="empty">Nothing due this week</div>';
  el('upcoming-list').innerHTML = upcoming.length ? sort(upcoming).map(t => taskCard(t)).join('') : '<div class="empty">Nothing in the next 60 days</div>';
}

// ── Modules list ──────────────────────────────────────────
function renderModules() {
  const tasks = allTasks();
  const el    = document.getElementById('modules-grid');
  el.innerHTML = MODULE_DATA.map((mod, idx) => {
    const c        = col(mod.color !== undefined ? mod.color : idx);
    const modTasks = tasks.filter(t => t.module === mod.code);
    const total    = modTasks.length;
    const done     = modTasks.filter(t => t.done).length;
    const now      = new Date(); now.setHours(0,0,0,0);
    const overdue  = modTasks.filter(t => !t.done && t.due && new Date(t.due) < now).length;
    const pct      = total ? Math.round(done / total * 100) : 0;
    const next     = modTasks.filter(t => !t.done && t.due).sort((a, b) => new Date(a.due) - new Date(b.due))[0];
    const nextStr  = next ? `Next: ${new Date(next.due).toLocaleDateString('en-ZA', { day:'numeric', month:'short' })} — ${next.title}` : 'No upcoming deadlines';
    return `<div class="module-card" onclick="openModule('${mod.code}')">
      <div class="module-card-icon" style="background:${c.bg};color:${c.text}">${mod.code.substring(0,3)}</div>
      <div class="module-card-body">
        <div class="module-card-code">${mod.code}</div>
        <div class="module-card-name">${mod.title}</div>
        <div class="module-card-period">${mod.period}</div>
        <div class="module-card-meta">${total} tasks · ${done} done${overdue ? ` · <span style="color:#c0392b">${overdue} overdue</span>` : ''}</div>
        <div class="module-card-next">${nextStr}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${c.accent}"></div></div>
        <div class="progress-label">${pct}% complete</div>
      </div>
      <div class="module-card-arrow">›</div>
    </div>`;
  }).join('');
}

// ── Module detail ─────────────────────────────────────────
function openModule(code) {
  activeModule = code;
  moduleCalMonth = new Date(); moduleCalMonth.setDate(1);
  activeInner = 'about';
  renderModuleDetail(code);
  showTab('module-detail');
  document.querySelectorAll('.inner-tab').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.querySelectorAll('.inner-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('inner-about').classList.add('active');
}

function goBackToModules() { activeModule = null; showTab('modules'); }

function renderModuleDetail(code) {
  const mod = MODULE_DATA.find(m => m.code === code);
  if (!mod) return;
  const c       = col(mod.color || 0);
  const tasks   = allTasks().filter(t => t.module === code);
  const now     = new Date(); now.setHours(0,0,0,0);
  const done    = tasks.filter(t => t.done).length;
  const overdue = tasks.filter(t => !t.done && t.due && new Date(t.due) < now).length;
  const week    = new Date(now); week.setDate(now.getDate() + 7);
  const soon    = tasks.filter(t => !t.done && t.due && new Date(t.due) >= now && new Date(t.due) <= week).length;
  const unitsDoneCount = (mod.learningUnits || []).filter((_, i) => doneTasks.includes(`${code}__unit__${i}`)).length;

  document.getElementById('hero-code').textContent   = mod.code;
  document.getElementById('hero-code').style.cssText = `background:${c.bg};color:${c.text}`;
  document.getElementById('hero-title').textContent  = mod.title;
  document.getElementById('hero-meta').innerHTML     =
    `<span>${mod.period}</span>${mod.lecturer ? `<span> · ${mod.lecturer}</span>` : ''}${mod.email ? `<span> · <a href="mailto:${mod.email}" style="color:${c.text}">${mod.email}</a></span>` : ''}`;

  document.getElementById('module-stats-grid').innerHTML = `
    <div class="stat-card"><div class="stat-label">Assessments</div><div class="stat-value">${tasks.length}</div></div>
    <div class="stat-card"><div class="stat-label">Assessments done</div><div class="stat-value" style="color:#2e7d32">${done}</div></div>
    <div class="stat-card"><div class="stat-label">Units studied</div><div class="stat-value" style="color:#1a5fa8">${unitsDoneCount} / ${(mod.learningUnits || []).length}</div></div>
    <div class="stat-card"><div class="stat-label">Due this week</div><div class="stat-value" style="color:#e67e22">${soon}</div></div>
    <div class="stat-card"><div class="stat-label">Overdue</div><div class="stat-value" style="color:#c0392b">${overdue}</div></div>
  `;

  const paras = (mod.description || '').split('\n\n').filter(Boolean);
  document.getElementById('about-desc').innerHTML = paras.map(p => `<p class="about-para">${p}</p>`).join('');
  document.getElementById('about-sidebar').innerHTML = `
    <div class="info-card">
      <div class="info-row"><span class="info-label">Module code</span><span class="info-val">${mod.code}</span></div>
      <div class="info-row"><span class="info-label">Period</span><span class="info-val">${mod.period}</span></div>
      ${mod.lecturer    ? `<div class="info-row"><span class="info-label">Lecturer</span><span class="info-val">${mod.lecturer}</span></div>` : ''}
      ${mod.email       ? `<div class="info-row"><span class="info-label">Email</span><span class="info-val"><a href="mailto:${mod.email}">${mod.email}</a></span></div>` : ''}
      ${mod.tel         ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-val">${mod.tel}</span></div>` : ''}
      ${mod.consultation? `<div class="info-row"><span class="info-label">Consultations</span><span class="info-val">${mod.consultation}</span></div>` : ''}
      <div class="info-row"><span class="info-label">Assessments</span><span class="info-val">${(mod.assessments || []).length + (mod.tasks || []).length}</span></div>
      <div class="info-row"><span class="info-label">Learning units</span><span class="info-val">${(mod.learningUnits || []).length}</span></div>
    </div>`;

  const units     = mod.learningUnits || [];
  const unitsDone = units.filter((_, i) => doneTasks.includes(`${mod.code}__unit__${i}`)).length;
  const unitsPct  = units.length ? Math.round(unitsDone / units.length * 100) : 0;

  const unitsHtml = units.length ? `
    <div class="bulk-bar">
      <span class="bulk-label">${unitsDone} / ${units.length} units studied &nbsp;·&nbsp; ${unitsPct}%</span>
      <div class="bulk-actions">
        <button class="bulk-btn" onclick="markAllUnits('${mod.code}', true)">✓ Mark all studied</button>
        <button class="bulk-btn bulk-btn-clear" onclick="markAllUnits('${mod.code}', false)">✕ Clear all</button>
      </div>
    </div>
    <div class="unit-progress-bar" style="margin-bottom:1.2rem;">
      <div class="unit-progress-fill" style="width:${unitsPct}%;background:${c.accent}"></div>
    </div>
    ` + units.map((u, i) => {
      const uid      = `${mod.code}__unit__${i}`;
      const doneUnit = doneTasks.includes(uid);
      return `<div class="unit-card ${doneUnit ? 'unit-done' : ''}">
        <div class="unit-check-wrap">
          <div class="checkbox ${doneUnit ? 'checked' : ''}" onclick="toggleDone('${uid}')" title="${doneUnit ? 'Mark as not done' : 'Mark as studied'}"></div>
        </div>
        <div class="unit-num" style="background:${c.bg};color:${c.text}">${i + 1}</div>
        <div class="unit-body">
          <div class="unit-title">${u.title}</div>
          <div class="unit-desc">${u.description}</div>
        </div>
      </div>`;
    }).join('')
  : '<div class="empty">No learning units listed</div>';
  document.getElementById('units-list').innerHTML = unitsHtml;

  // Assessments tab — read from all task field names
  const TASK_FIELDS = ['assessments', 'tasks', 'lessons', 'classes',
                       'exercises', 'activities', 'practicals', 'workshops'];
  const allA = [];
  const seenTitles = new Set();
  TASK_FIELDS.forEach(field => {
    (mod[field] || []).forEach(a => {
      const t = (a.title || '').trim();
      if (!t || seenTitles.has(t.toLowerCase())) return;
      seenTitles.add(t.toLowerCase());
      allA.push(a);
    });
  });

  const assessDone = allA.filter(a => doneTasks.includes(`${mod.code}__${a.title}`)).length;
  const assessPct  = allA.length ? Math.round(assessDone / allA.length * 100) : 0;

  const assessHtml = allA.length ? `
    <div class="bulk-bar">
      <span class="bulk-label">${assessDone} / ${allA.length} assessments done &nbsp;·&nbsp; ${assessPct}%</span>
      <div class="bulk-actions">
        <button class="bulk-btn" onclick="markAllAssessments('${mod.code}', true)">✓ Mark all done</button>
        <button class="bulk-btn bulk-btn-clear" onclick="markAllAssessments('${mod.code}', false)">✕ Clear all</button>
      </div>
    </div>
    <div class="unit-progress-bar" style="margin-bottom:1.2rem;">
      <div class="unit-progress-fill" style="width:${assessPct}%;background:${c.accent}"></div>
    </div>
    ` + allA.map(a => {
      const id     = `${mod.code}__${a.title}`;
      const isDone = doneTasks.includes(id);
      const due    = a.due || a.closes || null;
      const u      = getUrgency(due, isDone);
      const openedStr = a.opened ? `Opened: ${new Date(a.opened).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}` : '';
      const dueStr    = due      ? `Due: ${new Date(due).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}` : '';
      return `<div class="item-card ${isDone ? 'done' : ''}">
        <div class="checkbox ${isDone ? 'checked' : ''}" onclick="toggleDone('${id}')"></div>
        <div class="dot" style="background:${DOT_COLORS[u]};flex-shrink:0;margin-top:5px;"></div>
        <div class="item-body">
          <div class="item-title">${a.title}</div>
          <div class="item-meta">${a.type}${openedStr ? ' · ' + openedStr : ''}${dueStr ? ' · ' + dueStr : ''}</div>
          ${urgencyBadge(due, isDone)}
          ${a.note ? `<div class="item-note">${a.note}</div>` : ''}
        </div>
      </div>`;
    }).join('')
  : '<div class="empty">No assessments listed</div>';
  document.getElementById('module-assessments-list').innerHTML = assessHtml;
  renderModuleCalendar(code);
}

function renderModuleCalendar(code) {
  const y = moduleCalMonth.getFullYear();
  const m = moduleCalMonth.getMonth();
  document.getElementById('module-cal-label').textContent =
    moduleCalMonth.toLocaleDateString('en-ZA', { month:'long', year:'numeric' });
  renderCalGrid('module-cal-grid', y, m, allTasks().filter(t => t.module === code), false);
}

function changeModuleMonth(dir) {
  moduleCalMonth.setMonth(moduleCalMonth.getMonth() + dir);
  if (activeModule) renderModuleCalendar(activeModule);
}

// ── All Tasks ─────────────────────────────────────────────
function renderTasks() {
  const modFilter    = document.getElementById('filter-module').value;
  const typeFilter   = document.getElementById('filter-type').value;
  const statusFilter = document.getElementById('filter-status').value;
  const now = new Date(); now.setHours(0,0,0,0);
  let filtered = allTasks().filter(t => {
    if (modFilter    && t.module !== modFilter) return false;
    if (typeFilter   && t.type   !== typeFilter) return false;
    if (statusFilter === 'done'    && !t.done) return false;
    if (statusFilter === 'pending' &&  t.done) return false;
    if (statusFilter === 'overdue' && (t.done || !t.due || new Date(t.due) >= now)) return false;
    return true;
  });
  filtered.sort((a, b) => { if (a.due && b.due) return new Date(a.due) - new Date(b.due); if (a.due) return -1; if (b.due) return 1; return 0; });
  document.getElementById('tasks-list').innerHTML = filtered.length
    ? filtered.map(t => taskCard(t, true)).join('')
    : '<div class="empty">No tasks match these filters</div>';
}

function updateModuleFilter() {
  const sel = document.getElementById('filter-module');
  const cur = sel.value;
  sel.innerHTML = '<option value="">All modules</option>' +
    MODULE_DATA.map(m => `<option value="${m.code}" ${m.code === cur ? 'selected' : ''}>${m.code} — ${m.title}</option>`).join('');
}

function populateManualModuleSelect() {
  const sel = document.getElementById('manual-module-select');
  sel.innerHTML = '<option value="">Select module</option>' +
    MODULE_DATA.map(m => `<option value="${m.code}">${m.code} — ${m.title}</option>`).join('');
}

// ── Bulk mark helpers ─────────────────────────────────────
function markAllUnits(code, markDone) {
  const mod = MODULE_DATA.find(m => m.code === code);
  if (!mod) return;
  (mod.learningUnits || []).forEach((_, i) => {
    const uid = `${code}__unit__${i}`;
    if (markDone && !doneTasks.includes(uid)) doneTasks.push(uid);
    if (!markDone) doneTasks = doneTasks.filter(x => x !== uid);
  });
  localStorage.setItem('doneTasks', JSON.stringify(doneTasks));
  renderModuleDetail(code); renderDashboard();
}

function markAllAssessments(code, markDone) {
  const mod = MODULE_DATA.find(m => m.code === code);
  if (!mod) return;
  const TASK_FIELDS = ['assessments', 'tasks', 'lessons', 'classes',
                       'exercises', 'activities', 'practicals', 'workshops'];
  const seenTitles = new Set();
  TASK_FIELDS.forEach(field => {
    (mod[field] || []).forEach(a => {
      const t = (a.title || '').trim();
      if (!t || seenTitles.has(t.toLowerCase())) return;
      seenTitles.add(t.toLowerCase());
      const id = `${code}__${a.title}`;
      if (markDone && !doneTasks.includes(id)) doneTasks.push(id);
      if (!markDone) doneTasks = doneTasks.filter(x => x !== id);
    });
  });
  localStorage.setItem('doneTasks', JSON.stringify(doneTasks));
  renderModuleDetail(code); renderDashboard(); refreshAll();
}

// ── Global Calendar ───────────────────────────────────────
function renderCalendar() {
  const y = calMonth.getFullYear();
  const m = calMonth.getMonth();
  document.getElementById('cal-label').textContent =
    calMonth.toLocaleDateString('en-ZA', { month:'long', year:'numeric' });
  renderCalGrid('cal-grid', y, m, allTasks(), true);
}

function renderCalGrid(gridId, y, m, tasks, showMod) {
  const first = new Date(y, m, 1).getDay();
  const days  = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  let html = '';
  for (let i = 0; i < first; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= days; d++) {
    const isToday  = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
    const dayTasks = tasks.filter(t => { if (!t.due) return false; const td = new Date(t.due); return td.getFullYear()===y && td.getMonth()===m && td.getDate()===d; });
    const events   = dayTasks.map(t => {
      const u   = getUrgency(t.due, t.done);
      const bgs = { overdue:'#fdf0ee', soon:'#fdf4e7', upcoming:'#edf7ee', later:'#eaf2fb', done:'#f5f5f5' };
      const tcs = { overdue:'#c0392b', soon:'#b8650a', upcoming:'#2e7d32', later:'#1a5fa8', done:'#999' };
      const label = showMod ? `${t.module}: ${t.title}` : t.title;
      return `<div class="cal-event" style="background:${bgs[u]||bgs.later};color:${tcs[u]||tcs.later}" title="${label}">${label}</div>`;
    }).join('');
    html += `<div class="cal-day${isToday ? ' today' : ''}"><div class="cal-day-num">${d}</div>${events}</div>`;
  }
  document.getElementById(gridId).innerHTML = html;
}

function changeMonth(dir) { calMonth.setMonth(calMonth.getMonth() + dir); renderCalendar(); }

// ── Add manual task ───────────────────────────────────────
function addManual() {
  const title  = document.getElementById('manual-title').value.trim();
  const module = document.getElementById('manual-module-select').value;
  const type   = document.getElementById('manual-type').value;
  const due    = document.getElementById('manual-due').value;
  const note   = document.getElementById('manual-note').value.trim();
  if (!title || !module) return showResult('Title and module are required', true);
  customTasks.push({ id: 'custom_' + Date.now(), title, module, type, due: due || null, note, custom: true });
  localStorage.setItem('customTasks', JSON.stringify(customTasks));
  document.getElementById('manual-title').value = '';
  document.getElementById('manual-due').value   = '';
  document.getElementById('manual-note').value  = '';
  showResult('Task added!');
  refreshAll();
}

// ── File upload state ─────────────────────────────────────
let _chosenFiles = [];

(function wireDrop() {
  document.addEventListener('DOMContentLoaded', () => {
    const zone = document.getElementById('file-drop-zone');
    if (!zone) return;
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer?.files?.length) handleFilesChosen(e.dataTransfer.files); });
  });
})();

function handleFilesChosen(fileList) {
  if (!fileList || !fileList.length) return;
  Array.from(fileList).forEach(file => { if (!_chosenFiles.find(f => f.name===file.name && f.size===file.size)) _chosenFiles.push(file); });
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

// ── MAIN: parse & upsert modules (client-side, no server needed) ─
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
      if      (ext==='html'||ext==='htm')               { html = await file.text(); }
      else if (ext==='pdf')                              { html = `<html><body><pre>${escHtml(await _extractPdf(file))}</pre></body></html>`; }
      else if (ext==='docx'||ext==='doc')                { html = `<html><body><pre>${escHtml(await _extractDocx(file))}</pre></body></html>`; }
      else if (ext==='xlsx'||ext==='xls'||ext==='ods')   { html = `<html><body><pre>${escHtml(await _extractExcel(file))}</pre></body></html>`; }
      else if (ext==='csv')                              { html = `<html><body><pre>${escHtml(await file.text())}</pre></body></html>`; }
      else if (ext==='pptx'||ext==='ppt')                { html = `<html><body><pre>${escHtml(await _extractPptx(file))}</pre></body></html>`; }
      else if (ext==='txt'||ext==='md')                  { html = `<html><body><pre>${escHtml(await file.text())}</pre></body></html>`; }
      else { r.error='Unsupported file type'; results.push(r); continue; }

      const mod = parseMyUnisaHtml(html, file.name);
      if (mod) {
        // Upsert directly into MODULE_DATA and localStorage — no server needed
        const action = upsertModuleLocally(mod);
        r.action = action; r.code = mod.code; r.title = mod.title;
      } else {
        // No module code found — try to extract loose tasks as custom tasks
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
// Merges assessments (deduplicates) and updates existing modules in-place.
// Returns 'inserted' or 'updated'.
function upsertModuleLocally(mod) {
  const SKIP_TITLES = new Set([
    'assessment','exam','test','quiz','assignment','task','lesson','class',
    'ASSESSMENT','ASSESSMENT 9','Assessment','Exam','Test','Quiz','Assignment','Task',
  ]);

  // Clean assessments: deduplicate and remove junk titles
  const cleanAssessments = [];
  const seenTitles = new Set();
  (mod.assessments || []).forEach(a => {
    const t = (a.title || '').trim();
    if (!t || SKIP_TITLES.has(t) || seenTitles.has(t.toLowerCase())) return;
    seenTitles.add(t.toLowerCase());
    cleanAssessments.push(a);
  });
  mod.assessments = cleanAssessments;

  // Check if this module already exists in MODULE_DATA
  const existingIdx = MODULE_DATA.findIndex(m => m.code === mod.code);

  if (existingIdx === -1) {
    // New module — assign a color and push
    mod.color = MODULE_DATA.length % 6;
    MODULE_DATA.push(mod);
    saveModuleOverridesToStorage();
    return 'inserted';
  } else {
    // Existing module — merge: keep existing title/description/lecturer if they look better,
    // but update assessments and learning units (merge, don't replace if parsed is empty)
    const existing = MODULE_DATA[existingIdx];

    // Only overwrite title/description if the new one looks cleaner (longer and not garbled)
    if (mod.title && mod.title.length > 10 && !mod.title.match(/^[A-Z0-9]{4,8}$/)) {
      existing.title = mod.title;
    }
    if (mod.description && mod.description.length > existing.description?.length) {
      existing.description = mod.description;
    }
    if (mod.lecturer) existing.lecturer = mod.lecturer;
    if (mod.email)    existing.email    = mod.email;
    if (mod.tel)      existing.tel      = mod.tel;

    // Merge assessments — add any new ones not already present
    const existingAssessmentTitles = new Set(
      (existing.assessments || []).map(a => a.title.toLowerCase())
    );
    (mod.assessments || []).forEach(a => {
      if (!existingAssessmentTitles.has(a.title.toLowerCase())) {
        existing.assessments = existing.assessments || [];
        existing.assessments.push(a);
        existingAssessmentTitles.add(a.title.toLowerCase());
      } else {
        // Update due date if we now have one and didn't before
        const existing_a = existing.assessments.find(x => x.title.toLowerCase() === a.title.toLowerCase());
        if (existing_a && !existing_a.due && a.due) existing_a.due = a.due;
      }
    });

    // Merge learning units — add any new ones not already present
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

// ── Persist module overrides to localStorage ─────────────────
// We store only the modules that were uploaded/modified, not the
// base modules-data.js ones (those are always loaded fresh from the file).
function saveModuleOverridesToStorage() {
  try {
    localStorage.setItem('moduleOverrides', JSON.stringify(MODULE_DATA));
  } catch(e) {
    console.warn('Could not save module overrides:', e.message);
  }
}

// ── Load module overrides from localStorage on startup ───────
// Called once at init. Merges any stored overrides into MODULE_DATA.
function loadModuleOverridesFromStorage() {
  try {
    const raw = localStorage.getItem('moduleOverrides');
    if (!raw) return;
    const overrides = JSON.parse(raw);
    if (!Array.isArray(overrides)) return;
    overrides.forEach(override => {
      const idx = MODULE_DATA.findIndex(m => m.code === override.code);
      if (idx !== -1) {
        // Merge: stored overrides win over base data for assessments/units/lecturer
        const base = MODULE_DATA[idx];
        MODULE_DATA[idx] = {
          ...base,
          ...override,
          // Always keep the AI-generated description from modules-data.js if the
          // stored one looks garbled (shorter than 50 chars or just a module code)
          description: (override.description && override.description.length > 50)
            ? override.description
            : base.description,
          // Keep base title if it's clean, otherwise use override
          title: (base.title && base.title.length > 5 && !base.title.match(/^[A-Z0-9\-]+$/))
            ? base.title
            : override.title || base.title,
        };
      } else {
        // Module not in base data — add it
        MODULE_DATA.push(override);
      }
    });
  } catch(e) {
    console.warn('Could not load module overrides:', e.message);
  }
}

// ── Extract loose tasks from non-module HTML/text ────────────
function extractLooseTasks(html) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(html, 'text/html');
  const body   = doc.body.innerText || doc.body.textContent || '';
  const tasks  = [];
  const seenA  = new Set();

  // Try to find a module code in the text to associate tasks with
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

// ── Reload MODULE_DATA — now purely from localStorage ────────
// (kept for backwards compat but no longer fetches from server)
async function reloadModuleData() {
  loadModuleOverridesFromStorage();
}

// ── Colour-coded upload result rows ──────────────────────
function renderUploadResults(results) {
  const el = document.getElementById('upload-results');
  if (!el) { showResult(results.map(r=>r.error||r.title||r.action).join(' · '),false); return; }
  el.innerHTML = results.map(r => {
    if (r.error)                        return `<div class="upload-result-row upload-result-error">✗ <strong>${r.file}</strong> — ${r.error}</div>`;
    if (r.action==='inserted')          return `<div class="upload-result-row upload-result-new">✚ <strong>${r.code}</strong> — New module added: "${r.title}"</div>`;
    if (r.action==='updated')           return `<div class="upload-result-row upload-result-updated">↻ <strong>${r.code}</strong> — Module updated: "${r.title}"</div>`;
    if (r.action==='tasks-extracted')   return `<div class="upload-result-row upload-result-tasks">✓ <strong>${r.file}</strong> — ${r.title}</div>`;
    return '';
  }).join('');
  el.style.display='block';
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ── Result banner & helpers ───────────────────────────────
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

// ── CDN extraction helpers ────────────────────────────────
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

// ── Init ──────────────────────────────────────────────────
// Load any uploaded module overrides from localStorage before first render
loadModuleOverridesFromStorage();
updateModuleFilter();
renderDashboard();
renderModules();
renderCalendar();

// ============================================================
// SCHEDULE GENERATOR
// ============================================================

let savedScheduleSettings = JSON.parse(localStorage.getItem('schedSettings')||'null');
let savedScheduleData     = JSON.parse(localStorage.getItem('savedStudySchedule')||'null');

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
  const schedules=getSavedSchedules();
  const sd=serializeScheduleDays(days);
  const sig=JSON.stringify({endDate,hoursDay,settings,days:sd,allItems});
  const ei=schedules.findIndex(s=>JSON.stringify({endDate:s.endDate,hoursDay:s.hoursDay,settings:s.settings,days:s.days||[],allItems:s.allItems||[]})===sig);
  if(ei!==-1) return schedules[ei];
  const record={id:`sched_${Date.now()}`,savedAt:new Date().toISOString(),endDate,hoursDay,days:sd,settings};
  schedules.unshift(record);
  if (schedules.length > 3) schedules = schedules.slice(0, 3); // keep only 3 most recent
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

function initSchedulePage(){
  const list=document.getElementById('sched-module-list'); if(!list) return;
  list.innerHTML=MODULE_DATA.map(mod=>{
    const c=col(mod.color||0);
    const TASK_FIELDS=['assessments','tasks','lessons','classes','exercises','activities','practicals','workshops'];
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

// ── Sessions per unit: 6 months ÷ unit count ─────────────
// Formula: (26 weeks × 6h/week) ÷ unitCount ÷ 2h per session
// Example: COS3761 has 3 units → 26 sessions each = ~2 months per unit ✓
const UNIT_SESSIONS = {
  "FYE1500":  9,   // 9 units  → 9  sessions × 2h = 18h/unit
  "APM1513": 13,   // 6 units  → 13 sessions × 2h = 26h/unit
  "APM2616":  9,   // 9 units  → 9  sessions × 2h = 18h/unit
  "COS1521":  6,   // 14 units → 6  sessions × 2h = 12h/unit
  "COS2611": 20,   // 4 units  → 20 sessions × 2h = 40h/unit
  "COS2614":  8,   // 10 units → 8  sessions × 2h = 16h/unit
  "COS3751":  9,   // 9 units  → 9  sessions × 2h = 18h/unit
  "COS3761": 26,   // 3 units  → 26 sessions × 2h = 52h/unit
  "MAT2612": 16,   // 5 units  → 16 sessions × 2h = 32h/unit
};

// Skip assessments that shouldn't appear in the schedule yet.
// Exams with no due date = Oct/Nov — only show if end date > 1 Sep.
function shouldScheduleAssessment(a, today, endDate) {
  const type = (a.type || '').toLowerCase();
  const due  = a.due || a.closes || null;
  if (type === 'exam' && !due) {
    return endDate >= new Date('2026-09-01');
  }
  if (due && new Date(due) < today) return false;
  return true;
}

// Expand one learning unit into N individual 2-hour session items.
// All sessions share the same id so one checkbox marks the whole unit done.
function expandUnitSessions(unit, unitIdx, mod, hardDue, totalSessions) {
  const uId   = `${mod.code}__unit__${unitIdx}`;
  const uDone = doneTasks.includes(uId);
  const items = [];
  for (let s = 1; s <= totalSessions; s++) {
    items.push({
      module:        mod.code,
      moduleTitle:   mod.title,
      type:          'Learning Unit',
      title:         unit.title,
      sessionLabel:  `${s}/${totalSessions}`,
      id:            `${uId}__session__${s}`,   // ← unique per session
      unitId:        uId,                         // ← the parent unit id
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

// ============================================================
// generateSchedule() — DEBUGGED VERSION
// Drop this function into app.js to replace the original.
// Open DevTools → Console, then click "Generate Schedule".
// ============================================================

function generateSchedule() {
  console.group('🗓️ generateSchedule() START');

  // ── STEP 1: Read form inputs ────────────────────────────────────────────────
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

  // ── STEP 2: Build the ordered item list ────────────────────────────────────
  console.group('[2] Building allOrderedItems');
  const allOrderedItems = [];
  const TASK_FIELDS = ['assessments', 'tasks', 'lessons', 'classes',
                       'exercises', 'activities', 'practicals', 'workshops'];

  selectedMods.forEach(code => {
    const mod = MODULE_DATA.find(m => m.code === code);
    if (!mod) { console.warn(`  [2] ⚠️ Module ${code} not found in MODULE_DATA — skipping.`); return; }

    const links = (typeof UNIT_LINKS !== 'undefined' && UNIT_LINKS[code]) || {};
    const sessionsPerUnit = UNIT_SESSIONS[code] || 4;
    console.group(`  [2] Processing module: ${code} | sessionsPerUnit=${sessionsPerUnit}`);
    console.log(`  [2] UNIT_LINKS for ${code}:`, links);

    // Collect all assessments from all field names, deduped
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

      // Schedule prerequisite units before this assessment
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

      // The assessment itself
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

    // Remaining units not linked to any specific assessment
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
  console.log('[2] allOrderedItems:', allOrderedItems);
  console.groupEnd();

  if (!allOrderedItems.length) {
    console.error('[2] ❌ No pending items found — aborting.');
    return alert('No pending items found for the selected modules!');
  }

  // ── STEP 3: Build the list of available study days ─────────────────────────
  console.group('[3] Building availableDays');
  const availableDays = [];
  let cursor = new Date(today);
  while (cursor <= endDate) {
    if (studyDays.includes(cursor.getDay())) availableDays.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  console.log(`[3] availableDays count: ${availableDays.length}`);
  console.log('[3] First 5 days:', availableDays.slice(0, 5).map(d => d.toDateString()));
  console.groupEnd();
  if (!availableDays.length) { console.error('[3] ❌ No study days before finish date — aborting.'); return alert('No study days available before your finish date!'); }

  // ── STEP 4: Initialise schedule skeleton ───────────────────────────────────
  const schedule = availableDays.map(d => ({ date: new Date(d), items: [], hoursUsed: 0 }));
  console.log(`[4] Schedule skeleton created: ${schedule.length} days`);

  // ── STEP 5: Split items into categories ────────────────────────────────────
  console.group('[5] Splitting items into freeQueues / pinnedItems / floatItems');
  const unitItems   = allOrderedItems.filter(i => i.isUnit);
  const assessItems = allOrderedItems.filter(i => !i.isUnit);
  console.log(`[5] unitItems: ${unitItems.length} | assessItems: ${assessItems.length}`);

  const freeQueues   = {};  // module → queue of unit sessions (+ undated assessments)
  const pinnedItems  = [];  // assessments with a due date
  // const floatItems = [];  // (currently merged into freeQueues)

  unitItems.forEach(item => {
    if (!freeQueues[item.module]) freeQueues[item.module] = [];
    freeQueues[item.module].push(item);
  });

  assessItems.forEach(item => {
    if (item.hardDue) {
      pinnedItems.push(item);
    } else {
      if (!freeQueues[item.module]) freeQueues[item.module] = [];
      freeQueues[item.module].push(item);
    }
  });

  console.log('[5] freeQueues lengths:', Object.fromEntries(Object.entries(freeQueues).map(([k, v]) => [k, v.length])));
  console.log('[5] pinnedItems:', pinnedItems.map(p => `${p.module} "${p.title}" due=${p.hardDue}`));
  console.groupEnd();

  const modCodes = Object.keys(freeQueues);
  pinnedItems.sort((a, b) => new Date(a.hardDue) - new Date(b.hardDue));
  const dayModules = schedule.map(() => new Set());

  // ── STEP 6: Place pinned assessments near their due date ───────────────────
  console.group('[6] Placing pinned assessments');
  pinnedItems.forEach(item => {
    const dueD = new Date(item.hardDue); dueD.setHours(23, 59, 59);
    let placed = false;
    for (let i = schedule.length - 1; i >= 0; i--) {
      const ok = schedule[i].date <= dueD
              && schedule[i].hoursUsed + item.hours <= hoursDay + 1
              && !dayModules[i].has(item.module);
      if (ok) {
        schedule[i].items.push(item);
        schedule[i].hoursUsed += item.hours;
        dayModules[i].add(item.module);
        placed = true;
        console.log(`  [6] ✅ Placed "${item.title}" on day[${i}] = ${schedule[i].date.toDateString()}`);
        break;
      }
    }
    if (!placed) {
      let fallback = schedule.length - 1;
      for (let fi = schedule.length - 1; fi >= 0; fi--) {
        if (schedule[fi].date <= dueD) { fallback = fi; break; }
      }
      schedule[fallback].items.push(item);
      schedule[fallback].hoursUsed += item.hours;
      dayModules[fallback].add(item.module);
      console.warn(`  [6] ⚠️ Could not place "${item.title}" normally — fallback to day[${fallback}] = ${schedule[fallback].date.toDateString()}`);
    }
  });
  console.groupEnd();

  // ── STEP 7: Round-robin free sessions ─────────────────────────────────────
  console.group('[7] Round-robin free sessions');
  const rotation = [...modCodes]
    .filter(c => freeQueues[c]?.length > 0)
    .sort((a, b) => (freeQueues[b]?.length || 0) - (freeQueues[a]?.length || 0));
  console.log('[7] rotation order:', rotation);

  let rotIdx  = 0;
  let totalFree = rotation.reduce((sum, c) => sum + (freeQueues[c]?.length || 0), 0);
  console.log(`[7] totalFree sessions to place: ${totalFree}`);

  for (let dayIdx = 0; dayIdx < schedule.length && totalFree > 0; dayIdx++) {
    const day = schedule[dayIdx];
    const capacity = hoursDay - day.hoursUsed;
    const slotsAvailable = Math.max(0, Math.floor(capacity / 2));
    console.log(`  [7] Day[${dayIdx}] ${day.date.toDateString()} | hoursUsed=${day.hoursUsed} | capacity=${capacity} | slots=${slotsAvailable}`);
    if (slotsAvailable === 0) { console.log(`  [7]   → No capacity, skipping.`); continue; }

    let slotsPlaced = 0;
    let skips = 0;

    while (slotsPlaced < slotsAvailable && skips < rotation.length) {
      const code = rotation[rotIdx % rotation.length];
      rotIdx++;
      const queue = freeQueues[code];
      if (!queue || queue.length === 0) { console.log(`    [7] Queue for ${code} empty — skip`); skips++; continue; }
      if (dayModules[dayIdx].has(code)) { console.log(`    [7] ${code} already on day[${dayIdx}] — skip`); skips++; continue; }

      skips = 0;
      dayModules[dayIdx].add(code);
      const item = queue.shift();
      totalFree--;
      day.items.push(item);
      day.hoursUsed += item.hours;
      slotsPlaced++;
      console.log(`    [7] ✅ Placed "${item.title}" (${code}) on day[${dayIdx}] | hoursUsed now=${day.hoursUsed} | totalFree=${totalFree}`);
    }
  }
  console.groupEnd();

  // ── STEP 8: Overflow ───────────────────────────────────────────────────────
  console.group('[8] Overflow handling');
  const overflowItems = [];
  modCodes.forEach(code => {
    while (freeQueues[code]?.length > 0) overflowItems.push(freeQueues[code].shift());
  });
  console.log(`[8] overflowItems count: ${overflowItems.length}`);
  if (overflowItems.length > 0) {
    console.warn('[8] ⚠️ Some items could not fit in schedule — trying overflow passes.');
    let oi = 0;
    for (let pass = 0; pass < 10 && oi < overflowItems.length; pass++) {
      for (let di = 0; di < schedule.length && oi < overflowItems.length; di++) {
        const item = overflowItems[oi];
        if (!dayModules[di].has(item.module) && schedule[di].hoursUsed + item.hours <= hoursDay + 2) {
          schedule[di].items.push(item);
          schedule[di].hoursUsed += item.hours;
          dayModules[di].add(item.module);
          console.log(`  [8] Overflow pass ${pass}: placed "${item.title}" on day[${di}]`);
          oi++;
        }
      }
    }
    while (oi < overflowItems.length) {
      const last = schedule[schedule.length - 1];
      last.items.push(overflowItems[oi]);
      last.hoursUsed += overflowItems[oi].hours;
      console.warn(`  [8] Force-placed remaining overflow "${overflowItems[oi].title}" on last day`);
      oi++;
    }
  }
  console.groupEnd();

  // ── STEP 9: Final summary ──────────────────────────────────────────────────
  const filledDays = schedule.filter(d => d.items.length > 0);
  console.group('[9] Final schedule summary');
  console.log(`[9] Total days with items: ${filledDays.length} / ${schedule.length}`);
  console.log(`[9] Total items scheduled: ${filledDays.reduce((s, d) => s + d.items.length, 0)}`);
  console.log(`[9] Total hours: ${filledDays.reduce((s, d) => s + d.hoursUsed, 0)}`);
  console.log('[9] Full schedule:', schedule);
  console.groupEnd();

  console.groupEnd(); // 🗓️ generateSchedule() START

  renderScheduleOutput(filledDays, allOrderedItems, endDateVal, hoursDay);
}


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

  // Count unique units (not sessions) for the stats
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
      // Count unique item ids (not sessions) for done tracking
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

        // Session label e.g. "3/13" for multi-session units
        const sessionTag=item.isUnit&&item.sessionLabel
          ?`<span class="sched-session-label">Session ${item.sessionLabel}</span>`:'';

        const dueTag=item.hardDue&&!item.isUnit
          ?`<span class="sched-due">Due ${new Date(item.hardDue).toLocaleDateString('en-ZA',{day:'numeric',month:'short'})}</span>`:'';
        const prepTag=item.isUnit&&item.forAssessment
          ?`<span class="sched-prep">for: ${item.forAssessment}</span>`:'';
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

function schedToggleDone(id) {
  if (doneTasks.includes(id)) {
    doneTasks = doneTasks.filter(x => x !== id);
  } else {
    doneTasks.push(id);
  }

  // Sync parent unit completion if this is a session id
  const sessionMatch = id.match(/^(.+__unit__\d+)__session__(\d+)$/);
  if (sessionMatch) {
    const unitId      = sessionMatch[1];
    const sessionNum  = parseInt(sessionMatch[2]);
    // Find total sessions for this unit from the saved schedule
    const saved = loadScheduleFromStorage();
    const allSessions = (saved?.allItems || []).filter(i => i.unitId === unitId);
    const total = allSessions.length;
    const doneSessions = allSessions.filter(i => doneTasks.includes(i.id)).length;

    if (doneSessions === total && total > 0) {
      // All sessions done → mark the unit itself done
      if (!doneTasks.includes(unitId)) doneTasks.push(unitId);
    } else {
      // At least one session undone → unit is not fully done
      doneTasks = doneTasks.filter(x => x !== unitId);
    }
  }

  localStorage.setItem('doneTasks', JSON.stringify(doneTasks));
  rescheduleCurrentView();
  renderDashboard();
  if (activeModule) renderModuleDetail(activeModule);
  updateModuleFilter();
}

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

// ── Expose upload functions globally ────────────────────────
window.parseAndUpsertFiles = parseAndUpsertFiles;
window.parseMyUnisaHtml    = parseMyUnisaHtml;
window.upsertModuleLocally  = upsertModuleLocally;