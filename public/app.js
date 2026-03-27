// ============================================================
// UNISA Study Tracker — app.js
// ============================================================

// Build master task list from MODULE_DATA + custom tasks from localStorage
let customTasks = JSON.parse(localStorage.getItem('customTasks') || '[]');
let doneTasks   = JSON.parse(localStorage.getItem('doneTasks')   || '[]'); // set of ids
let isOpeningSavedSchedule = false;

let calMonth       = new Date(); calMonth.setDate(1);
let moduleCalMonth = new Date(); moduleCalMonth.setDate(1);
let activeModule   = null;
let activeInner    = 'about';

const MODULE_COLORS = [
  { bg:'#eaf2fb', text:'#1a5fa8', accent:'#378ADD' },
  { bg:'#edf7ee', text:'#2e7d32', accent:'#639922' },
  { bg:'#fdf4e7', text:'#b8650a', accent:'#EF9F27' },
  { bg:'#f3eefb', text:'#5e35b1', accent:'#7c4dff' },
  { bg:'#fdf0ee', text:'#b71c1c', accent:'#E24B4A' },
  { bg:'#e8f7f5', text:'#00695c', accent:'#1D9E75' },
];
const col = i => MODULE_COLORS[i % MODULE_COLORS.length];

const API_BASE = '';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch (_) {}
    throw new Error(message);
  }
  return res.json();
}

// ── Build flat task list ──────────────────────────────────
function buildAllTasks() {
  const list = [];
  MODULE_DATA.forEach(mod => {
    const items = [...(mod.assessments || []), ...(mod.tasks || [])];
    items.forEach(a => {
      const due = a.due || a.closes || null;
      list.push({
        id:     `${mod.code}__${a.title}`,
        title:  a.title,
        module: mod.code,
        type:   a.type || 'Assessment',
        due:    due,
        note:   a.note || '',
        done:   doneTasks.includes(`${mod.code}__${a.title}`),
        custom: false,
      });
    });
  });
  customTasks.forEach(t => {
    list.push({ ...t, done: doneTasks.includes(t.id), custom: true });
  });
  return list;
}

function allTasks() {
  return buildAllTasks();
}

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
  customTasks = [];
  doneTasks = [];
  localStorage.removeItem('customTasks');
  localStorage.removeItem('doneTasks');
  refreshAll();
}

function refreshAll() {
  renderDashboard();
  if (document.getElementById('tab-tasks').classList.contains('active')) renderTasks();
  if (document.getElementById('tab-modules').classList.contains('active')) renderModules();
  if (document.getElementById('tab-calendar').classList.contains('active')) renderCalendar();
  if (document.getElementById('tab-module-detail').classList.contains('active') && activeModule) {
    renderModuleDetail(activeModule);
  }
  updateModuleFilter();
  renderSavedSchedules();
}

// ── Navigation ────────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showTab(link.dataset.tab);
  });
});

function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => {
    const match = l.dataset.tab === tab || (tab === 'module-detail' && l.dataset.tab === 'modules');
    l.classList.toggle('active', match);
  });

  const el = document.getElementById('tab-' + tab);
  if (el) el.classList.add('active');

  if (tab === 'dashboard') renderDashboard();
  if (tab === 'modules') renderModules();
  if (tab === 'tasks') renderTasks();
  if (tab === 'calendar') renderCalendar();
  if (tab === 'upload') populateManualModuleSelect();
  if (tab === 'schedule') initSchedulePage();
}

function showInnerTab(name) {
  activeInner = name;
  document.querySelectorAll('.inner-tab').forEach((b, i) => {
    b.classList.toggle('active', ['about', 'units', 'assessments', 'modcal'][i] === name);
  });
  document.querySelectorAll('.inner-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('inner-' + name).classList.add('active');
  if (name === 'modcal' && activeModule) renderModuleCalendar(activeModule);
}

// ── Urgency helpers ───────────────────────────────────────
function getUrgency(due, done) {
  if (done) return 'done';
  if (!due) return 'none';
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = (new Date(due) - now) / 86400000;
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'soon';
  if (diff <= 21) return 'upcoming';
  return 'later';
}

const DOT_COLORS = {
  overdue:'#c0392b',
  soon:'#e67e22',
  upcoming:'#2e7d32',
  later:'#1a5fa8',
  none:'#bbb',
  done:'#bbb'
};

const BADGE_CLS = {
  overdue:'badge-red',
  soon:'badge-amber',
  upcoming:'badge-green',
  later:'badge-blue',
  done:'',
  none:''
};

function urgencyBadge(due, done) {
  if (!due || done) return '';
  const u = getUrgency(due, done);
  const d = new Date(due).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' });
  const label = u === 'overdue' ? 'Overdue' : 'Due';
  return `<span class="badge ${BADGE_CLS[u] || 'badge-blue'}">${label} ${d}</span>`;
}

function taskCard(task, showMod = true) {
  const u = getUrgency(task.due, task.done);
  const meta = showMod ? `${task.module} · ${task.type}` : task.type;
  const noteHtml = task.note ? `<div class="item-note">${task.note}</div>` : '';
  const delBtn = task.custom
    ? `<button class="del-btn" onclick="deleteCustomTask('${task.id}')" title="Delete">&#10005;</button>`
    : '';

  return `<div class="item-card ${task.done ? 'done' : ''}">
    <div class="checkbox ${task.done ? 'checked' : ''}" onclick="toggleDone('${task.id}')"></div>
    <div class="dot" style="background:${DOT_COLORS[u]};flex-shrink:0;margin-top:5px;"></div>
    <div class="item-body">
      <div class="item-title">${task.title}</div>
      <div class="item-meta">${meta}</div>
      ${urgencyBadge(task.due, task.done)}
      ${noteHtml}
    </div>
    ${delBtn}
  </div>`;
}

// ── Dashboard ─────────────────────────────────────────────
function renderDashboard() {
  const tasks = allTasks();
  const now = new Date(); now.setHours(0,0,0,0);
  const week = new Date(now); week.setDate(now.getDate() + 7);
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
  const el = id => document.getElementById(id);

  el('overdue-list').innerHTML = overdue.length
    ? sort(overdue).map(t => taskCard(t)).join('')
    : '<div class="empty">No overdue tasks 🎉</div>';

  el('due-soon-list').innerHTML = soon.length
    ? sort(soon).map(t => taskCard(t)).join('')
    : '<div class="empty">Nothing due this week</div>';

  el('upcoming-list').innerHTML = upcoming.length
    ? sort(upcoming).map(t => taskCard(t)).join('')
    : '<div class="empty">Nothing in the next 60 days</div>';
}

// ── Modules list ──────────────────────────────────────────
function renderModules() {
  const tasks = allTasks();
  const el = document.getElementById('modules-grid');

  el.innerHTML = MODULE_DATA.map((mod, idx) => {
    const c = col(mod.color !== undefined ? mod.color : idx);
    const modTasks = tasks.filter(t => t.module === mod.code);
    const total = modTasks.length;
    const done = modTasks.filter(t => t.done).length;
    const now = new Date(); now.setHours(0,0,0,0);
    const overdue = modTasks.filter(t => !t.done && t.due && new Date(t.due) < now).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const next = modTasks.filter(t => !t.done && t.due).sort((a, b) => new Date(a.due) - new Date(b.due))[0];
    const nextStr = next
      ? `Next: ${new Date(next.due).toLocaleDateString('en-ZA', { day:'numeric', month:'short' })} — ${next.title}`
      : 'No upcoming deadlines';

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
  moduleCalMonth = new Date();
  moduleCalMonth.setDate(1);
  activeInner = 'about';
  renderModuleDetail(code);
  showTab('module-detail');

  document.querySelectorAll('.inner-tab').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.querySelectorAll('.inner-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('inner-about').classList.add('active');
}

function goBackToModules() {
  activeModule = null;
  showTab('modules');
}

function renderModuleDetail(code) {
  const mod = MODULE_DATA.find(m => m.code === code);
  if (!mod) return;

  const c = col(mod.color || 0);
  const tasks = allTasks().filter(t => t.module === code);
  const now = new Date(); now.setHours(0,0,0,0);
  const done = tasks.filter(t => t.done).length;
  const overdue = tasks.filter(t => !t.done && t.due && new Date(t.due) < now).length;
  const week = new Date(now); week.setDate(now.getDate() + 7);
  const soon = tasks.filter(t => !t.done && t.due && new Date(t.due) >= now && new Date(t.due) <= week).length;

  document.getElementById('hero-code').textContent = mod.code;
  document.getElementById('hero-code').style.cssText = `background:${c.bg};color:${c.text}`;
  document.getElementById('hero-title').textContent = mod.title;
  document.getElementById('hero-meta').innerHTML =
    `<span>${mod.period}</span>${mod.lecturer ? `<span> · ${mod.lecturer}</span>` : ''}${mod.email ? `<span> · <a href="mailto:${mod.email}" style="color:${c.text}">${mod.email}</a></span>` : ''}`;

  const unitsDoneCount = (mod.learningUnits || []).filter((_, i) => doneTasks.includes(`${code}__unit__${i}`)).length;

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
      ${mod.lecturer ? `<div class="info-row"><span class="info-label">Lecturer</span><span class="info-val">${mod.lecturer}</span></div>` : ''}
      ${mod.email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-val"><a href="mailto:${mod.email}">${mod.email}</a></span></div>` : ''}
      ${mod.tel ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-val">${mod.tel}</span></div>` : ''}
      ${mod.consultation ? `<div class="info-row"><span class="info-label">Consultations</span><span class="info-val">${mod.consultation}</span></div>` : ''}
      <div class="info-row"><span class="info-label">Assessments</span><span class="info-val">${(mod.assessments || []).length + (mod.tasks || []).length}</span></div>
      <div class="info-row"><span class="info-label">Learning units</span><span class="info-val">${(mod.learningUnits || []).length}</span></div>
    </div>`;

  const units = mod.learningUnits || [];
  const unitsDone = units.filter((_, i) => doneTasks.includes(`${mod.code}__unit__${i}`)).length;
  const unitsPct = units.length ? Math.round(unitsDone / units.length * 100) : 0;

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
      const uid = `${mod.code}__unit__${i}`;
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

  const allA = [...(mod.assessments || []), ...(mod.tasks || [])];
  const assessDone = allA.filter(a => doneTasks.includes(`${mod.code}__${a.title}`)).length;
  const assessPct = allA.length ? Math.round(assessDone / allA.length * 100) : 0;

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
      const id = `${mod.code}__${a.title}`;
      const isDone = doneTasks.includes(id);
      const due = a.due || a.closes || null;
      const u = getUrgency(due, isDone);
      const openedStr = a.opened ? `Opened: ${new Date(a.opened).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}` : '';
      const dueStr = due ? `Due: ${new Date(due).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}` : '';

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

  const modTasks = allTasks().filter(t => t.module === code);
  renderCalGrid('module-cal-grid', y, m, modTasks, false);
}

function changeModuleMonth(dir) {
  moduleCalMonth.setMonth(moduleCalMonth.getMonth() + dir);
  if (activeModule) renderModuleCalendar(activeModule);
}

// ── All Tasks ─────────────────────────────────────────────
function renderTasks() {
  const modFilter = document.getElementById('filter-module').value;
  const typeFilter = document.getElementById('filter-type').value;
  const statusFilter = document.getElementById('filter-status').value;
  const now = new Date(); now.setHours(0,0,0,0);

  let filtered = allTasks().filter(t => {
    if (modFilter && t.module !== modFilter) return false;
    if (typeFilter && t.type !== typeFilter) return false;
    if (statusFilter === 'done' && !t.done) return false;
    if (statusFilter === 'pending' && t.done) return false;
    if (statusFilter === 'overdue' && (t.done || !t.due || new Date(t.due) >= now)) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (a.due && b.due) return new Date(a.due) - new Date(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });

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
  renderModuleDetail(code);
  renderDashboard();
}

function markAllAssessments(code, markDone) {
  const mod = MODULE_DATA.find(m => m.code === code);
  if (!mod) return;

  const allA = [...(mod.assessments || []), ...(mod.tasks || [])];
  allA.forEach(a => {
    const id = `${code}__${a.title}`;
    if (markDone && !doneTasks.includes(id)) doneTasks.push(id);
    if (!markDone) doneTasks = doneTasks.filter(x => x !== id);
  });

  localStorage.setItem('doneTasks', JSON.stringify(doneTasks));
  renderModuleDetail(code);
  renderDashboard();
  refreshAll();
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
  const days = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  let html = '';

  for (let i = 0; i < first; i++) html += '<div class="cal-day empty"></div>';

  for (let d = 1; d <= days; d++) {
    const isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
    const dayTasks = tasks.filter(t => {
      if (!t.due) return false;
      const td = new Date(t.due);
      return td.getFullYear() === y && td.getMonth() === m && td.getDate() === d;
    });

    const events = dayTasks.map(t => {
      const u = getUrgency(t.due, t.done);
      const bgs = { overdue:'#fdf0ee', soon:'#fdf4e7', upcoming:'#edf7ee', later:'#eaf2fb', done:'#f5f5f5' };
      const tcs = { overdue:'#c0392b', soon:'#b8650a', upcoming:'#2e7d32', later:'#1a5fa8', done:'#999' };
      const label = showMod ? `${t.module}: ${t.title}` : t.title;
      return `<div class="cal-event" style="background:${bgs[u] || bgs.later};color:${tcs[u] || tcs.later}" title="${label}">${label}</div>`;
    }).join('');

    html += `<div class="cal-day${isToday ? ' today' : ''}">
      <div class="cal-day-num">${d}</div>
      ${events}
    </div>`;
  }

  document.getElementById(gridId).innerHTML = html;
}

function changeMonth(dir) {
  calMonth.setMonth(calMonth.getMonth() + dir);
  renderCalendar();
}

// ── Add manual task ───────────────────────────────────────
function addManual() {
  const title = document.getElementById('manual-title').value.trim();
  const module = document.getElementById('manual-module-select').value;
  const type = document.getElementById('manual-type').value;
  const due = document.getElementById('manual-due').value;
  const note = document.getElementById('manual-note').value.trim();

  if (!title || !module) return showResult('Title and module are required', true);

  const task = {
    id: 'custom_' + Date.now(),
    title,
    module,
    type,
    due: due || null,
    note,
    custom: true
  };

  customTasks.push(task);
  localStorage.setItem('customTasks', JSON.stringify(customTasks));
  document.getElementById('manual-title').value = '';
  document.getElementById('manual-due').value = '';
  document.getElementById('manual-note').value = '';
  showResult('Task added!');
  refreshAll();
}

// ── Parse HTML ────────────────────────────────────────────
async function parsePaste() {
  const html = document.getElementById('html-paste').value.trim();
  if (!html) return showResult('Paste some HTML first', true);
  parseHtmlContent(html);
}

async function parseFile() {
  const file = document.getElementById('html-file').files[0];
  if (!file) return showResult('Select an HTML file first', true);
  const html = await file.text();
  parseHtmlContent(html);
}

async function parseHtmlContent(html) {
  try {
    showResult('Parsing...', false);

    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html })
    });

    const data = await res.json();
    if (data.error) return showResult('Error: ' + data.error, true);

    let added = 0;
    (data.tasks || []).forEach(t => {
      const existing = allTasks().find(x => x.title === t.title && x.module === t.module);
      if (!existing) {
        customTasks.push({
          ...t,
          id: 'custom_' + Date.now() + Math.random().toString(36).slice(2),
          custom: true
        });
        added++;
      }
    });

    localStorage.setItem('customTasks', JSON.stringify(customTasks));
    showResult(`Done! Found ${data.tasks.length} tasks, added ${added} new ones.`);
    document.getElementById('html-paste').value = '';
    refreshAll();
  } catch (e) {
    showResult('Something went wrong: ' + e.message, true);
  }
}

function showResult(msg, isError = false) {
  const el = document.getElementById('parse-result');
  el.textContent = msg;
  el.classList.remove('hidden', 'error');
  if (isError) el.classList.add('error');
}

// ── Init ──────────────────────────────────────────────────
updateModuleFilter();
renderDashboard();
renderModules();
renderCalendar();

// ============================================================
// SCHEDULE GENERATOR — dependency-aware
// ============================================================

// ── Saved schedule state ──────────────────────────────────
let savedScheduleSettings = JSON.parse(localStorage.getItem('schedSettings') || 'null');
let savedScheduleData = JSON.parse(localStorage.getItem('savedStudySchedule') || 'null');

function getSavedSchedules() {
  try {
    return JSON.parse(localStorage.getItem('savedSchedules') || '[]');
  } catch (err) {
    console.error('Could not read saved schedules:', err);
    return [];
  }
}

function setSavedSchedules(list) {
  localStorage.setItem('savedSchedules', JSON.stringify(list));
}

function serializeScheduleDays(days) {
  return days.map(day => ({
    date: day.date instanceof Date ? day.date.toISOString() : day.date,
    hoursUsed: day.hoursUsed,
    items: day.items.map(item => ({
      ...item
    }))
  }));
}

function deserializeScheduleDays(days) {
  return (days || []).map(day => ({
    date: new Date(day.date),
    hoursUsed: day.hoursUsed || 0,
    items: (day.items || []).map(item => ({
      ...item
    }))
  }));
}

function saveScheduleToStorage(days, allItems, endDate, hoursDay, settings) {
  const payload = {
    savedAt: new Date().toISOString(),
    days: serializeScheduleDays(days),
    allItems,
    endDate,
    hoursDay,
    settings
  };

  localStorage.setItem('schedSettings', JSON.stringify(settings));
  localStorage.setItem('savedStudySchedule', JSON.stringify(payload));
  savedScheduleData = payload;
}

function loadScheduleFromStorage() {
  try {
    const raw = localStorage.getItem('savedStudySchedule');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      days: deserializeScheduleDays(parsed.days || []),
      allItems: parsed.allItems || [],
      settings: parsed.settings || null
    };
  } catch (err) {
    console.error('Failed to load saved schedule:', err);
    return null;
  }
}

function clearSavedSchedule() {
  localStorage.removeItem('savedStudySchedule');
  localStorage.removeItem('schedSettings');
}

function saveScheduleRecord(days, allItems, endDate, hoursDay, settings) {
  const schedules = getSavedSchedules();

  const serializedDays = serializeScheduleDays(days);
  const signature = JSON.stringify({
    endDate,
    hoursDay,
    settings,
    days: serializedDays,
    allItems
  });

  const existingIndex = schedules.findIndex(s => {
    const existingSignature = JSON.stringify({
      endDate: s.endDate,
      hoursDay: s.hoursDay,
      settings: s.settings,
      days: s.days || [],
      allItems: s.allItems || []
    });
    return existingSignature === signature;
  });

  if (existingIndex !== -1) {
    return schedules[existingIndex];
  }

  const record = {
    id: `sched_${Date.now()}`,
    savedAt: new Date().toISOString(),
    endDate,
    hoursDay,
    allItems,
    days: serializedDays,
    settings
  };

  schedules.unshift(record);
  setSavedSchedules(schedules);
  return record;
}

function loadScheduleRecord(id) {
  const schedules = getSavedSchedules();
  const found = schedules.find(s => s.id === id);
  if (!found) return null;

  return {
    ...found,
    days: deserializeScheduleDays(found.days || [])
  };
}

async function saveScheduleToBackend(schedulePayload) {
  try {
    await apiFetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedulePayload)
    });
  } catch (error) {
    console.warn('Could not save schedule to backend:', error.message);
  }
}

function renderSavedSchedules() {
  const wrap = document.getElementById('saved-schedules-list');
  if (!wrap) return;

  const schedules = getSavedSchedules();

  if (!schedules.length) {
    wrap.innerHTML = `<div class="empty">No saved schedules yet.</div>`;
    return;
  }

  wrap.innerHTML = schedules.map(s => {
    const savedDate = new Date(s.savedAt).toLocaleString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const dayCount = (s.days || []).length;
    const itemCount = (s.allItems || []).length;

    return `
      <div class="saved-schedule-card">
        <div>
          <div class="saved-schedule-title">Finish by ${s.endDate}</div>
          <div class="saved-schedule-meta">Saved: ${savedDate}</div>
          <div class="saved-schedule-meta">${dayCount} study days · ${itemCount} items · ${s.hoursDay}h/day</div>
        </div>
        <button class="bulk-btn" onclick="openSavedSchedule('${s.id}')">Open</button>
      </div>
    `;
  }).join('');
}

function openSavedSchedule(id) {
  const saved = loadScheduleRecord(id);
  if (!saved) {
    alert('Saved schedule not found.');
    return;
  }

  isOpeningSavedSchedule = true;
  savedScheduleSettings = saved.settings || null;
  saveScheduleToStorage(saved.days || [], saved.allItems || [], saved.endDate, saved.hoursDay || 3, saved.settings || null);

  if (saved.settings) {
    document.getElementById('sched-end-date').value = saved.settings.endDate || '';
    document.getElementById('sched-hours').value = saved.settings.hoursDay || 3;
    document.getElementById('sched-hours-val').textContent = saved.settings.hoursDay || 3;

    document.querySelectorAll('.day-picker input[type="checkbox"]').forEach(cb => {
      cb.checked = (saved.settings.studyDays || []).includes(parseInt(cb.value));
    });

    document.querySelectorAll('.sched-mod-cb').forEach(cb => {
      cb.checked = (saved.settings.selectedMods || []).includes(cb.value);
    });

    document.getElementById('inc-units').checked = !!saved.settings.incUnits;
    document.getElementById('inc-assessments').checked = !!saved.settings.incAssess;
    document.getElementById('inc-done').checked = !!saved.settings.incDone;
  }

  document.getElementById('sched-form').style.display = 'none';
  document.getElementById('sched-output').style.display = 'block';
  document.querySelectorAll('.missed-banner, .on-track-banner').forEach(el => el.remove());

  renderScheduleOutput(saved.days || [], saved.allItems || [], saved.endDate, saved.hoursDay || 3);

  isOpeningSavedSchedule = false;
}

window.openSavedSchedule = openSavedSchedule;

function initSchedulePage() {
  const list = document.getElementById('sched-module-list');
  if (!list) return;

  list.innerHTML = MODULE_DATA.map(mod => {
    const c = col(mod.color || 0);
    const pendingAssess = [...(mod.assessments || []), ...(mod.tasks || [])]
      .filter(a => !doneTasks.includes(`${mod.code}__${a.title}`)).length;
    const pendingUnits = (mod.learningUnits || [])
      .filter((_, i) => !doneTasks.includes(`${mod.code}__unit__${i}`)).length;

    return `<label class="sched-mod-row">
      <input type="checkbox" class="sched-mod-cb" value="${mod.code}" checked />
      <div class="sched-mod-icon" style="background:${c.bg};color:${c.text}">${mod.code.substring(0,3)}</div>
      <div class="sched-mod-info">
        <span class="sched-mod-code">${mod.code}</span>
        <span class="sched-mod-name">${mod.title}</span>
      </div>
      <span class="sched-mod-count">${pendingUnits} units · ${pendingAssess} assessments pending</span>
    </label>`;
  }).join('');

  const endInput = document.getElementById('sched-end-date');
  if (endInput && !endInput.value) endInput.value = '2026-06-30';

  renderSavedSchedules();

  const saved = loadScheduleFromStorage();
  if (!saved) return;

  if (saved.settings) {
    savedScheduleSettings = saved.settings;

    document.getElementById('sched-end-date').value = saved.settings.endDate || '2026-06-30';
    document.getElementById('sched-hours').value = saved.settings.hoursDay || 3;
    document.getElementById('sched-hours-val').textContent = saved.settings.hoursDay || 3;

    document.querySelectorAll('.day-picker input[type=checkbox]').forEach(cb => {
      cb.checked = (saved.settings.studyDays || []).includes(parseInt(cb.value));
    });

    document.querySelectorAll('.sched-mod-cb').forEach(cb => {
      cb.checked = (saved.settings.selectedMods || []).includes(cb.value);
    });

    document.getElementById('inc-units').checked = !!saved.settings.incUnits;
    document.getElementById('inc-assessments').checked = !!saved.settings.incAssess;
    document.getElementById('inc-done').checked = !!saved.settings.incDone;
  }

  if (saved.days && saved.days.length) {
    document.getElementById('sched-form').style.display = 'none';
    document.getElementById('sched-output').style.display = 'block';
    renderScheduleOutput(saved.days, saved.allItems || [], saved.endDate, saved.hoursDay || 3);
  }
}

function schedSelectAll(val) {
  document.querySelectorAll('.sched-mod-cb').forEach(cb => cb.checked = val);
}

function generateSchedule() {
  const endDateVal = document.getElementById('sched-end-date').value;
  if (!endDateVal) return alert('Please set a finish date first.');

  const endDate = new Date(endDateVal); endDate.setHours(23,59,59);
  const today = new Date(); today.setHours(0,0,0,0);
  const hoursDay = parseInt(document.getElementById('sched-hours').value) || 3;
  const incUnits = document.getElementById('inc-units').checked;
  const incAssess = document.getElementById('inc-assessments').checked;
  const incDone = document.getElementById('inc-done').checked;

  const studyDays = Array.from(document.querySelectorAll('.day-picker input[type=checkbox]'))
    .filter(c => c.checked).map(c => parseInt(c.value));
  if (!studyDays.length) return alert('Please select at least one study day.');

  const selectedMods = Array.from(document.querySelectorAll('.sched-mod-cb'))
    .filter(c => c.checked).map(c => c.value);
  if (!selectedMods.length) return alert('Please select at least one module.');

  const allOrderedItems = [];

  selectedMods.forEach(code => {
    const mod = MODULE_DATA.find(m => m.code === code);
    if (!mod) return;

    const links = (typeof UNIT_LINKS !== 'undefined' && UNIT_LINKS[code]) || {};
    const assessList = [...(mod.assessments || []), ...(mod.tasks || [])];
    const scheduledUnitIdxs = new Set();

    assessList.forEach(a => {
      const aId = `${code}__${a.title}`;
      const aDone = doneTasks.includes(aId);
      const aDue = a.due || a.closes || null;
      const reqIdxs = links[a.title] || [];

      if (incUnits) {
        reqIdxs.forEach(i => {
          if (scheduledUnitIdxs.has(i)) return;
          const u = (mod.learningUnits || [])[i];
          if (!u) return;

          const uId = `${code}__unit__${i}`;
          const uDone = doneTasks.includes(uId);

          if (!incDone && uDone) {
            scheduledUnitIdxs.add(i);
            return;
          }

          scheduledUnitIdxs.add(i);
          allOrderedItems.push({
            module: code,
            moduleTitle: mod.title,
            type: 'Learning Unit',
            title: u.title,
            id: uId,
            due: aDue,
            hardDue: aDue,
            done: uDone,
            hours: 1.5,
            color: mod.color || 0,
            isUnit: true,
            forAssessment: a.title,
          });
        });
      }

      if (incAssess) {
        if (!incDone && aDone) return;

        const hrs = a.type === 'Assignment' ? 4
          : a.type === 'Quiz' ? 1
          : a.type === 'Exam' ? 3
          : a.type === 'Test' ? 2
          : 1.5;

        allOrderedItems.push({
          module: code,
          moduleTitle: mod.title,
          type: a.type || 'Assessment',
          title: a.title,
          id: aId,
          due: aDue,
          hardDue: aDue,
          done: aDone,
          hours: hrs,
          color: mod.color || 0,
          isUnit: false,
        });
      }
    });

    if (incUnits) {
      (mod.learningUnits || []).forEach((u, i) => {
        if (scheduledUnitIdxs.has(i)) return;

        const uId = `${code}__unit__${i}`;
        const uDone = doneTasks.includes(uId);
        if (!incDone && uDone) return;

        allOrderedItems.push({
          module: code,
          moduleTitle: mod.title,
          type: 'Learning Unit',
          title: u.title,
          id: uId,
          due: null,
          hardDue: null,
          done: uDone,
          hours: 1.5,
          color: mod.color || 0,
          isUnit: true,
          forAssessment: null,
        });
      });
    }
  });

  if (!allOrderedItems.length) return alert('No pending items found for the selected modules!');

  const availableDays = [];
  let cursor = new Date(today);
  while (cursor <= endDate) {
    if (studyDays.includes(cursor.getDay())) availableDays.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  if (!availableDays.length) return alert('No study days available before your finish date!');

  const schedule = availableDays.map(d => ({
    date: new Date(d),
    items: [],
    hoursUsed: 0,
    modules: new Set()
  }));

  const moduleQueues = {};
  allOrderedItems.forEach(item => {
    if (!moduleQueues[item.module]) moduleQueues[item.module] = [];
    moduleQueues[item.module].push(item);
  });

  const modCodes = Object.keys(moduleQueues);

  schedule.forEach(day => {
    const budget = hoursDay;
    let hoursLeft = budget;
    const pickedMods = new Set();

    const modsByUrgency = [...modCodes].sort((a, b) => {
      const nextA = moduleQueues[a]?.[0];
      const nextB = moduleQueues[b]?.[0];
      const dA = nextA?.hardDue ? new Date(nextA.hardDue) : new Date('2099-01-01');
      const dB = nextB?.hardDue ? new Date(nextB.hardDue) : new Date('2099-01-01');
      return dA - dB;
    });

    for (const code of modsByUrgency) {
      if (!moduleQueues[code] || moduleQueues[code].length === 0) continue;
      if (pickedMods.size >= 2) break;

      const queue = moduleQueues[code];
      let addedFromThisMod = false;

      while (queue.length > 0 && hoursLeft > 0) {
        const item = queue[0];

        if (item.hardDue) {
          const dueD = new Date(item.hardDue);
          dueD.setHours(23,59,59);
          if (day.date > dueD) break;
        }

        const fits = item.hours <= hoursLeft + 0.5;
        if (!fits && addedFromThisMod) break;
        if (!fits && !addedFromThisMod) {
          if (item.hours > budget + 1) break;
        }

        queue.shift();
        day.items.push(item);
        day.hoursUsed += item.hours;
        hoursLeft -= item.hours;
        pickedMods.add(code);
        addedFromThisMod = true;

        const nextInQueue = queue[0];
        const bothSmall = nextInQueue && !nextInQueue.isUnit && item.isUnit && (item.hours + nextInQueue.hours) <= 2.5;
        if (!bothSmall) break;
      }
    }

    for (const code of modCodes) {
      const queue = moduleQueues[code];
      if (!queue || queue.length === 0) continue;

      const item = queue[0];
      if (!item.hardDue) continue;

      const dueD = new Date(item.hardDue);
      dueD.setHours(23,59,59);

      if (day.date >= dueD) {
        queue.shift();
        day.items.push(item);
        day.hoursUsed += item.hours;
      }
    }
  });

  modCodes.forEach(code => {
    while (moduleQueues[code] && moduleQueues[code].length > 0) {
      const item = moduleQueues[code].shift();
      let placed = false;

      for (let i = schedule.length - 1; i >= 0; i--) {
        if (schedule[i].hoursUsed < hoursDay + 2) {
          schedule[i].items.push(item);
          schedule[i].hoursUsed += item.hours;
          placed = true;
          break;
        }
      }

      if (!placed) {
        schedule[schedule.length - 1].items.push(item);
        schedule[schedule.length - 1].hoursUsed += item.hours;
      }
    }
  });

  const activeDays = schedule.filter(d => d.items.length > 0);
  renderScheduleOutput(activeDays, allOrderedItems, endDateVal, hoursDay);
}

function renderScheduleOutput(days, allItems, endDate, hoursDay) {
  // Only capture settings when we are generating fresh (not opening a saved schedule)
  if (!isOpeningSavedSchedule) {
    const studyDaysCbs = document.querySelectorAll('.day-picker input[type=checkbox]');
    const modCbs = document.querySelectorAll('.sched-mod-cb');

    savedScheduleSettings = {
      endDate,
      hoursDay,
      studyDays: Array.from(studyDaysCbs).filter(c => c.checked).map(c => parseInt(c.value)),
      selectedMods: Array.from(modCbs).filter(c => c.checked).map(c => c.value),
      incUnits: document.getElementById('inc-units')?.checked ?? true,
      incAssess: document.getElementById('inc-assessments')?.checked ?? true,
      incDone: document.getElementById('inc-done')?.checked ?? false,
    };

    saveScheduleToStorage(days, allItems, endDate, hoursDay, savedScheduleSettings);
    const savedRecord = saveScheduleRecord(days, allItems, endDate, hoursDay, savedScheduleSettings);
    renderSavedSchedules();
    saveScheduleToBackend(savedRecord);
  }

  document.getElementById('sched-form').style.display = 'none';
  const out = document.getElementById('sched-output');
  out.style.display = 'block';

  const today = new Date();
  today.setHours(0,0,0,0);

  const missedItems = [];
  days.forEach(day => {
    const d = new Date(day.date);
    d.setHours(0,0,0,0);

    if (d < today) {
      day.items.forEach(item => {
        if (!doneTasks.includes(item.id)) missedItems.push(item);
      });
    }
  });

  const totalHours = Math.round(allItems.reduce((s, i) => s + i.hours, 0));
  const totalDays = days.length;
  const modules = [...new Set(allItems.map(i => i.module))].length;
  const assessments = allItems.filter(i => !i.isUnit).length;
  const units = allItems.filter(i => i.isUnit).length;

  document.getElementById('sched-output-title').textContent =
    `Study plan — finish by ${new Date(endDate).toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' })}`;

  const missedBanner = missedItems.length > 0 ? `
    <div class="missed-banner">
      <div class="missed-banner-left">
        <span class="missed-banner-icon">⚠️</span>
        <div>
          <div class="missed-banner-title">${missedItems.length} item${missedItems.length !== 1 ? 's' : ''} not completed from past days</div>
          <div class="missed-banner-sub">These will be rescheduled from today if you click the button →</div>
        </div>
      </div>
      <button class="btn-primary missed-reschedule-btn" onclick="rescheduleFromToday()">
        Reschedule missed items
      </button>
    </div>` : `
    <div class="on-track-banner">
      ✅ You're on track — no missed items!
    </div>`;

  document.querySelectorAll('.missed-banner, .on-track-banner').forEach(el => el.remove());
  document.getElementById('sched-output').insertAdjacentHTML('afterbegin', missedBanner);

  document.getElementById('sched-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Study days</div><div class="stat-value">${totalDays}</div></div>
    <div class="stat-card"><div class="stat-label">Total hours</div><div class="stat-value">${totalHours}</div></div>
    <div class="stat-card"><div class="stat-label">Modules</div><div class="stat-value">${modules}</div></div>
    <div class="stat-card"><div class="stat-label">Units to study</div><div class="stat-value">${units}</div></div>
    <div class="stat-card"><div class="stat-label">Assessments</div><div class="stat-value">${assessments}</div></div>
    ${missedItems.length > 0
      ? `<div class="stat-card"><div class="stat-label">Missed</div><div class="stat-value" style="color:#c0392b">${missedItems.length}</div></div>`
      : `<div class="stat-card"><div class="stat-label">Hrs/day</div><div class="stat-value">${hoursDay}</div></div>`}
  `;

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let lastMonth = -1;
  let html = '';

  days.forEach(day => {
    const d = new Date(day.date);
    d.setHours(0,0,0,0);

    const month = d.getMonth();
    if (month !== lastMonth) {
      html += `<div class="sched-month-header">${monthNames[month]} ${d.getFullYear()}</div>`;
      lastMonth = month;
    }

    const isToday = d.getTime() === today.getTime();
    const isPast = d < today;
    const dayName = d.toLocaleDateString('en-ZA', { weekday:'long' });
    const dayStr = d.toLocaleDateString('en-ZA', { day:'numeric', month:'short' });
    const hrs = Math.round(day.hoursUsed * 10) / 10;

    let dayStatus = '';
    let dayClass = isToday ? 'sched-day-today' : '';

    if (isPast) {
      const doneCount = day.items.filter(i => doneTasks.includes(i.id)).length;
      const totalItems = day.items.length;

      if (doneCount === totalItems) {
        dayStatus = `<span class="day-status day-status-done">✅ All done</span>`;
        dayClass = 'sched-day-completed';
      } else if (doneCount > 0) {
        dayStatus = `<span class="day-status day-status-partial">⚠️ ${doneCount}/${totalItems} done</span>`;
        dayClass = 'sched-day-partial';
      } else {
        dayStatus = `<span class="day-status day-status-missed">❌ Missed</span>`;
        dayClass = 'sched-day-missed';
      }
    }

    const byMod = {};
    day.items.forEach(item => {
      if (!byMod[item.module]) {
        byMod[item.module] = {
          title: item.moduleTitle,
          color: item.color,
          items: []
        };
      }
      byMod[item.module].items.push(item);
    });

    const modBlocks = Object.entries(byMod).map(([code, group]) => {
      const c = col(group.color);

      const rows = group.items.map(item => {
        const isDone = doneTasks.includes(item.id);
        const typeIcon = item.isUnit ? '📖'
          : item.type === 'Assignment' ? '📝'
          : item.type === 'Quiz' ? '📋'
          : item.type === 'Exam' ? '🎓'
          : item.type === 'Test' ? '🖊'
          : '✅';

        const dueTag = item.hardDue && !item.isUnit
          ? `<span class="sched-due">Due ${new Date(item.hardDue).toLocaleDateString('en-ZA', { day:'numeric', month:'short' })}</span>`
          : '';

        const prepTag = item.isUnit && item.forAssessment
          ? `<span class="sched-prep">prepares for: ${item.forAssessment}</span>`
          : '';

        const tickClass = isDone ? 'sched-tick checked' : 'sched-tick';
        const rowClass = isDone ? 'sched-item-done' : '';
        const missedTag = isPast && !isDone
          ? `<span class="sched-missed-tag">not done</span>`
          : '';

        const indentClass = item.isUnit ? 'sched-item-unit' : 'sched-item-assess';

        return `<div class="sched-item ${indentClass} ${rowClass}">
          <div class="${tickClass}" onclick="schedToggleDone('${item.id}')" title="Mark as done"></div>
          <span class="sched-item-icon">${typeIcon}</span>
          <span class="sched-item-title">${item.title}</span>
          <span class="sched-item-type">${item.type}</span>
          ${prepTag}${dueTag}${missedTag}
          <span class="sched-item-hrs">${item.hours}h</span>
        </div>`;
      }).join('');

      return `<div class="sched-mod-block" style="border-left:3px solid ${c.accent}">
        <div class="sched-mod-block-header" style="color:${c.text};background:${c.bg}">
          <span style="font-weight:700">${code}</span>
          <span style="font-size:12px;margin-left:8px;">${group.title}</span>
        </div>
        ${rows}
      </div>`;
    }).join('');

    html += `<div class="sched-day ${dayClass}">
      <div class="sched-day-header">
        <div class="sched-day-date">
          <span class="sched-day-name">${dayName}</span>
          <span class="sched-day-num">${dayStr}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          ${dayStatus}
          <div class="sched-day-meta">${day.items.length} items · ${hrs}h</div>
        </div>
      </div>
      <div class="sched-day-body">${modBlocks}</div>
    </div>`;
  });

  document.getElementById('sched-days').innerHTML = html;
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Tick/untick directly from the schedule view
function schedToggleDone(id) {
  if (doneTasks.includes(id)) doneTasks = doneTasks.filter(x => x !== id);
  else doneTasks.push(id);

  localStorage.setItem('doneTasks', JSON.stringify(doneTasks));
  rescheduleCurrentView();
  renderDashboard();
  if (activeModule) renderModuleDetail(activeModule);
  updateModuleFilter();
}

function rescheduleFromToday() {
  document.querySelectorAll('.missed-banner, .on-track-banner').forEach(el => el.remove());

  if (!savedScheduleSettings) {
    generateSchedule();
    return;
  }

  document.getElementById('sched-end-date').value = savedScheduleSettings.endDate;
  document.getElementById('sched-hours').value = savedScheduleSettings.hoursDay;
  document.getElementById('sched-hours-val').textContent = savedScheduleSettings.hoursDay;

  document.querySelectorAll('.day-picker input[type=checkbox]').forEach(cb => {
    cb.checked = savedScheduleSettings.studyDays.includes(parseInt(cb.value));
  });

  initSchedulePage();

  setTimeout(() => {
    document.querySelectorAll('.sched-mod-cb').forEach(cb => {
      cb.checked = savedScheduleSettings.selectedMods.includes(cb.value);
    });

    document.getElementById('inc-units').checked = savedScheduleSettings.incUnits;
    document.getElementById('inc-assessments').checked = savedScheduleSettings.incAssess;
    document.getElementById('inc-done').checked = false;

    document.getElementById('sched-output').style.display = 'none';
    generateSchedule();
  }, 50);
}

function rescheduleCurrentView() {
  if (!savedScheduleSettings) return;
  document.querySelectorAll('.missed-banner, .on-track-banner').forEach(el => el.remove());
  rescheduleFromToday();
}

function resetSchedule() {
  document.querySelectorAll('.missed-banner, .on-track-banner').forEach(el => el.remove());
  savedScheduleSettings = null;
  savedScheduleData = null;
  document.getElementById('sched-form').style.display = 'block';
  document.getElementById('sched-output').style.display = 'none';
  document.getElementById('sched-days').innerHTML = '';
  document.getElementById('sched-stats').innerHTML = '';
}