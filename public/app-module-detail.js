// ============================================================
// UNISA Study Tracker — app-module-detail.js
// Module detail page: about, units, assessments, and module calendar.
// Depends on: app-globals.js, app-ui.js
// ============================================================

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

  // ── Units tab ──────────────────────────────────────────────
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

  // ── Assessments tab ────────────────────────────────────────
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

// ── Module calendar ──────────────────────────────────────────
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
