import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const app = express();
app.use(express.json());

// Serve static dashboard files with no-cache for instant live updates
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});
app.use(express.static(path.join(ROOT, 'public'), { etag: false, maxAge: 0 }));

// ─── Data Helpers ────────────────────────────────────────────────

function readJSON(filePath: string): any {
  const abs = path.resolve(ROOT, filePath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf-8'));
}

function writeJSON(filePath: string, data: any): void {
  const abs = path.resolve(ROOT, filePath);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(data, null, 2), 'utf-8');
}

function readMarkdown(filePath: string): string {
  const abs = path.resolve(ROOT, filePath);
  if (!fs.existsSync(abs)) return '';
  return fs.readFileSync(abs, 'utf-8');
}

// ─── API: Signals ────────────────────────────────────────────────

app.get('/api/signals', (_req, res) => {
  const signals = readJSON('data/signals.json') || [];
  res.json(signals);
});

app.post('/api/signals/:id/approve', (req, res) => {
  const signals = readJSON('data/signals.json') || [];
  const signal = signals.find((s: any) => s.id === req.params.id);
  if (!signal) return res.status(404).json({ error: 'Signal not found' });

  signal.status = 'approved';
  writeJSON('data/signals.json', signals);

  // Regenerate outputs
  regenerateOutputs(signals);

  res.json({ success: true, signal });
});

app.post('/api/signals/:id/reject', (req, res) => {
  const signals = readJSON('data/signals.json') || [];
  const signal = signals.find((s: any) => s.id === req.params.id);
  if (!signal) return res.status(404).json({ error: 'Signal not found' });

  signal.status = 'rejected';
  writeJSON('data/signals.json', signals);

  // Regenerate outputs
  regenerateOutputs(signals);

  res.json({ success: true, signal });
});

// ─── API: Config ─────────────────────────────────────────────────

app.get('/api/baseline', (_req, res) => {
  const baseline = readJSON('config/baseline.json');
  if (!baseline) return res.status(404).json({ error: 'Baseline not found' });
  res.json(baseline);
});

app.get('/api/sources', (_req, res) => {
  const sources = readJSON('config/sources.json');
  if (!sources) return res.status(404).json({ error: 'Sources not found' });
  res.json(sources);
});

// ─── API: Digest ─────────────────────────────────────────────────

app.get('/api/digest', (_req, res) => {
  const digest = readMarkdown('output/weekly_digest.md');
  res.json({ content: digest });
});

app.get('/api/flash', (_req, res) => {
  const flash = readMarkdown('output/daily_pricing_flash.md');
  res.json({ content: flash });
});

// ─── API: Health ─────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  const signals = readJSON('data/signals.json') || [];
  const sources = readJSON('config/sources.json');
  const reminders = readMarkdown('output/manual_check_reminders.md');

  res.json({
    status: 'ok',
    signals_count: signals.length,
    sources_count: sources?.sources?.length || 0,
    has_manual_reminders: reminders.length > 0,
    timestamp: new Date().toISOString()
  });
});

// ─── Output Regeneration ─────────────────────────────────────────

function regenerateOutputs(signals: any[]) {
  // Regenerate weekly digest
  const published = signals.filter((s: any) => s.status === 'auto_published' || s.status === 'approved');
  const staged = signals.filter((s: any) => s.status === 'staged_review');
  const dateStr = new Date().toISOString().slice(0, 10);

  // Weekly Digest
  const digestLines: string[] = [
    `# Neobank Competitive Intelligence Digest — Week of ${dateStr}`,
    '',
    `*Automated competitive intelligence for Fintech PMs tracking N26, Revolut, Scalable Capital, and Bitpanda against Trade Republic baseline.*`,
    '',
    '## 1. Executive Summary',
    '',
    '| Competitor | Category | Change Summary | Why This Matters for PMs | Source |',
    '|---|---|---|---|---|'
  ];

  for (const sig of published) {
    digestLines.push(`| **${sig.competitor}** | \`${sig.category}\` | ${sig.change_summary.replace(/\|/g, '\\|')} | ${sig.why_it_matters.replace(/\|/g, '\\|')} | [${sig.source_tier}](${sig.source_url}) |`);
  }

  digestLines.push('', '---', '', '## 2. Detailed Signal Lineage & Diff Verification', '');

  for (const sig of published) {
    digestLines.push(`### ${sig.competitor} — ${sig.change_summary}`);
    digestLines.push(`- **Timestamp**: \`${sig.timestamp}\``);
    digestLines.push(`- **Source**: [${sig.source_url}](${sig.source_url}) (${sig.source_tier})`);
    digestLines.push(`- **Strategic Impact**: ${sig.why_it_matters}`);
    digestLines.push('', '```diff', sig.diff_snippet || '# Raw diff unavailable', '```', '');
  }

  if (staged.length > 0) {
    digestLines.push('---', '', `## 3. Staged Items Awaiting PM Triage (${staged.length} items)`);
    digestLines.push(`*Review in \`output/staged_review.md\` (Monday 09:00 CET SLA)*`);
  }

  const outputDir = path.resolve(ROOT, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'weekly_digest.md'), digestLines.join('\n'), 'utf-8');

  // Review Queue
  const reviewLines: string[] = [
    `# Human-in-the-Loop Review Queue (PM SLA: Monday 09:00 CET)`,
    `*Items staged for verification before inclusion in the final executive digest.*`,
    '',
    `Total Staged Items: **${staged.length}**`,
    ''
  ];

  if (staged.length === 0) {
    reviewLines.push('✅ **Queue Empty**: No items currently pending human review.');
  } else {
    for (const [idx, sig] of staged.entries()) {
      reviewLines.push(`## [Item ${idx + 1}] ${sig.competitor} — ${sig.category.toUpperCase()}`);
      reviewLines.push(`- **Signal ID**: \`${sig.id}\``);
      reviewLines.push(`- **Source**: [${sig.source_url}](${sig.source_url}) (${sig.source_tier})`);
      reviewLines.push(`- **Escalation Reason**: *${sig.escalation_reason || 'Tier requirement'}*`);
      reviewLines.push(`- **Draft Summary**: ${sig.change_summary}`);
      reviewLines.push(`- **Strategic Impact Note**: ${sig.why_it_matters}`);
      reviewLines.push('', '```diff', sig.diff_snippet, '```', '');
      reviewLines.push('---', '');
    }
  }
  fs.writeFileSync(path.join(outputDir, 'staged_review.md'), reviewLines.join('\n'), 'utf-8');
}

// ─── Start Server ────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3847', 10);

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n┌─────────────────────────────────────────────────┐`);
    console.log(`│  Competitive Intelligence Dashboard             │`);
    console.log(`│  → http://localhost:${PORT}                        │`);
    console.log(`│                                                 │`);
    console.log(`│  API Endpoints:                                 │`);
    console.log(`│    GET  /api/signals     Signal feed             │`);
    console.log(`│    GET  /api/baseline    Trade Republic baseline │`);
    console.log(`│    GET  /api/sources     Source configuration    │`);
    console.log(`│    GET  /api/digest      Weekly digest (MD)      │`);
    console.log(`│    POST /api/signals/:id/approve                │`);
    console.log(`│    POST /api/signals/:id/reject                 │`);
    console.log(`└─────────────────────────────────────────────────┘\n`);
  });
}

export default app;
export { app };
