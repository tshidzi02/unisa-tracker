// ============================================================
// UNISA Study Tracker — Resources / File Attachments
// app-resources.js
// ============================================================

// ── Pending files map: moduleCode → DataTransfer (file staging) ──
const _pendingFiles = {};

function getPending(moduleCode) {
  if (!_pendingFiles[moduleCode]) _pendingFiles[moduleCode] = [];
  return _pendingFiles[moduleCode];
}

// ── Storage helpers ──────────────────────────────────────────
function getResources() {
  try { return JSON.parse(localStorage.getItem('moduleResources') || '[]'); }
  catch { return []; }
}
function setResources(list) {
  localStorage.setItem('moduleResources', JSON.stringify(list));
}

// ── File-type helpers ────────────────────────────────────────
const FILE_ICONS = {
  pdf:  '📄', xlsx: '📊', xls: '📊', csv: '📊',
  docx: '📝', doc:  '📝', pptx:'📑', ppt: '📑',
  png:  '🖼', jpg:  '🖼', jpeg:'🖼', gif: '🖼', webp:'🖼',
  txt:  '📃', md:   '📃', zip:  '🗜', default: '📎'
};
function fileIcon(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.default;
}
function humanSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}

// ── Stage files when user picks them (no upload yet) ─────────
function stageFiles(moduleCode) {
  const input = document.getElementById(`res-file-input-${moduleCode}`);
  if (!input || !input.files.length) return;

  const pending = getPending(moduleCode);
  const existing = getResources();

  Array.from(input.files).forEach(file => {
    // Skip if already staged
    if (pending.find(f => f.name === file.name && f.size === file.size)) return;
    pending.push(file);
  });

  input.value = ''; // reset so the same file can be re-added if removed
  renderStagingArea(moduleCode);
}

// ── Remove one file from staging ─────────────────────────────
function removeStagedFile(moduleCode, index) {
  const pending = getPending(moduleCode);
  pending.splice(index, 1);
  renderStagingArea(moduleCode);
}

// ── Render the staging area (queued but not yet saved) ────────
function renderStagingArea(moduleCode) {
  const area = document.getElementById(`res-staging-${moduleCode}`);
  const uploadBtn = document.getElementById(`res-upload-btn-${moduleCode}`);
  const statusEl  = document.getElementById(`res-upload-status-${moduleCode}`);
  if (!area) return;

  const pending = getPending(moduleCode);

  if (!pending.length) {
    area.innerHTML = '';
    if (uploadBtn) uploadBtn.style.display = 'none';
    return;
  }

  if (uploadBtn) {
    uploadBtn.style.display = 'inline-flex';
    uploadBtn.textContent = `⬆ Upload ${pending.length} file${pending.length > 1 ? 's' : ''}`;
  }

  area.innerHTML = `
    <div class="res-staging-header">
      <span class="res-staging-label">Queued (${pending.length})</span>
      <button class="res-clear-btn" onclick="clearStagedFiles('${moduleCode}')">✕ Clear all</button>
    </div>
    ${pending.map((f, i) => `
      <div class="res-queue-item">
        <span class="res-queue-icon">${fileIcon(f.name)}</span>
        <span class="res-queue-name">${f.name}</span>
        <span class="res-queue-size">${humanSize(f.size)}</span>
        <button class="res-remove-btn" onclick="removeStagedFile('${moduleCode}', ${i})" title="Remove">✕</button>
      </div>
    `).join('')}
  `;

  if (statusEl) statusEl.textContent = '';
}

// ── Clear all staged files ────────────────────────────────────
function clearStagedFiles(moduleCode) {
  _pendingFiles[moduleCode] = [];
  renderStagingArea(moduleCode);
}

// ── Actually upload/save all staged files ────────────────────
async function uploadResourceFile(moduleCode) {
  const pending   = getPending(moduleCode);
  if (!pending.length) return;

  const statusEl  = document.getElementById(`res-upload-status-${moduleCode}`);
  const uploadBtn = document.getElementById(`res-upload-btn-${moduleCode}`);
  const MAX_MB    = 5;

  if (uploadBtn) uploadBtn.disabled = true;

  // Show progress queue
  const stagingArea = document.getElementById(`res-staging-${moduleCode}`);
  if (stagingArea) {
    stagingArea.innerHTML = `
      <div class="res-staging-header"><span class="res-staging-label">Saving…</span></div>
      ${pending.map((f, i) => `
        <div class="res-queue-item" id="res-q-${moduleCode}-${i}">
          <span class="res-queue-icon">${fileIcon(f.name)}</span>
          <span class="res-queue-name">${f.name}</span>
          <span class="res-queue-size">${humanSize(f.size)}</span>
          <span class="res-queue-state res-queue-waiting" id="res-qs-${moduleCode}-${i}">waiting…</span>
        </div>
      `).join('')}
    `;
  }

  let saved = 0, skipped = 0, failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const file = pending[i];
    updateQueueItem(moduleCode, i, 'uploading', '…');

    if (file.size > MAX_MB * 1024 * 1024) {
      updateQueueItem(moduleCode, i, 'error', `Too large (max ${MAX_MB} MB)`);
      failed++;
      continue;
    }

    const resources = getResources();
    const dupe = resources.find(r => r.module === moduleCode && r.name === file.name);
    if (dupe) {
      updateQueueItem(moduleCode, i, 'skip', 'Already exists');
      skipped++;
      continue;
    }

    try {
      const base64 = await readFileAsBase64(file);
      resources.push({
        id:      'res_' + Date.now() + '_' + i,
        module:  moduleCode,
        name:    file.name,
        type:    file.type,
        size:    file.size,
        addedAt: new Date().toISOString(),
        data:    base64,
      });
      setResources(resources);
      updateQueueItem(moduleCode, i, 'ok', 'Saved');
      saved++;
    } catch (err) {
      updateQueueItem(moduleCode, i, 'error', err.message);
      failed++;
    }
  }

  // Summary
  const parts = [];
  if (saved)   parts.push(`${saved} saved`);
  if (skipped) parts.push(`${skipped} skipped`);
  if (failed)  parts.push(`${failed} failed`);
  if (statusEl) {
    statusEl.textContent = parts.join(' · ');
    statusEl.className = 'res-status ' + (failed ? 'res-status-error' : 'res-status-ok');
  }

  // Clear queue and refresh list
  _pendingFiles[moduleCode] = [];
  if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.style.display = 'none'; }
  setTimeout(() => renderModuleResources(moduleCode), 400);
}

// ── Queue UI helpers ─────────────────────────────────────────
function updateQueueItem(moduleCode, index, state, label) {
  const el = document.getElementById(`res-qs-${moduleCode}-${index}`);
  if (!el) return;
  const cls = { uploading: 'res-queue-uploading', ok: 'res-queue-ok',
                skip: 'res-queue-skip', error: 'res-queue-error' };
  el.className = 'res-queue-state ' + (cls[state] || '');
  el.textContent = state === 'ok' ? '✓ ' + label
                 : state === 'error' ? '✗ ' + label
                 : state === 'skip'  ? '— ' + label
                 : label;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Read failed'));
    reader.readAsDataURL(file);
  });
}

// ── Open / download a stored file ────────────────────────────
function openResource(id) {
  const res = getResources().find(r => r.id === id);
  if (!res) return;

  const byteStr  = atob(res.data.split(',')[1]);
  const mimeType = res.type || 'application/octet-stream';
  const bytes    = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType });
  const url  = URL.createObjectURL(blob);

  const a    = document.createElement('a');
  a.href     = url;
  a.target   = '_blank';
  a.download = res.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Delete a stored file ──────────────────────────────────────
function deleteResource(id, moduleCode) {
  if (!confirm('Delete this file?')) return;
  setResources(getResources().filter(r => r.id !== id));
  renderModuleResources(moduleCode);
}

// ── Render resource list for a module ────────────────────────
function renderModuleResources(moduleCode) {
  const container = document.getElementById(`res-list-${moduleCode}`);
  if (!container) return;

  const list = getResources().filter(r => r.module === moduleCode);

  if (!list.length) {
    container.innerHTML = '<div class="res-empty">No files attached yet.</div>';
    return;
  }

  container.innerHTML = list.map(res => `
    <div class="res-card">
      <div class="res-icon">${fileIcon(res.name)}</div>
      <div class="res-info">
        <div class="res-name">${res.name}</div>
        <div class="res-meta">${humanSize(res.size)} · ${new Date(res.addedAt).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}</div>
      </div>
      <div class="res-actions">
        <button class="bulk-btn" onclick="openResource('${res.id}')">Open / Download</button>
        <button class="bulk-btn bulk-btn-clear" onclick="deleteResource('${res.id}', '${moduleCode}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// ── Render the Resources inner-tab panel ─────────────────────
function renderResourcesPanel(moduleCode) {
  const panelId = 'inner-resources';
  let panel = document.getElementById(panelId);
  if (!panel) return;

  const mod = MODULE_DATA.find(m => m.code === moduleCode);
  const c   = col(mod ? (mod.color || 0) : 0);

  panel.innerHTML = `
    <div class="res-upload-card">
      <h3 class="res-upload-title">Attach files to ${moduleCode}</h3>
      <p class="res-upload-desc">Select files to queue them, then add more if needed. PDF, Excel, Word, PowerPoint, CSV, images, and more. Max 5 MB per file.</p>
      <div class="res-upload-row">
        <label class="res-file-label" style="border-color:${c.accent};color:${c.text}">
          <span>📎 Add files</span>
          <input type="file" id="res-file-input-${moduleCode}"
                 accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.pptx,.ppt,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.zip"
                 multiple
                 style="display:none"
                 onchange="stageFiles('${moduleCode}')" />
        </label>
        <button class="bulk-btn res-upload-btn" id="res-upload-btn-${moduleCode}"
                style="display:none;background:${c.accent};color:#fff;border:none"
                onclick="uploadResourceFile('${moduleCode}')">
          ⬆ Upload
        </button>
      </div>
      <div id="res-staging-${moduleCode}" class="res-staging"></div>
      <div id="res-upload-status-${moduleCode}" class="res-status"></div>
    </div>
    <div id="res-list-${moduleCode}" class="res-list"></div>
  `;

  // Re-render any pending files that were staged before tab switch
  renderStagingArea(moduleCode);
  renderModuleResources(moduleCode);
}

// ── Patch showInnerTab to handle 'resources' ─────────────────
const _origShowInnerTab = typeof showInnerTab === 'function' ? showInnerTab : null;

window.showInnerTab = function(name) {
  const tabs   = ['about', 'units', 'assessments', 'modcal', 'resources'];
  const panels = ['inner-about', 'inner-units', 'inner-assessments', 'inner-modcal', 'inner-resources'];

  document.querySelectorAll('.inner-tab').forEach((b, i) => {
    b.classList.toggle('active', tabs[i] === name);
  });
  panels.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const target = document.getElementById('inner-' + name);
  if (target) target.classList.add('active');

  if (name === 'modcal' && activeModule) renderModuleCalendar(activeModule);
  if (name === 'resources' && activeModule) renderResourcesPanel(activeModule);
};

// ── Expose globals ────────────────────────────────────────────
window.stageFiles            = stageFiles;
window.removeStagedFile      = removeStagedFile;
window.clearStagedFiles      = clearStagedFiles;
window.uploadResourceFile    = uploadResourceFile;
window.openResource          = openResource;
window.deleteResource        = deleteResource;
window.renderModuleResources = renderModuleResources;
window.renderResourcesPanel  = renderResourcesPanel;