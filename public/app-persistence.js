// ============================================================
// UNISA Study Tracker — app-persistence.js
// Task completion, custom tasks, and module-override storage.
// Depends on: app-globals.js, app-ui.js (refreshAll)
// ============================================================

// ── Task completion ──────────────────────────────────────────
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

// ── Module overrides ─────────────────────────────────────────
// Persist uploaded/edited module data so it survives page reloads.

function saveModuleOverridesToStorage() {
  try {
    localStorage.setItem('moduleOverrides', JSON.stringify(MODULE_DATA));
  } catch(e) {
    console.warn('Could not save module overrides:', e.message);
  }
}

function loadModuleOverridesFromStorage() {
  try {
    const raw = localStorage.getItem('moduleOverrides');
    if (!raw) return;
    const overrides = JSON.parse(raw);
    if (!Array.isArray(overrides)) return;
    overrides.forEach(override => {
      const idx = MODULE_DATA.findIndex(m => m.code === override.code);
      if (idx !== -1) {
        const base = MODULE_DATA[idx];
        MODULE_DATA[idx] = {
          ...base,
          ...override,
          description: (override.description && override.description.length > 50)
            ? override.description
            : base.description,
          title: (base.title && base.title.length > 5 && !base.title.match(/^[A-Z0-9\-]+$/))
            ? base.title
            : override.title || base.title,
        };
      } else {
        MODULE_DATA.push(override);
      }
    });
  } catch(e) {
    console.warn('Could not load module overrides:', e.message);
  }
}

// Kept for backwards compatibility — no longer fetches from server.
async function reloadModuleData() {
  loadModuleOverridesFromStorage();
}
