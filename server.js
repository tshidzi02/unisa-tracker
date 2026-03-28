const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── HTML parse endpoint (stateless — no file I/O) ─────────
// All task/completion data lives in the browser (localStorage).
// This endpoint only receives raw HTML and returns extracted tasks.
app.post('/api/parse', (req, res) => {
  try {
    const html = req.body.html || '';
    if (!html) return res.status(400).json({ error: 'No HTML provided' });
    const result = parseUnisaHTML(html);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Parse failed: ' + err.message });
  }
});

// ── HTML parser ───────────────────────────────────────────
function parseUnisaHTML(html) {
  const tasks   = [];
  const modules = new Set();

  // Strip scripts/styles
  const clean = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[\s\S]*?<\/style>/gi, '');

  // Extract plain text
  const text = clean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  // Detect module name from title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  let moduleName = titleMatch ? titleMatch[1].trim().split(/[-|]/)[0].trim() : 'Unknown Module';

  // Known UNISA module codes
  const codeMatch = text.match(/\b(APM\d{4}|COS\d{4}|MAT\d{4}|FYE\d{4})\b/i);
  if (codeMatch) moduleName = codeMatch[1].toUpperCase();

  // Find assignment/assessment/quiz patterns with due dates
  const patterns = [
    // "Assessment 1 ... Due: Monday, 25 May 2026"
    /(assessment|assignment|quiz|test|exam)\s*(\d*)[^.]*?(?:due|closes?|submit)[:\s]+([A-Za-z]+,?\s*\d{1,2}\s+[A-Za-z]+\s+\d{4})/gi,
    // "Due: 25 May 2026"
    /(?:due|closes?)[:\s]+(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
  ];

  const seen = new Set();

  // Walk through text looking for assessment+date pairs
  const chunks = text.split(/(?=assessment|assignment|quiz\b|exam\b)/i);
  chunks.forEach(chunk => {
    const typeM = chunk.match(/\b(assessment|assignment|quiz|test|exam)\s*(\d*)/i);
    if (!typeM) return;
    const type  = capitalise(typeM[1]);
    const num   = typeM[2] || '';
    const title = `${type}${num ? ' ' + num : ''}`;

    const dateM = chunk.match(
      /(?:due|closes?|submit)[:\s,]+(?:[A-Za-z]+,?\s*)?(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    );
    const due = dateM ? parseNaturalDate(dateM[1]) : null;

    const key = `${moduleName}|${title}`;
    if (!seen.has(key)) {
      seen.add(key);
      tasks.push({ title, module: moduleName, type, due, done: false });
      modules.add(moduleName);
    }
  });

  return { tasks, modules: [...modules], added: tasks.length };
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function parseNaturalDate(str) {
  if (!str) return null;
  const months = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
  // "25 May 2026"
  const natural = str.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (natural) {
    const m = months[natural[2].toLowerCase().slice(0,3)];
    if (m) return `${natural[3]}-${String(m).padStart(2,'0')}-${natural[1].padStart(2,'0')}`;
  }
  // "25/05/2026" or "25-05-2026"
  const dmy = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmy) {
    let y = dmy[3]; if (y.length===2) y='20'+y;
    return `${y}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  }
  return null;
}

// ── Catch-all: serve index.html for any unknown route ─────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// ADD THESE ROUTES TO YOUR server.js / index.js
// Paste them BEFORE the line:  app.listen(...)
// ============================================================

const fs   = require('fs');

const MODULES_DATA_PATH = path.join(__dirname, 'public', 'modules-data.js');

// ── Helper: read the current MODULE_DATA array from the .js file ──────────────
function readModuleData() {
  try {
    const src = fs.readFileSync(MODULES_DATA_PATH, 'utf8');
    // Strip the const declarations and eval the array
    const match = src.match(/const MODULE_DATA\s*=\s*(\[[\s\S]*?\]);\s*(?:const UNIT_LINKS|$)/);
    if (!match) return [];
    return JSON.parse(match[1]);
  } catch (err) {
    console.error('readModuleData error:', err.message);
    return [];
  }
}

// ── Helper: read the current UNIT_LINKS object from the .js file ──────────────
function readUnitLinks() {
  try {
    const src = fs.readFileSync(MODULES_DATA_PATH, 'utf8');
    const match = src.match(/const UNIT_LINKS\s*=\s*(\{[\s\S]*?\});/);
    if (!match) return {};
    return JSON.parse(match[1]);
  } catch (err) {
    return {};
  }
}

// ── Helper: write MODULE_DATA + UNIT_LINKS back to the .js file ───────────────
function writeModuleData(modules, unitLinks) {
  const json  = JSON.stringify(modules, null, 2);
  const links = JSON.stringify(unitLinks || {}, null, 2);

  const src = `// ============================================================
// UNISA 2026 - Complete Module Data (auto-updated)
// ============================================================

const MODULE_DATA = ${json};

const UNIT_LINKS = ${links};
`;
  fs.writeFileSync(MODULES_DATA_PATH, src, 'utf8');
}

// ── POST /api/upsert-module ──────────────────────────────────────────────────
// Body: { module: { code, title, period, description, assessments, learningUnits, ... } }
// Inserts if new, merges/updates if exists.
app.post('/api/upsert-module', (req, res) => {
  try {
    const incoming = req.body.module;
    if (!incoming || !incoming.code) {
      return res.status(400).json({ error: 'Missing module.code' });
    }

    const modules   = readModuleData();
    const unitLinks = readUnitLinks();

    const code = incoming.code.trim().toUpperCase();
    const idx  = modules.findIndex(m => m.code === code);

    if (idx === -1) {
      // Brand new module — assign next color slot
      incoming.code  = code;
      incoming.color = modules.length % 6;
      modules.push(incoming);
    } else {
      // Merge: update fields that came in, keep existing ones not overridden
      const existing = modules[idx];

      // Always update these if provided
      if (incoming.title)       existing.title       = incoming.title;
      if (incoming.period)      existing.period      = incoming.period;
      if (incoming.lecturer)    existing.lecturer    = incoming.lecturer;
      if (incoming.email)       existing.email       = incoming.email;
      if (incoming.tel)         existing.tel         = incoming.tel;
      if (incoming.description) existing.description = incoming.description;

      // Merge assessments — add new ones, don't duplicate by title
      if (Array.isArray(incoming.assessments) && incoming.assessments.length) {
        const current = existing.assessments || [];
        incoming.assessments.forEach(a => {
          if (!current.find(x => x.title === a.title)) current.push(a);
        });
        existing.assessments = current;
      }

      // Merge tasks same way
      if (Array.isArray(incoming.tasks) && incoming.tasks.length) {
        const current = existing.tasks || [];
        incoming.tasks.forEach(t => {
          if (!current.find(x => x.title === t.title)) current.push(t);
        });
        existing.tasks = current;
      }

      // Merge learning units — add new ones by title
      if (Array.isArray(incoming.learningUnits) && incoming.learningUnits.length) {
        const current = existing.learningUnits || [];
        incoming.learningUnits.forEach(u => {
          if (!current.find(x => x.title === u.title)) current.push(u);
        });
        existing.learningUnits = current;
      }

      modules[idx] = existing;
    }

    // Merge unit links if provided
    if (incoming.unitLinks) {
      unitLinks[code] = { ...(unitLinks[code] || {}), ...incoming.unitLinks };
    }

    writeModuleData(modules, unitLinks);

    res.json({
      ok: true,
      action: idx === -1 ? 'inserted' : 'updated',
      code,
      moduleCount: modules.length,
    });

  } catch (err) {
    console.error('/api/upsert-module error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/modules ──────────────────────────────────────────────────────────
// Returns the current MODULE_DATA as JSON (so the browser can reload it)
app.get('/api/modules', (req, res) => {
  try {
    const modules   = readModuleData();
    const unitLinks = readUnitLinks();
    res.json({ modules, unitLinks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.listen(PORT, () => {
  console.log(`\n✅ UNISA Tracker running on port ${PORT}\n`);
  console.log(`\n http://localhost:${PORT}/ \n`);
});
