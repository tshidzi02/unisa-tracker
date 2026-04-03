// ============================================================
// UNISA Study Tracker — app-ui.js
// Navigation, dashboard, modules grid, tasks tab,
// global calendar, and manual task form.
// Depends on: app-globals.js, app-persistence.js
// ============================================================

// ── Refresh helper ───────────────────────────────────────────
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

// ── Navigation ───────────────────────────────────────────────
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

// ── Dashboard ────────────────────────────────────────────────
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

// ── Modules grid ─────────────────────────────────────────────
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

// ── All Tasks tab ────────────────────────────────────────────
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

// ── Bulk mark helpers ────────────────────────────────────────
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

// ── Global Calendar ──────────────────────────────────────────
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

// ── Add manual task ──────────────────────────────────────────
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
