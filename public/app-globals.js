// ============================================================
// UNISA Study Tracker — app-globals.js
// Shared state, constants, colours, and utility helpers.
// Must be loaded FIRST (after modules-data.js).
// ============================================================

// ── App-wide mutable state ───────────────────────────────────
let customTasks = JSON.parse(localStorage.getItem('customTasks') || '[]');
let doneTasks   = JSON.parse(localStorage.getItem('doneTasks')   || '[]');
let isOpeningSavedSchedule = false;

let calMonth       = new Date(); calMonth.setDate(1);
let moduleCalMonth = new Date(); moduleCalMonth.setDate(1);
let activeModule   = null;
let activeInner    = 'about';

// ── Module colour palette ────────────────────────────────────
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

// ── Urgency helpers ──────────────────────────────────────────
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

// ── Task card HTML ───────────────────────────────────────────
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

// ── Flat task list builder ───────────────────────────────────
// Reads from all possible UNISA field names, deduplicates within each module.
const TASK_FIELDS = ['assessments', 'tasks', 'lessons', 'classes',
                     'exercises', 'activities', 'practicals', 'workshops'];

const SKIP_TITLES = new Set([
  'assessment', 'exam', 'test', 'quiz', 'assignment', 'task', 'lesson',
  'class', 'exercise', 'activity', 'practical', 'workshop',
  'ASSESSMENT', 'ASSESSMENT 9', 'Assessment', 'Exam', 'Test',
  'Quiz', 'Assignment', 'Task', 'Lesson', 'Class',
]);

function buildAllTasks() {
  const list = [];
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

// ── API helper (kept for legacy schedule backend call) ───────
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
