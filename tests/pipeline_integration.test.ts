import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeHtml } from '../src/normalizer.js';
import { computeDiff } from '../src/diff_engine.js';
import { synthesizeSignal } from '../src/synthesizer.js';
import { routeSignal } from '../src/router.js';
import { generateWeeklyDigest, generateDailyPricingFlash, generateReviewQueue } from '../src/digest_generator.js';
import { SourceConfig, CompetitorSignal } from '../src/types.js';

describe('End-to-End Pipeline Integration', () => {
  const outputDir = path.resolve('output');

  beforeEach(() => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  it('Processes realistic multi-competitor snapshot updates and generates complete outputs', () => {
    const fixturesDir = path.resolve('tests/fixtures');

    // 1. N26 Pricing Change (Tier 1 Pricing -> Auto-published)
    const n26Before = fs.readFileSync(path.join(fixturesDir, 'case_01_n26_savings_rate_before.html'), 'utf-8');
    const n26After = fs.readFileSync(path.join(fixturesDir, 'case_01_n26_savings_rate_after.html'), 'utf-8');
    const n26Diff = computeDiff(normalizeHtml(n26Before), normalizeHtml(n26After));

    const n26Source: SourceConfig = {
      id: 'n26_pricing',
      competitor: 'N26',
      category: 'pricing',
      tier: 'Tier 1',
      url: 'https://n26.com/en-de/plans',
      frequency: 'daily',
      selector: '.pricing-table',
      anchor_terms: ['standard', 'metal', 'interest'],
      min_character_count: 100,
      requires_review_by_default: false
    };

    const n26Signal = synthesizeSignal(n26Diff, n26Source)!;
    expect(n26Signal).toBeDefined();
    const n26Routing = routeSignal(n26Signal);
    n26Signal.status = n26Routing.destination;
    expect(n26Signal.status).toBe('auto_published');

    // 2. Revolut Ultra Product Launch (Tier 1 Product Launch -> Staged for Review)
    const revBefore = fs.readFileSync(path.join(fixturesDir, 'case_03_revolut_ultra_launch_before.html'), 'utf-8');
    const revAfter = fs.readFileSync(path.join(fixturesDir, 'case_03_revolut_ultra_launch_after.html'), 'utf-8');
    const revDiff = computeDiff(normalizeHtml(revBefore), normalizeHtml(revAfter));

    const revSource: SourceConfig = {
      id: 'revolut_ultra',
      competitor: 'Revolut',
      category: 'product_launch',
      tier: 'Tier 1',
      url: 'https://www.revolut.com/en-DE/our-pricing-plans/',
      frequency: 'weekly',
      selector: '.pricing-grid',
      anchor_terms: ['standard', 'metal', 'ultra'],
      min_character_count: 100,
      requires_review_by_default: true
    };

    const revSignal = synthesizeSignal(revDiff, revSource)!;
    expect(revSignal).toBeDefined();
    const revRouting = routeSignal(revSignal);
    revSignal.status = revRouting.destination;
    expect(revSignal.status).toBe('staged_review');

    // 3. Scalable Capital Rate Shift (Tier 1 Pricing -> Auto-published)
    const scalBefore = fs.readFileSync(path.join(fixturesDir, 'case_06_scalable_interest_rate_before.html'), 'utf-8');
    const scalAfter = fs.readFileSync(path.join(fixturesDir, 'case_06_scalable_interest_rate_after.html'), 'utf-8');
    const scalDiff = computeDiff(normalizeHtml(scalBefore), normalizeHtml(scalAfter));

    const scalSource: SourceConfig = {
      id: 'scalable_pricing',
      competitor: 'Scalable Capital',
      category: 'pricing',
      tier: 'Tier 1',
      url: 'https://de.scalable.capital/en/pricing',
      frequency: 'daily',
      selector: '#pricing',
      anchor_terms: ['prime+', 'interest', 'baader'],
      min_character_count: 100,
      requires_review_by_default: false
    };

    const scalSignal = synthesizeSignal(scalDiff, scalSource)!;
    expect(scalSignal).toBeDefined();
    const scalRouting = routeSignal(scalSignal);
    scalSignal.status = scalRouting.destination;
    expect(scalSignal.status).toBe('auto_published');

    const allSignals = [n26Signal, revSignal, scalSignal];

    // Generate Weekly Digest
    const weeklyDigestPath = generateWeeklyDigest(allSignals, '2024-04-15');
    expect(fs.existsSync(weeklyDigestPath)).toBe(true);
    const weeklyContent = fs.readFileSync(weeklyDigestPath, 'utf-8');
    expect(weeklyContent).toContain('N26');
    expect(weeklyContent).toContain('Scalable Capital');
    expect(weeklyContent).toContain('Trade Republic');
    expect(weeklyContent).toContain('Detailed Signal Lineage & Diff Verification');

    // Generate Daily Pricing Flash
    const flashPath = generateDailyPricingFlash(allSignals, '2024-04-15');
    expect(flashPath).not.toBeNull();
    const flashContent = fs.readFileSync(flashPath!, 'utf-8');
    expect(flashContent).toContain('⚡ Daily Pricing Flash Alert');
    expect(flashContent).toContain('N26');
    expect(flashContent).toContain('Scalable Capital');

    // Generate Staged Review Queue
    const reviewPath = generateReviewQueue([revSignal], '2024-04-15');
    expect(fs.existsSync(reviewPath)).toBe(true);
    const reviewContent = fs.readFileSync(reviewPath, 'utf-8');
    expect(reviewContent).toContain('Revolut');
    expect(reviewContent).toContain('PRODUCT_LAUNCH');
    expect(reviewContent).toContain('PM Triage Decision');
  });
});
