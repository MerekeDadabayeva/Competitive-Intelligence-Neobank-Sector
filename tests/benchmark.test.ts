import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeHtml, extractNumericTokens } from '../src/normalizer.js';
import { computeDiff } from '../src/diff_engine.js';
import { synthesizeSignal } from '../src/synthesizer.js';
import { routeSignal } from '../src/router.js';
import { SourceConfig } from '../src/types.js';

interface FixtureMeta {
  id: string;
  competitor: 'N26' | 'Revolut' | 'Scalable Capital' | 'Bitpanda';
  category: 'pricing' | 'product_launch' | 'positioning' | 'noise';
  tier: 'Tier 1' | 'Tier 2';
  expected_change: boolean;
  source_url: string;
  archive_url_before: string;
  archive_url_after: string;
  timestamp_before: string;
  timestamp_after: string;
  description: string;
  ground_truth_summary?: string;
  ground_truth_why_it_matters?: string;
}

describe('Competitive Monitoring Pipeline — Precision & Recall Benchmark', () => {
  const fixturesDir = path.resolve('tests/fixtures');
  const manifestPath = path.join(fixturesDir, 'manifest.json');
  let manifest: Record<string, FixtureMeta> = {};

  beforeAll(() => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  });

  it('Step 0: Validates that all 20 Wayback Machine fixtures resolve and contain valid markup', () => {
    const fixtureIds = Object.keys(manifest);
    expect(fixtureIds.length).toBe(20);

    for (const id of fixtureIds) {
      const beforeHtml = fs.readFileSync(path.join(fixturesDir, `${id}_before.html`), 'utf-8');
      const afterHtml = fs.readFileSync(path.join(fixturesDir, `${id}_after.html`), 'utf-8');
      expect(beforeHtml.length).toBeGreaterThan(0);
      expect(afterHtml.length).toBeGreaterThan(0);
      expect(manifest[id].archive_url_before).toMatch(/^https:\/\/web\.archive\.org\/web\//);
    }
  });

  it('Metric 1: Achieves >= 90% Precision and 100% Recall across all 20 fixtures', () => {
    let tp = 0; // True Positive
    let fp = 0; // False Positive
    let fn = 0; // False Negative
    let tn = 0; // True Negative

    const testResults: Array<{ id: string; expected: boolean; actual: boolean; description: string }> = [];

    for (const [id, meta] of Object.entries(manifest)) {
      const beforeHtml = fs.readFileSync(path.join(fixturesDir, `${id}_before.html`), 'utf-8');
      const afterHtml = fs.readFileSync(path.join(fixturesDir, `${id}_after.html`), 'utf-8');

      const normBefore = normalizeHtml(beforeHtml);
      const normAfter = normalizeHtml(afterHtml);

      const diff = computeDiff(normBefore, normAfter);
      const detectedChange = diff.has_change && diff.is_meaningful;

      testResults.push({
        id,
        expected: meta.expected_change,
        actual: detectedChange,
        description: meta.description
      });

      if (meta.expected_change && detectedChange) {
        tp++;
      } else if (!meta.expected_change && detectedChange) {
        fp++;
      } else if (meta.expected_change && !detectedChange) {
        fn++;
      } else {
        tn++;
      }
    }

    const precision = tp / (tp + fp);
    const recall = tp / (tp + fn);

    console.log(`\n========================================`);
    console.log(`Benchmark Results:`);
    console.log(`- True Positives (TP):  ${tp} / 10`);
    console.log(`- False Positives (FP): ${fp} / 10`);
    console.log(`- True Negatives (TN):  ${tn} / 10`);
    console.log(`- False Negatives (FN): ${fn} / 10`);
    console.log(`- Measured Precision:   ${(precision * 100).toFixed(1)}% (Target: >= 90.0%)`);
    console.log(`- Measured Recall:      ${(recall * 100).toFixed(1)}% (Target: 100.0%)`);
    console.log(`========================================\n`);

    // Verify targets
    expect(precision).toBeGreaterThanOrEqual(0.90);
    expect(recall).toBe(1.0);
    expect(fp).toBe(0); // Noise patterns (cookies, sessions, copyright, classes) rejected
    expect(fn).toBe(0); // No real fee changes missed
  });

  it('Metric 2: Dedicated Numeric Sensitivity Test detects micro-fee change (1.70% -> 1.65%)', () => {
    const microFixture = manifest['case_10_micro_numeric_fee_shift'];
    expect(microFixture).toBeDefined();

    const beforeHtml = fs.readFileSync(path.join(fixturesDir, `case_10_micro_numeric_fee_shift_before.html`), 'utf-8');
    const afterHtml = fs.readFileSync(path.join(fixturesDir, `case_10_micro_numeric_fee_shift_after.html`), 'utf-8');

    const normBefore = normalizeHtml(beforeHtml);
    const normAfter = normalizeHtml(afterHtml);

    const diff = computeDiff(normBefore, normAfter);
    expect(diff.has_change).toBe(true);
    expect(diff.is_meaningful).toBe(true);

    const numsBefore = extractNumericTokens(diff.removed_lines.join(' '));
    const numsAfter = extractNumericTokens(diff.added_lines.join(' '));

    expect(numsBefore).toContain('1.70%');
    expect(numsAfter).toContain('1.65%');
  });

  it('Synthesizer & Baseline Grounding: Produces Trade Republic comparative impact notes', () => {
    const n26SavingsMeta = manifest['case_01_n26_savings_rate'];
    const beforeHtml = fs.readFileSync(path.join(fixturesDir, `case_01_n26_savings_rate_before.html`), 'utf-8');
    const afterHtml = fs.readFileSync(path.join(fixturesDir, `case_01_n26_savings_rate_after.html`), 'utf-8');

    const normBefore = normalizeHtml(beforeHtml);
    const normAfter = normalizeHtml(afterHtml);
    const diff = computeDiff(normBefore, normAfter);

    const dummySource: SourceConfig = {
      id: 'n26_plans',
      competitor: 'N26',
      category: 'pricing',
      tier: 'Tier 1',
      url: 'https://n26.com/en-de/plans',
      frequency: 'daily',
      selector: '.pricing-table',
      anchor_terms: ['fee', 'standard', 'metal', 'interest'],
      min_character_count: 100,
      requires_review_by_default: false
    };

    const signal = synthesizeSignal(diff, dummySource);
    expect(signal).not.toBeNull();
    expect(signal?.competitor).toBe('N26');
    expect(signal?.why_it_matters).toContain('Trade Republic');
    expect(signal?.why_it_matters).toContain('3.75%');
  });

  it('Router Gating: Strictly enforces Unidirectional Escalation Rule', () => {
    // 1. Tier 1 Clean Pricing -> Auto-publish
    const tier1PricingSignal = {
      id: 'sig_1',
      competitor: 'N26' as const,
      category: 'pricing' as const,
      source_url: 'https://n26.com/en-de/plans',
      source_tier: 'Tier 1' as const,
      timestamp: new Date().toISOString(),
      change_summary: 'Interest rate updated',
      why_it_matters: 'Impacts cash deposits',
      diff_snippet: '+ 3.00%\n- 1.26%',
      requires_review: false,
      status: 'auto_published' as const
    };
    const route1 = routeSignal(tier1PricingSignal);
    expect(route1.destination).toBe('auto_published');

    // 2. Tier 1 Product Launch -> Review Queue (cannot bypass)
    const tier1ProductSignal = {
      ...tier1PricingSignal,
      category: 'product_launch' as const
    };
    const route2 = routeSignal(tier1ProductSignal);
    expect(route2.destination).toBe('staged_review');

    // 3. Tier 2 Source -> Review Queue (cannot bypass)
    const tier2Signal = {
      ...tier1PricingSignal,
      source_tier: 'Tier 2' as const
    };
    const route3 = routeSignal(tier2Signal);
    expect(route3.destination).toBe('staged_review');

    // 4. Tier 1 Pricing Escalated by synthesizer -> Review Queue
    const escalatedSignal = {
      ...tier1PricingSignal,
      requires_review: true,
      escalation_reason: 'Ambiguous table structure detected'
    };
    const route4 = routeSignal(escalatedSignal);
    expect(route4.destination).toBe('staged_review');
  });
});
