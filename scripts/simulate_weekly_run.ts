import * as fs from 'fs';
import * as path from 'path';
import { normalizeHtml } from '../src/normalizer.js';
import { computeDiff } from '../src/diff_engine.js';
import { synthesizeSignal } from '../src/synthesizer.js';
import { routeSignal } from '../src/router.js';
import { generateWeeklyDigest, generateDailyPricingFlash, generateReviewQueue } from '../src/digest_generator.js';
import { sendNotification } from '../src/notifier.js';
import { CompetitorSignal, SourceConfig } from '../src/types.js';

async function simulate() {
  console.log('--- Starting Simulated Multi-Competitor Weekly Run ---');
  const fixturesDir = path.resolve('tests/fixtures');
  const outputDir = path.resolve('output');
  const dataDir = path.resolve('data');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const manifest: Record<string, any> = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'manifest.json'), 'utf-8'));

  const simulatedSources: Array<{ id: string; fixtureId: string; source: SourceConfig }> = [
    {
      id: 'n26_pricing',
      fixtureId: 'case_01_n26_savings_rate',
      source: {
        id: 'n26_pricing',
        competitor: 'N26',
        category: 'pricing',
        tier: 'Tier 1',
        url: 'https://n26.com/en-de/plans',
        frequency: 'daily',
        selector: '.pricing-table',
        anchor_terms: ['standard', 'metal', 'interest', 'savings'],
        min_character_count: 100,
        requires_review_by_default: false
      }
    },
    {
      id: 'revolut_ultra',
      fixtureId: 'case_03_revolut_ultra_launch',
      source: {
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
      }
    },
    {
      id: 'scalable_interest',
      fixtureId: 'case_06_scalable_interest_rate',
      source: {
        id: 'scalable_interest',
        competitor: 'Scalable Capital',
        category: 'pricing',
        tier: 'Tier 1',
        url: 'https://de.scalable.capital/en/pricing',
        frequency: 'daily',
        selector: '#pricing',
        anchor_terms: ['prime+', 'interest', 'baader'],
        min_character_count: 100,
        requires_review_by_default: false
      }
    },
    {
      id: 'bitpanda_staking',
      fixtureId: 'case_08_bitpanda_staking_apy',
      source: {
        id: 'bitpanda_staking',
        competitor: 'Bitpanda',
        category: 'pricing',
        tier: 'Tier 1',
        url: 'https://www.bitpanda.com/en/limits-and-fees',
        frequency: 'daily',
        selector: '#fees',
        anchor_terms: ['ethereum', 'solana', 'yields', 'staking'],
        min_character_count: 100,
        requires_review_by_default: false
      }
    },
    {
      id: 'revolut_referrals',
      customBefore: '<main><div class="referral-terms"><h2>Invite Friends</h2><p>Get 40 € for every friend who signs up and orders a card.</p></div></main>',
      customAfter: '<main><div class="referral-terms"><h2>Invite Friends</h2><p>Summer Referral Boost: Get 60 € for every friend who signs up, orders a physical card, and completes 3 purchases of at least 5 € within 21 days.</p></div></main>',
      source: {
        id: 'revolut_referrals',
        competitor: 'Revolut',
        category: 'marketing_promo',
        tier: 'Tier 1',
        url: 'https://www.revolut.com/en-DE/referral-program/',
        frequency: 'weekly',
        selector: '.referral-terms',
        anchor_terms: ['referral', 'invite', 'bonus', 'friend'],
        min_character_count: 100,
        requires_review_by_default: false
      }
    },
    {
      id: 'scalable_promos',
      customBefore: '<main><div class="promotion-card"><h2>Scalable Broker</h2><p>Start investing in 7,500+ stocks and ETFs.</p></div></main>',
      customAfter: '<main><div class="promotion-card"><h2>Portfolio Transfer Bonus</h2><p>Transfer your existing portfolio to Scalable Capital and receive up to 100 € cash bonus directly into your account (valid for transfers over 10,000 €).</p></div></main>',
      source: {
        id: 'scalable_promos',
        competitor: 'Scalable Capital',
        category: 'marketing_promo',
        tier: 'Tier 1',
        url: 'https://de.scalable.capital/en/promotions',
        frequency: 'weekly',
        selector: '.promotion-card',
        anchor_terms: ['bonus', 'transfer', 'portfolio', 'scalable'],
        min_character_count: 100,
        requires_review_by_default: false
      }
    },
    {
      id: 'n26_app_reviews',
      customBefore: '<div class="reviews-content"><div class="score">iOS: 4.7 ★ (85k) | Google Play: 4.5 ★ (120k)</div><p>Users praise smooth daily banking and instant push notifications.</p></div>',
      customAfter: '<div class="reviews-content"><div class="score">iOS: 4.3 ★ (92k) | Google Play: 4.1 ★ (128k)</div><p>Sentiment shift across App Store & Google Play: Surge in 1★-2★ reviews reporting KYC verification loops and biometric login failures following update v12.4. Customer support wait times cited as primary complaint.</p></div>',
      source: {
        id: 'n26_app_reviews',
        competitor: 'N26',
        category: 'app_reviews',
        tier: 'Tier 2',
        url: 'https://play.google.com/store/apps/details?id=de.number26.android',
        ios_url: 'https://apps.apple.com/de/app/n26-the-mobile-bank/id956857260',
        android_url: 'https://play.google.com/store/apps/details?id=de.number26.android',
        frequency: 'weekly',
        selector: '.reviews-content',
        anchor_terms: ['rating', 'reviews', 'sentiment', 'support'],
        min_character_count: 100,
        requires_review_by_default: true
      }
    },
    {
      id: 'bitpanda_app_reviews',
      customBefore: '<div class="reviews-content"><div class="score">iOS: 4.5 ★ (40k) | Google Play: 4.4 ★ (60k)</div><p>Frequent complaints regarding bank deposit clearance speed.</p></div>',
      customAfter: '<div class="reviews-content"><div class="score">iOS: 4.6 ★ (43k) | Google Play: 4.5 ★ (65k)</div><p>Positive sentiment shift across App Store & Google Play: High praise for 0% PayPal instant deposits and streamlined crypto staking UI. Deposit speed complaints down 35% week-over-week.</p></div>',
      source: {
        id: 'bitpanda_app_reviews',
        competitor: 'Bitpanda',
        category: 'app_reviews',
        tier: 'Tier 2',
        url: 'https://play.google.com/store/apps/details?id=com.bitpanda.bitpanda',
        ios_url: 'https://apps.apple.com/de/app/bitpanda-buy-bitcoin-crypto/id1399049449',
        android_url: 'https://play.google.com/store/apps/details?id=com.bitpanda.bitpanda',
        frequency: 'weekly',
        selector: '.reviews-content',
        anchor_terms: ['rating', 'reviews', 'sentiment', 'crypto'],
        min_character_count: 100,
        requires_review_by_default: true
      }
    },
    {
      id: 'n26_noise_check',
      fixtureId: 'case_11_noise_cookie_banner',
      source: {
        id: 'n26_noise_check',
        competitor: 'N26',
        category: 'pricing',
        tier: 'Tier 1',
        url: 'https://n26.com/en-de/plans',
        frequency: 'daily',
        selector: '.plans-table',
        anchor_terms: ['standard', 'interest'],
        min_character_count: 100,
        requires_review_by_default: false
      }
    }
  ];

  const signals: CompetitorSignal[] = [];

  for (const item of simulatedSources as any[]) {
    let beforeHtml = '';
    let afterHtml = '';

    if (item.customBefore && item.customAfter) {
      beforeHtml = item.customBefore;
      afterHtml = item.customAfter;
    } else if (item.fixtureId) {
      beforeHtml = fs.readFileSync(path.join(fixturesDir, `${item.fixtureId}_before.html`), 'utf-8');
      afterHtml = fs.readFileSync(path.join(fixturesDir, `${item.fixtureId}_after.html`), 'utf-8');
    }

    const normBefore = normalizeHtml(beforeHtml, item.source.selector);
    const normAfter = normalizeHtml(afterHtml, item.source.selector);

    const diff = computeDiff(normBefore, normAfter, `${item.source.id}.md`);

    if (!diff.has_change || !diff.is_meaningful) {
      console.log(`- [${item.source.competitor}] ${item.source.id}: No meaningful changes (Noise filtered out cleanly).`);
      continue;
    }

    // Use current 2026 timestamps relative to current scan week
    const now = new Date('2026-08-17T05:00:00Z');
    const timestampMap: Record<string, string> = {
      'n26_pricing': new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),          // Aug 16, 2026
      'revolut_referrals': new Date(now.getTime() - 1.5 * 24 * 3600 * 1000).toISOString(),  // Aug 15, 2026
      'revolut_ultra': new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),        // Aug 15, 2026
      'scalable_interest': new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(),    // Aug 14, 2026
      'scalable_promos': new Date(now.getTime() - 3.5 * 24 * 3600 * 1000).toISOString(),      // Aug 13, 2026
      'n26_app_reviews': new Date(now.getTime() - 4 * 24 * 3600 * 1000).toISOString(),      // Aug 13, 2026
      'bitpanda_staking': new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),     // Aug 12, 2026
      'bitpanda_app_reviews': new Date(now.getTime() - 6 * 24 * 3600 * 1000).toISOString(), // Aug 11, 2026
    };

    const signalTimestamp = timestampMap[item.source.id] || now.toISOString();

    const signal = synthesizeSignal(diff, item.source, signalTimestamp);
    if (signal) {
      const routing = routeSignal(signal);
      signal.status = routing.destination;
      signals.push(signal);
      console.log(`+ [${signal.competitor}] Flagged: ${signal.change_summary} -> ${routing.destination}`);
    }
  }

  fs.writeFileSync(path.join(dataDir, 'signals.json'), JSON.stringify(signals, null, 2), 'utf-8');

  // Generate artifacts for current week
  const dateStr = '2026-08-17';
  const weeklyDigest = generateWeeklyDigest(signals, dateStr);
  const flashAlert = generateDailyPricingFlash(signals, dateStr);
  const stagedReview = generateReviewQueue(signals.filter(s => s.status === 'staged_review'), dateStr);

  await sendNotification({
    autoPublishedCount: signals.filter(s => s.status === 'auto_published').length,
    stagedReviewCount: signals.filter(s => s.status === 'staged_review').length,
    signals,
    digestPath: weeklyDigest,
    flashPath: flashAlert || undefined
  });

  console.log('\n--- Simulation Output Generated ---');
  console.log(`Weekly Digest:     ${weeklyDigest}`);
  console.log(`Daily Flash Alert: ${flashAlert}`);
  console.log(`Review Queue:      ${stagedReview}`);
  console.log('------------------------------------\n');
}

simulate();
