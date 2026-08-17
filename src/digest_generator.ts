import * as fs from 'fs';
import * as path from 'path';
import { CompetitorSignal } from './types.js';

export function generateWeeklyDigest(
  signals: CompetitorSignal[],
  dateStr = new Date().toISOString().slice(0, 10)
): string {
  const outputDir = path.resolve('output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const published = signals.filter(s => s.status === 'auto_published' || s.status === 'approved');
  const staged = signals.filter(s => s.status === 'staged_review');

  const lines: string[] = [
    `# Neobank Competitive Intelligence Digest — Week of ${dateStr}`,
    '',
    `*Automated competitive intelligence for Fintech PMs tracking N26, Revolut, Scalable Capital, and Bitpanda against Trade Republic baseline.*`,
    '',
    '## 1. Executive Summary',
    '',
    '| Competitor | Category | Change Summary | Why This Matters for PMs | Source |',
    '|---|---|---|---|---|'
  ];

  if (published.length === 0) {
    lines.push('| *No changes* | - | No verified signals published this period. | - | - |');
  } else {
    for (const sig of published) {
      lines.push(`| **${sig.competitor}** | \`${sig.category}\` | ${sig.change_summary.replace(/\|/g, '\\|')} | ${sig.why_it_matters.replace(/\|/g, '\\|')} | [${sig.source_tier}](${sig.source_url}) |`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 2. Detailed Signal Lineage & Diff Verification');
  lines.push('');

  for (const sig of published) {
    lines.push(`### ${sig.competitor} — ${sig.change_summary}`);
    lines.push(`- **Timestamp**: \`${sig.timestamp}\``);
    lines.push(`- **Source**: [${sig.source_url}](${sig.source_url}) (${sig.source_tier})`);
    lines.push(`- **Strategic Impact**: ${sig.why_it_matters}`);
    lines.push('');
    lines.push('```diff');
    lines.push(sig.diff_snippet || '# Raw diff unavailable');
    lines.push('```');
    lines.push('');
  }

  if (staged.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push(`## 3. Staged Items Awaiting PM Triage (${staged.length} items)`);
    lines.push(`*Review in \`output/staged_review.md\` (Monday 09:00 CET SLA)*`);
  }

  const digestContent = lines.join('\n');
  const digestPath = path.join(outputDir, `weekly_digest_${dateStr}.md`);
  const latestDigestPath = path.join(outputDir, 'weekly_digest.md');

  fs.writeFileSync(digestPath, digestContent, 'utf-8');
  fs.writeFileSync(latestDigestPath, digestContent, 'utf-8');

  return latestDigestPath;
}

export function generateDailyPricingFlash(
  signals: CompetitorSignal[],
  dateStr = new Date().toISOString().slice(0, 10)
): string | null {
  const pricingSignals = signals.filter(s => s.category === 'pricing' && (s.status === 'auto_published' || s.status === 'approved'));
  if (pricingSignals.length === 0) return null;

  const outputDir = path.resolve('output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const lines: string[] = [
    `# ⚡ Daily Pricing Flash Alert — ${dateStr}`,
    '',
    `*Urgent pricing / fee modifications detected within the last 24 hours.*`,
    '',
    ...pricingSignals.map(sig => [
      `### [${sig.competitor}] ${sig.change_summary}`,
      `- **Impact vs Trade Republic**: ${sig.why_it_matters}`,
      `- **Source**: [${sig.source_url}](${sig.source_url}) (\`${sig.source_tier}\`)`,
      `- **Detected**: \`${sig.timestamp}\``,
      '',
      '```diff',
      sig.diff_snippet,
      '```',
      ''
    ].join('\n'))
  ];

  const flashContent = lines.join('\n');
  const flashPath = path.join(outputDir, `daily_pricing_flash_${dateStr}.md`);
  const latestFlashPath = path.join(outputDir, 'daily_pricing_flash.md');

  fs.writeFileSync(flashPath, flashContent, 'utf-8');
  fs.writeFileSync(latestFlashPath, flashContent, 'utf-8');

  return latestFlashPath;
}

export function generateReviewQueue(
  stagedSignals: CompetitorSignal[],
  dateStr = new Date().toISOString().slice(0, 10)
): string {
  const outputDir = path.resolve('output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const lines: string[] = [
    `# Human-in-the-Loop Review Queue (PM SLA: Monday 09:00 CET)`,
    `*Items staged for verification before inclusion in the final executive digest.*`,
    '',
    `Total Staged Items: **${stagedSignals.length}**`,
    ''
  ];

  if (stagedSignals.length === 0) {
    lines.push('✅ **Queue Empty**: No items currently pending human review.');
  } else {
    for (const [idx, sig] of stagedSignals.entries()) {
      lines.push(`## [Item ${idx + 1}] ${sig.competitor} — ${sig.category.toUpperCase()}`);
      lines.push(`- **Signal ID**: \`${sig.id}\``);
      lines.push(`- **Source**: [${sig.source_url}](${sig.source_url}) (${sig.source_tier})`);
      lines.push(`- **Escalation Reason**: *${sig.escalation_reason || 'Tier requirement'}*`);
      lines.push(`- **Draft Summary**: ${sig.change_summary}`);
      lines.push(`- **Strategic Impact Note**: ${sig.why_it_matters}`);
      lines.push('');
      lines.push('```diff');
      lines.push(sig.diff_snippet);
      lines.push('```');
      lines.push('');
      lines.push(`**PM Triage Decision**:`);
      lines.push(`- [ ] **APPROVE**: \`npm run triage -- --approve ${sig.id}\``);
      lines.push(`- [ ] **REJECT / NOISE**: \`npm run triage -- --reject ${sig.id}\``);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  const reviewContent = lines.join('\n');
  const reviewPath = path.join(outputDir, 'staged_review.md');
  fs.writeFileSync(reviewPath, reviewContent, 'utf-8');
  return reviewPath;
}
