/**
 * HELD-OUT VALIDATION SET
 * 
 * These 10 fixtures were NOT seen during development of the normalizer or diff engine.
 * They test novel DOM structures, edge-case noise patterns, and numeric formats
 * that differ from the original 20 training fixtures.
 * 
 * Purpose: Detect overfitting in the noise-filtering logic.
 */

import * as fs from 'fs';
import * as path from 'path';

const heldOutDir = path.resolve('tests/held_out');
if (!fs.existsSync(heldOutDir)) {
  fs.mkdirSync(heldOutDir, { recursive: true });
}

export interface HeldOutFixture {
  id: string;
  competitor: string;
  expected_change: boolean;
  description: string;
  html_before: string;
  html_after: string;
}

export const heldOutFixtures: HeldOutFixture[] = [

  // ── GENUINE CHANGES (5 cases, novel structures) ──────────────────────

  // H1: Basis-point fee in a definition list (never seen <dl> structure)
  {
    id: "held_01_dl_basis_point_fee",
    competitor: "Revolut",
    expected_change: true,
    description: "Crypto spread fee change inside a <dl> definition list (0.50% -> 0.45%), the originally-specced PRD sensitivity case",
    html_before: `
      <main>
        <h2>Crypto Fees</h2>
        <dl class="fee-schedule">
          <dt>Bitcoin (BTC) spread</dt>
          <dd>0.50%</dd>
          <dt>Ethereum (ETH) spread</dt>
          <dd>0.75%</dd>
        </dl>
      </main>
    `,
    html_after: `
      <main>
        <h2>Crypto Fees</h2>
        <dl class="fee-schedule">
          <dt>Bitcoin (BTC) spread</dt>
          <dd>0.45%</dd>
          <dt>Ethereum (ETH) spread</dt>
          <dd>0.75%</dd>
        </dl>
      </main>
    `
  },

  // H2: Fee removal expressed as text change (not numeric)
  {
    id: "held_02_text_fee_removal",
    competitor: "N26",
    expected_change: true,
    description: "ATM fee policy change from conditional free to unconditionally free (textual, not purely numeric)",
    html_before: `
      <main>
        <section class="atm-fees">
          <h3>ATM Withdrawals</h3>
          <p>Free for withdrawals above 50 € at partner ATMs. 2.00 € fee for withdrawals below 50 €.</p>
        </section>
      </main>
    `,
    html_after: `
      <main>
        <section class="atm-fees">
          <h3>ATM Withdrawals</h3>
          <p>Free for all withdrawals at any ATM in the Eurozone. No minimum amount required.</p>
        </section>
      </main>
    `
  },

  // H3: New row added to an existing HTML table (novel: <thead>/<tbody> structure)
  {
    id: "held_03_new_table_row",
    competitor: "Scalable Capital",
    expected_change: true,
    description: "New asset class (Commodities) added as a row to the fee table",
    html_before: `
      <main>
        <table class="product-fees">
          <thead><tr><th>Asset Class</th><th>Order Fee</th></tr></thead>
          <tbody>
            <tr><td>Stocks</td><td>0.99 €</td></tr>
            <tr><td>ETFs (PRIME)</td><td>0.00 €</td></tr>
            <tr><td>Crypto</td><td>0.99 €</td></tr>
          </tbody>
        </table>
      </main>
    `,
    html_after: `
      <main>
        <table class="product-fees">
          <thead><tr><th>Asset Class</th><th>Order Fee</th></tr></thead>
          <tbody>
            <tr><td>Stocks</td><td>0.99 €</td></tr>
            <tr><td>ETFs (PRIME)</td><td>0.00 €</td></tr>
            <tr><td>Crypto</td><td>0.99 €</td></tr>
            <tr><td>Commodities</td><td>0.99 €</td></tr>
          </tbody>
        </table>
      </main>
    `
  },

  // H4: Interest rate inside deeply nested React-style divs with data attributes
  {
    id: "held_04_nested_react_divs",
    competitor: "Bitpanda",
    expected_change: true,
    description: "Cash Plus yield change buried inside deeply nested React-style component divs",
    html_before: `
      <main>
        <div data-component="CashPlusWidget" data-v="3.2.1">
          <div class="widget-inner">
            <div class="yield-display">
              <span data-testid="apy-value">2.89% APY</span>
              <span class="label">on EUR deposits</span>
            </div>
          </div>
        </div>
      </main>
    `,
    html_after: `
      <main>
        <div data-component="CashPlusWidget" data-v="3.3.0">
          <div class="widget-inner">
            <div class="yield-display">
              <span data-testid="apy-value">3.21% APY</span>
              <span class="label">on EUR deposits</span>
            </div>
          </div>
        </div>
      </main>
    `
  },

  // H5: Pricing tier renamed (not just a number change)
  {
    id: "held_05_tier_rename",
    competitor: "Revolut",
    expected_change: true,
    description: "Plan tier renamed from 'Premium' to 'Premium Pro' with adjusted pricing",
    html_before: `
      <main>
        <div class="plan-cards">
          <div class="card"><h3>Standard</h3><p>0 €/mo</p></div>
          <div class="card"><h3>Premium</h3><p>7.99 €/mo</p></div>
          <div class="card"><h3>Metal</h3><p>13.99 €/mo</p></div>
        </div>
      </main>
    `,
    html_after: `
      <main>
        <div class="plan-cards">
          <div class="card"><h3>Standard</h3><p>0 €/mo</p></div>
          <div class="card"><h3>Premium Pro</h3><p>9.99 €/mo</p></div>
          <div class="card"><h3>Metal</h3><p>13.99 €/mo</p></div>
        </div>
      </main>
    `
  },

  // ── NOISE / NON-CHANGES (5 cases, novel noise patterns) ──────────────

  // H6: NOISE — A/B test variant attribute swap (never seen data-variant)
  {
    id: "held_06_noise_ab_test_variant",
    competitor: "N26",
    expected_change: false,
    description: "A/B test data-variant attribute changed on plan cards; all visible content identical",
    html_before: `
      <main>
        <div class="plans" data-variant="control-2024Q1" data-experiment="pricing_v4">
          <div class="plan"><h3>Standard</h3><p>0.00 €/mo</p><p>Interest: 2.26% p.a.</p></div>
        </div>
      </main>
    `,
    html_after: `
      <main>
        <div class="plans" data-variant="treatment-2024Q2" data-experiment="pricing_v5">
          <div class="plan"><h3>Standard</h3><p>0.00 €/mo</p><p>Interest: 2.26% p.a.</p></div>
        </div>
      </main>
    `
  },

  // H7: NOISE — Lazy-load placeholder image src swap
  {
    id: "held_07_noise_image_src_swap",
    competitor: "Revolut",
    expected_change: false,
    description: "Hero image and lazy-load src attributes changed; pricing content identical",
    html_before: `
      <main>
        <img src="/images/hero-spring-2024.webp" loading="lazy" alt="Revolut plans" />
        <div class="pricing-grid"><p>Standard: 0 €/mo</p><p>Metal: 13.99 €/mo</p></div>
      </main>
    `,
    html_after: `
      <main>
        <img src="/images/hero-summer-2024.webp" loading="lazy" alt="Revolut plans" />
        <div class="pricing-grid"><p>Standard: 0 €/mo</p><p>Metal: 13.99 €/mo</p></div>
      </main>
    `
  },

  // H8: NOISE — Intercom / live chat widget injection
  {
    id: "held_08_noise_intercom_widget",
    competitor: "Scalable Capital",
    expected_change: false,
    description: "Intercom live chat widget injected into page; pricing content identical",
    html_before: `
      <main>
        <div id="pricing"><h3>PRIME+</h3><p>4.99 € / month</p><p>3.50% p.a. interest</p></div>
      </main>
    `,
    html_after: `
      <main>
        <div id="pricing"><h3>PRIME+</h3><p>4.99 € / month</p><p>3.50% p.a. interest</p></div>
      </main>
      <div id="intercom-container" class="intercom-lightweight-app" data-app-id="abc123xyz">
        <div class="intercom-messenger-frame"><iframe src="https://intercom.io/messenger"></iframe></div>
      </div>
    `
  },

  // H9: NOISE — Google Tag Manager / analytics ID rotation
  {
    id: "held_09_noise_gtm_analytics",
    competitor: "Bitpanda",
    expected_change: false,
    description: "GTM container ID and analytics snippet version changed; fee tables identical",
    html_before: `
      <head><script>window.dataLayer=[{gtmId:'GTM-OLD1234'}];</script></head>
      <main><div id="fees"><p>Maker: 0.15%</p><p>Taker: 0.25%</p></div></main>
    `,
    html_after: `
      <head><script>window.dataLayer=[{gtmId:'GTM-NEW5678'}];</script></head>
      <main><div id="fees"><p>Maker: 0.15%</p><p>Taker: 0.25%</p></div></main>
    `
  },

  // H10: NOISE — Testimonial / social proof section rotated
  {
    id: "held_10_noise_testimonial_rotation",
    competitor: "N26",
    expected_change: false,
    description: "Customer testimonial quote and author name rotated; pricing content identical",
    html_before: `
      <main>
        <div class="plans-table"><p>Metal: 16.90 €/month</p><p>Savings: 3.00% p.a.</p></div>
        <section class="testimonials">
          <blockquote>"Best banking experience I've ever had." — Maria K., Berlin</blockquote>
        </section>
      </main>
    `,
    html_after: `
      <main>
        <div class="plans-table"><p>Metal: 16.90 €/month</p><p>Savings: 3.00% p.a.</p></div>
        <section class="testimonials">
          <blockquote>"Switched from my old bank and never looked back." — Thomas R., Munich</blockquote>
        </section>
      </main>
    `
  }
];

// Write fixtures and manifest
const manifest: Record<string, Omit<HeldOutFixture, 'html_before' | 'html_after'>> = {};

for (const fix of heldOutFixtures) {
  manifest[fix.id] = {
    id: fix.id,
    competitor: fix.competitor,
    expected_change: fix.expected_change,
    description: fix.description
  };
  fs.writeFileSync(path.join(heldOutDir, `${fix.id}_before.html`), fix.html_before.trim(), 'utf-8');
  fs.writeFileSync(path.join(heldOutDir, `${fix.id}_after.html`), fix.html_after.trim(), 'utf-8');
}

fs.writeFileSync(path.join(heldOutDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`Generated ${heldOutFixtures.length} held-out validation fixtures in ${heldOutDir}`);
