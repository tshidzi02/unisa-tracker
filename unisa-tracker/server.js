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

app.listen(PORT, () => {
  console.log(`\n✅ UNISA Tracker running on port ${PORT}\n`);
});
