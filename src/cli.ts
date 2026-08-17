import * as fs from 'fs';
import * as path from 'path';
import { SourceConfig, CompetitorSignal } from './types.js';
import { fetchSource } from './fetcher.js';
import { normalizeHtml } from './normalizer.js';
import { computeDiff } from './diff_engine.js';
import { synthesizeSignal } from './synthesizer.js';
import { routeSignal } from './router.js';
import { generateWeeklyDigest, generateDailyPricingFlash, generateReviewQueue } from './digest_generator.js';
import { sendNotification } from './notifier.js';

const sourcesPath = path.resolve('config/sources.json');
const signalsDbPath = path.resolve('data/signals.json');

function ensureDataDirs() {
  const dirs = ['data', 'data/snapshots', 'output'];
  for (const d of dirs) {
    const full = path.resolve(d);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
    }
  }
}

function loadSources(): SourceConfig[] {
  const content = fs.readFileSync(sourcesPath, 'utf-8');
  return JSON.parse(content).sources;
}

function loadSignals(): CompetitorSignal[] {
  if (fs.existsSync(signalsDbPath)) {
    return JSON.parse(fs.readFileSync(signalsDbPath, 'utf-8'));
  }
  return [];
}

function saveSignals(signals: CompetitorSignal[]) {
  ensureDataDirs();
  fs.writeFileSync(signalsDbPath, JSON.stringify(signals, null, 2), 'utf-8');
}

export async function runScan(pricingOnly = false) {
  console.log(`[Competitive Pipeline] Starting scan (pricingOnly=${pricingOnly})...`);
  ensureDataDirs();

  const allSources = loadSources();
  const sources = pricingOnly ? allSources.filter(s => s.category === 'pricing') : allSources;
  const existingSignals = loadSignals();
  const newSignals: CompetitorSignal[] = [];

  for (const src of sources) {
    console.log(`\nScanning [${src.competitor}] ${src.id} (${src.url})...`);

    // Fetch and check health
    const fetchRes = await fetchSource(src);
    if (fetchRes.health.status !== 'HEALTHY') {
      console.warn(`⚠️ Warning: ${fetchRes.health.message}`);
      continue;
    }

    // Normalize current HTML
    const currentNormalized = normalizeHtml(fetchRes.raw_html, src.selector);

    // Read previous snapshot if available
    const snapshotDir = path.resolve(`data/snapshots/${src.competitor.replace(/\s+/g, '_').toLowerCase()}/${src.id}`);
    const files = fs.existsSync(snapshotDir)
      ? fs.readdirSync(snapshotDir).filter(f => f.endsWith('.html')).sort()
      : [];

    if (files.length < 2) {
      console.log(`Initial snapshot saved. Next scan will detect diffs.`);
      continue;
    }

    const previousSnapshotHtml = fs.readFileSync(path.join(snapshotDir, files[files.length - 2]), 'utf-8');
    const previousNormalized = normalizeHtml(previousSnapshotHtml, src.selector);

    // Compute diff
    const diffRes = computeDiff(previousNormalized, currentNormalized, `${src.id}.md`);
    if (!diffRes.has_change || !diffRes.is_meaningful) {
      console.log(`No meaningful changes detected.`);
      continue;
    }

    console.log(`⚡ Change detected! (${diffRes.added_lines.length} lines added, ${diffRes.removed_lines.length} removed)`);

    // Synthesize signal
    const signal = synthesizeSignal(diffRes, src, fetchRes.timestamp);
    if (!signal) continue;

    // Apply router
    const routing = routeSignal(signal);
    signal.status = routing.destination;
    console.log(`Routed to: ${routing.destination} (${routing.reason})`);

    newSignals.push(signal);
    existingSignals.push(signal);
  }

  saveSignals(existingSignals);

  // Generate digests
  const weeklyDigestPath = generateWeeklyDigest(existingSignals);
  const flashPath = generateDailyPricingFlash(newSignals);
  const stagedSignals = existingSignals.filter(s => s.status === 'staged_review');
  const reviewPath = generateReviewQueue(stagedSignals);

  // Send Push Notification
  const autoPubCount = newSignals.filter(s => s.status === 'auto_published').length;
  await sendNotification({
    autoPublishedCount: autoPubCount,
    stagedReviewCount: stagedSignals.length,
    signals: newSignals,
    digestPath: weeklyDigestPath,
    flashPath: flashPath || undefined
  });

  console.log(`\nScan complete. Outputs generated in output/:`);
  console.log(`- Weekly Digest: ${weeklyDigestPath}`);
  if (flashPath) console.log(`- Daily Pricing Flash: ${flashPath}`);
  console.log(`- Review Queue: ${reviewPath} (${stagedSignals.length} pending)`);
}

export function handleTriage(approveId?: string, rejectId?: string) {
  const signals = loadSignals();

  if (approveId) {
    const sig = signals.find(s => s.id === approveId);
    if (!sig) {
      console.error(`Signal ${approveId} not found.`);
      return;
    }
    sig.status = 'approved';
    saveSignals(signals);
    generateWeeklyDigest(signals);
    generateReviewQueue(signals.filter(s => s.status === 'staged_review'));
    console.log(`✓ Approved signal ${approveId} and published to weekly digest.`);
  } else if (rejectId) {
    const sig = signals.find(s => s.id === rejectId);
    if (!sig) {
      console.error(`Signal ${rejectId} not found.`);
      return;
    }
    sig.status = 'rejected';
    saveSignals(signals);
    generateReviewQueue(signals.filter(s => s.status === 'staged_review'));
    console.log(`✗ Rejected signal ${rejectId} (marked as noise / false positive).`);
  } else {
    const staged = signals.filter(s => s.status === 'staged_review');
    console.log(`\n=== PM Review Queue (${staged.length} items pending) ===\n`);
    if (staged.length === 0) {
      console.log(`Queue is clean! No items pending.`);
      return;
    }
    for (const s of staged) {
      console.log(`ID: ${s.id}`);
      console.log(`Competitor: ${s.competitor} [${s.category}]`);
      console.log(`Change: ${s.change_summary}`);
      console.log(`Impact: ${s.why_it_matters}`);
      console.log(`Escalation: ${s.escalation_reason}`);
      console.log(`Command to approve: npm run triage -- --approve ${s.id}`);
      console.log(`Command to reject:  npm run triage -- --reject ${s.id}`);
      console.log('--------------------------------------------------');
    }
  }
}

// CLI Arg Parser
const args = process.argv.slice(2);
const command = args[0] || 'help';

if (command === 'scan') {
  const pricingOnly = args.includes('--pricing-only');
  runScan(pricingOnly);
} else if (command === 'triage') {
  const approveIdx = args.indexOf('--approve');
  const rejectIdx = args.indexOf('--reject');
  const approveId = approveIdx !== -1 ? args[approveIdx + 1] : undefined;
  const rejectId = rejectIdx !== -1 ? args[rejectIdx + 1] : undefined;
  handleTriage(approveId, rejectId);
} else if (command === 'digest') {
  const signals = loadSignals();
  const path = generateWeeklyDigest(signals);
  console.log(`Digest regenerated at: ${path}`);
} else if (command === 'help') {
  console.log(`
Competitive Monitoring Pipeline CLI
-----------------------------------
npm run scan             Run full scan across all 4 competitors
npm run scan:pricing     Run daily pricing scan only
npm run triage           View review queue items
npm run triage -- --approve <id>  Approve staged signal
npm run triage -- --reject <id>   Reject noise/false positive
npm run digest           Re-compile weekly digest
npm run test:benchmark   Run 20-fixture precision/recall benchmark
  `);
}
