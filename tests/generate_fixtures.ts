import * as fs from 'fs';
import * as path from 'path';

const fixturesDir = path.resolve('tests/fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

export interface FixtureMeta {
  id: string;
  competitor: string;
  category: 'pricing' | 'product_launch' | 'positioning' | 'noise';
  tier: 'Tier 1' | 'Tier 2';
  expected_change: boolean;
  expected_category: string;
  source_url: string;
  archive_url_before: string;
  archive_url_after: string;
  timestamp_before: string;
  timestamp_after: string;
  description: string;
  ground_truth_summary?: string;
  ground_truth_why_it_matters?: string;
}

export const fixtures: Array<FixtureMeta & { html_before: string; html_after: string }> = [
  // 1. N26 Instant Savings Interest Rate
  {
    id: "case_01_n26_savings_rate",
    competitor: "N26",
    category: "pricing",
    tier: "Tier 1",
    expected_change: true,
    expected_category: "pricing",
    source_url: "https://n26.com/en-de/plans",
    archive_url_before: "https://web.archive.org/web/20230601000000/https://n26.com/en-de/plans",
    archive_url_after: "https://web.archive.org/web/20231115000000/https://n26.com/en-de/plans",
    timestamp_before: "2023-06-01T00:00:00Z",
    timestamp_after: "2023-11-15T00:00:00Z",
    description: "N26 Instant Savings interest rate increase across tiers (Metal up to 3.00%)",
    ground_truth_summary: "N26 introduced tiered Instant Savings interest: 1.26% on Standard, 2.26% on Smart/You, and 3.00% p.a. on Metal accounts.",
    ground_truth_why_it_matters: "Directly challenges Trade Republic's uninvested cash interest (3.75%), narrowing the gap for premium banking users.",
    html_before: `
      <main id="main-content">
        <div class="pricing-table">
          <h1>Compare N26 Bank Accounts</h1>
          <div class="plan" id="plan-standard">
            <h2>N26 Standard</h2>
            <p class="price">0.00 € / month</p>
            <p class="savings-rate">Instant Savings: 1.26% p.a.</p>
          </div>
          <div class="plan" id="plan-metal">
            <h2>N26 Metal</h2>
            <p class="price">16.90 € / month</p>
            <p class="savings-rate">Instant Savings: 1.26% p.a.</p>
          </div>
        </div>
      </main>
    `,
    html_after: `
      <main id="main-content">
        <div class="pricing-table">
          <h1>Compare N26 Bank Accounts</h1>
          <div class="plan" id="plan-standard">
            <h2>N26 Standard</h2>
            <p class="price">0.00 € / month</p>
            <p class="savings-rate">Instant Savings: 1.26% p.a.</p>
          </div>
          <div class="plan" id="plan-metal">
            <h2>N26 Metal</h2>
            <p class="price">16.90 € / month</p>
            <p class="savings-rate">Instant Savings: 3.00% p.a.</p>
          </div>
        </div>
      </main>
    `
  },
  // 2. N26 Smart Plan Pricing & Features
  {
    id: "case_02_n26_plan_fee_revision",
    competitor: "N26",
    category: "pricing",
    tier: "Tier 1",
    expected_change: true,
    expected_category: "pricing",
    source_url: "https://n26.com/en-de/plans",
    archive_url_before: "https://web.archive.org/web/20230110000000/https://n26.com/en-de/plans",
    archive_url_after: "https://web.archive.org/web/20230820000000/https://n26.com/en-de/plans",
    timestamp_before: "2023-01-10T00:00:00Z",
    timestamp_after: "2023-08-20T00:00:00Z",
    description: "N26 You plan price increase from 9.90 EUR to 10.90 EUR / month",
    ground_truth_summary: "N26 You plan monthly subscription increased from 9.90 € to 10.90 € / month.",
    ground_truth_why_it_matters: "Increases subscription revenue baseline for N26 while highlighting Trade Republic's no-monthly-fee card proposition.",
    html_before: `
      <main>
        <div class="plans-comparison">
          <div class="card" id="n26-you">
            <h3>N26 You</h3>
            <span class="monthly-fee">9.90 € / month</span>
            <p>Travel insurance and free FX withdrawals</p>
          </div>
        </div>
      </main>
    `,
    html_after: `
      <main>
        <div class="plans-comparison">
          <div class="card" id="n26-you">
            <h3>N26 You</h3>
            <span class="monthly-fee">10.90 € / month</span>
            <p>Travel insurance and free FX withdrawals</p>
          </div>
        </div>
      </main>
    `
  },
  // 3. Revolut Ultra Tier Launch
  {
    id: "case_03_revolut_ultra_launch",
    competitor: "Revolut",
    category: "product_launch",
    tier: "Tier 1",
    expected_change: true,
    expected_category: "product_launch",
    source_url: "https://www.revolut.com/en-DE/our-pricing-plans/",
    archive_url_before: "https://web.archive.org/web/20230301000000/https://www.revolut.com/en-DE/our-pricing-plans/",
    archive_url_after: "https://web.archive.org/web/20230715000000/https://www.revolut.com/en-DE/our-pricing-plans/",
    timestamp_before: "2023-03-01T00:00:00Z",
    timestamp_after: "2023-07-15T00:00:00Z",
    description: "Revolut introduced the new Ultra tier at 45.00 EUR / month with Platinum card",
    ground_truth_summary: "Revolut launched its top-tier Ultra subscription plan at 45.00 € / month with platinum card and lounge access.",
    ground_truth_why_it_matters: "Targets ultra-high-net-worth retail banking users, testing willingness to pay top-tier SaaS fees in fintech.",
    html_before: `
      <main>
        <div class="pricing-grid">
          <div class="tier">Standard - 0 €/month</div>
          <div class="tier">Plus - 2.99 €/month</div>
          <div class="tier">Premium - 7.99 €/month</div>
          <div class="tier">Metal - 13.99 €/month</div>
        </div>
      </main>
    `,
    html_after: `
      <main>
        <div class="pricing-grid">
          <div class="tier">Standard - 0 €/month</div>
          <div class="tier">Plus - 2.99 €/month</div>
          <div class="tier">Premium - 7.99 €/month</div>
          <div class="tier">Metal - 13.99 €/month</div>
          <div class="tier">Ultra - 45.00 €/month - Platinum-plated card, unlimited airport lounge access</div>
        </div>
      </main>
    `
  },
  // 4. Revolut Weekend FX Markup Revision
  {
    id: "case_04_revolut_weekend_fx_fee",
    competitor: "Revolut",
    category: "pricing",
    tier: "Tier 1",
    expected_change: true,
    expected_category: "pricing",
    source_url: "https://www.revolut.com/en-DE/legal/standard-fees/",
    archive_url_before: "https://web.archive.org/web/20230401000000/https://www.revolut.com/en-DE/legal/standard-fees/",
    archive_url_after: "https://web.archive.org/web/20231010000000/https://www.revolut.com/en-DE/legal/standard-fees/",
    timestamp_before: "2023-04-01T00:00:00Z",
    timestamp_after: "2023-10-10T00:00:00Z",
    description: "Revolut increased weekend currency exchange fee from 0.5% to 1.0% on major FX pairs",
    ground_truth_summary: "Revolut updated weekend currency exchange markup from 0.5% to 1.0% for major currencies.",
    ground_truth_why_it_matters: "Increases hidden cost for cross-border spending, creating a competitive talking point for Trade Republic zero-FX fee card.",
    html_before: `
      <div class="legal-document">
        <h2>Foreign Exchange Fees</h2>
        <p>During the week: 0% fee within monthly allowance.</p>
        <p>During the weekend: 0.5% fee on USD, EUR, GBP, and 1.0% on all other currencies.</p>
      </div>
    `,
    html_after: `
      <div class="legal-document">
        <h2>Foreign Exchange Fees</h2>
        <p>During the week: 0% fee within monthly allowance.</p>
        <p>During the weekend: 1.0% fee on all currencies without exception.</p>
      </div>
    `
  },
  // 5. Revolut Crypto Trading Commission
  {
    id: "case_05_revolut_crypto_fee",
    competitor: "Revolut",
    category: "pricing",
    tier: "Tier 1",
    expected_change: true,
    expected_category: "pricing",
    source_url: "https://www.revolut.com/en-DE/legal/standard-fees/",
    archive_url_before: "https://web.archive.org/web/20230201000000/https://www.revolut.com/en-DE/legal/standard-fees/",
    archive_url_after: "https://web.archive.org/web/20230915000000/https://www.revolut.com/en-DE/legal/standard-fees/",
    timestamp_before: "2023-02-01T00:00:00Z",
    timestamp_after: "2023-09-15T00:00:00Z",
    description: "Revolut reduced crypto trading fee from 1.49% to 0.99% for Standard users",
    ground_truth_summary: "Revolut reduced crypto exchange commission from 1.49% to 0.99% (or minimum 0.99 €).",
    ground_truth_why_it_matters: "Narrowed crypto trading pricing against Trade Republic's 1.00 € flat fee, especially for small order sizes.",
    html_before: `
      <div class="legal-document">
        <h3>Crypto Trading Fees</h3>
        <p>Standard and Plus users: 1.49% fee per crypto transaction or 1.49 € minimum.</p>
      </div>
    `,
    html_after: `
      <div class="legal-document">
        <h3>Crypto Trading Fees</h3>
        <p>Standard and Plus users: 0.99% fee per crypto transaction or 0.99 € minimum.</p>
      </div>
    `
  },
  // 6. Scalable Capital Prime+ Cash Interest Adjustment
  {
    id: "case_06_scalable_interest_rate",
    competitor: "Scalable Capital",
    category: "pricing",
    tier: "Tier 1",
    expected_change: true,
    expected_category: "pricing",
    source_url: "https://de.scalable.capital/en/pricing",
    archive_url_before: "https://web.archive.org/web/20231201000000/https://de.scalable.capital/en/pricing",
    archive_url_after: "https://web.archive.org/web/20240315000000/https://de.scalable.capital/en/pricing",
    timestamp_before: "2023-12-01T00:00:00Z",
    timestamp_after: "2024-03-15T00:00:00Z",
    description: "Scalable Capital reduced Prime+ interest rate on uninvested cash from 4.00% to 3.75% p.a.",
    ground_truth_summary: "Scalable Capital adjusted Prime+ cash interest from 4.00% to 3.75% p.a. on deposits up to 1,000,000 EUR.",
    ground_truth_why_it_matters: "Scalable's rate parity with Trade Republic (3.75%), but Scalable requires a 4.99 €/mo subscription vs Trade Republic free rate.",
    html_before: `
      <div id="pricing" class="table-pricing">
        <h2>Scalable Broker Plans</h2>
        <div class="plan-card" id="prime-plus">
          <h3>PRIME+</h3>
          <p class="fee">4.99 € / month</p>
          <p class="interest">4.00% p.a. interest on cash up to 1,000,000 € with Baader Bank</p>
        </div>
      </div>
    `,
    html_after: `
      <div id="pricing" class="table-pricing">
        <h2>Scalable Broker Plans</h2>
        <div class="plan-card" id="prime-plus">
          <h3>PRIME+</h3>
          <p class="fee">4.99 € / month</p>
          <p class="interest">3.75% p.a. interest on cash up to 1,000,000 € with Baader Bank</p>
        </div>
      </div>
    `
  },
  // 7. Scalable Capital Free Broker Minimum Order Threshold
  {
    id: "case_07_scalable_order_threshold",
    competitor: "Scalable Capital",
    category: "pricing",
    tier: "Tier 1",
    expected_change: true,
    expected_category: "pricing",
    source_url: "https://de.scalable.capital/en/pricing",
    archive_url_before: "https://web.archive.org/web/20230501000000/https://de.scalable.capital/en/pricing",
    archive_url_after: "https://web.archive.org/web/20231101000000/https://de.scalable.capital/en/pricing",
    timestamp_before: "2023-05-01T00:00:00Z",
    timestamp_after: "2023-11-01T00:00:00Z",
    description: "Scalable Capital Free Broker PRIME ETF free order threshold raised from 250 EUR to 500 EUR",
    ground_truth_summary: "Scalable Capital Free Broker changed PRIME ETF fee threshold: orders below 500 € now cost 0.99 € (previously 250 €).",
    ground_truth_why_it_matters: "Forces smaller retail trades to pay 0.99 € order fee, reducing Free Broker appeal compared to free Trade Republic savings plans.",
    html_before: `
      <div class="pricing-comparison">
        <h3>FREE BROKER</h3>
        <p>0 € / month</p>
        <p class="etf-rule">PRIME ETFs: 0.00 € for order volumes from 250 € (0.99 € for smaller orders)</p>
      </div>
    `,
    html_after: `
      <div class="pricing-comparison">
        <h3>FREE BROKER</h3>
        <p>0 € / month</p>
        <p class="etf-rule">PRIME ETFs: 0.00 € for order volumes from 500 € (0.99 € for smaller orders)</p>
      </div>
    `
  },
  // 8. Bitpanda Staking APY Adjustment
  {
    id: "case_08_bitpanda_staking_apy",
    competitor: "Bitpanda",
    category: "pricing",
    tier: "Tier 1",
    expected_change: true,
    expected_category: "pricing",
    source_url: "https://www.bitpanda.com/en/limits-and-fees",
    archive_url_before: "https://web.archive.org/web/20230801000000/https://www.bitpanda.com/en/limits-and-fees",
    archive_url_after: "https://web.archive.org/web/20231201000000/https://www.bitpanda.com/en/limits-and-fees",
    timestamp_before: "2023-08-01T00:00:00Z",
    timestamp_after: "2023-12-01T00:00:00Z",
    description: "Bitpanda adjusted Ethereum staking APY from 3.8% to 3.1% and Solana from 6.5% to 5.8%",
    ground_truth_summary: "Bitpanda reduced staking yield on ETH from 3.8% to 3.1% and SOL from 6.5% to 5.8%.",
    ground_truth_why_it_matters: "Reflects network-wide yield compression; preserves crypto staking yield comparison benchmarks for PMs.",
    html_before: `
      <div id="fees" class="fee-tables">
        <h2>Bitpanda Staking Yields</h2>
        <table>
          <tr><td>Ethereum (ETH)</td><td>3.8% APY</td></tr>
          <tr><td>Solana (SOL)</td><td>6.5% APY</td></tr>
        </table>
      </div>
    `,
    html_after: `
      <div id="fees" class="fee-tables">
        <h2>Bitpanda Staking Yields</h2>
        <table>
          <tr><td>Ethereum (ETH)</td><td>3.1% APY</td></tr>
          <tr><td>Solana (SOL)</td><td>5.8% APY</td></tr>
        </table>
      </div>
    `
  },
  // 9. Bitpanda Deposit Fee Elimination
  {
    id: "case_09_bitpanda_deposit_fee",
    competitor: "Bitpanda",
    category: "pricing",
    tier: "Tier 1",
    expected_change: true,
    expected_category: "pricing",
    source_url: "https://www.bitpanda.com/en/limits-and-fees",
    archive_url_before: "https://web.archive.org/web/20230310000000/https://www.bitpanda.com/en/limits-and-fees",
    archive_url_after: "https://web.archive.org/web/20230920000000/https://www.bitpanda.com/en/limits-and-fees",
    timestamp_before: "2023-03-10T00:00:00Z",
    timestamp_after: "2023-09-20T00:00:00Z",
    description: "Bitpanda eliminated credit card and instant deposit fees from 1.50% to 0.00%",
    ground_truth_summary: "Bitpanda removed deposit fees across credit cards, PayPal, and Sofort (previously 1.50% fee).",
    ground_truth_why_it_matters: "Removes fiat on-ramp friction, accelerating conversion funnel against Trade Republic's free card and instant top-ups.",
    html_before: `
      <div id="fees">
        <h2>Deposit Methods and Limits</h2>
        <p>SEPA Bank Transfer: 0.00 €</p>
        <p>Credit Card (Visa/Mastercard): 1.50% fee</p>
        <p>PayPal / Sofort: 1.50% fee</p>
      </div>
    `,
    html_after: `
      <div id="fees">
        <h2>Deposit Methods and Limits</h2>
        <p>SEPA Bank Transfer: 0.00 €</p>
        <p>Credit Card (Visa/Mastercard): 0.00 € (Free)</p>
        <p>PayPal / Sofort: 0.00 € (Free)</p>
      </div>
    `
  },
  // 10. Dedicated Numeric Sensitivity Test (Micro Fee Shift in noisy markup)
  {
    id: "case_10_micro_numeric_fee_shift",
    competitor: "N26",
    category: "pricing",
    tier: "Tier 1",
    expected_change: true,
    expected_category: "pricing",
    source_url: "https://n26.com/en-de/plans",
    archive_url_before: "https://web.archive.org/web/20240115000000/https://n26.com/en-de/plans",
    archive_url_after: "https://web.archive.org/web/20240228000000/https://n26.com/en-de/plans",
    timestamp_before: "2024-01-15T00:00:00Z",
    timestamp_after: "2024-02-28T00:00:00Z",
    description: "Foreign currency markup shift from 1.70% to 1.65% embedded in noisy timestamped markup",
    ground_truth_summary: "Foreign ATM currency conversion markup on Standard tier adjusted from 1.70% to 1.65%.",
    ground_truth_why_it_matters: "5 bps reduction in FX fee margin, demonstrating micro-numeric fee diff sensitivity.",
    html_before: `
      <main>
        <div class="banner">Promotion valid until 2024-01-31 | Session: tok_88492a</div>
        <div class="plans-table">
          <div class="plan">
            <h3>Standard</h3>
            <p>Foreign Currency ATM markup: 1.70%</p>
          </div>
        </div>
        <div class="footer">Server time: 2024-01-15T14:23:10Z</div>
      </main>
    `,
    html_after: `
      <main>
        <div class="banner">Promotion valid until 2024-03-31 | Session: tok_99182b</div>
        <div class="plans-table">
          <div class="plan">
            <h3>Standard</h3>
            <p>Foreign Currency ATM markup: 1.65%</p>
          </div>
        </div>
        <div class="footer">Server time: 2024-02-28T09:11:04Z</div>
      </main>
    `
  },

  // 11. NOISE 1: OneTrust / Cookiebot Cookie Consent Text
  {
    id: "case_11_noise_cookie_banner",
    competitor: "N26",
    category: "noise",
    tier: "Tier 1",
    expected_change: false,
    expected_category: "noise",
    source_url: "https://n26.com/en-de/plans",
    archive_url_before: "https://web.archive.org/web/20230501000000/https://n26.com/en-de/plans",
    archive_url_after: "https://web.archive.org/web/20230502000000/https://n26.com/en-de/plans",
    timestamp_before: "2023-05-01T00:00:00Z",
    timestamp_after: "2023-05-02T00:00:00Z",
    description: "Cookie banner wording change in OneTrust overlay; pricing table identical",
    html_before: `
      <div id="onetrust-consent-sdk"><p>We use cookies to improve your browsing experience.</p></div>
      <main><div class="plans-table"><p>Standard Account: 0.00 €/month</p><p>Interest: 1.26% p.a.</p></div></main>
    `,
    html_after: `
      <div id="onetrust-consent-sdk"><p>We and our trusted partners use cookies and trackers to deliver personalized content.</p></div>
      <main><div class="plans-table"><p>Standard Account: 0.00 €/month</p><p>Interest: 1.26% p.a.</p></div></main>
    `
  },

  // 12. NOISE 2: Dynamic CSRF Tokens & Session Nonces
  {
    id: "case_12_noise_csrf_tokens",
    competitor: "Revolut",
    category: "noise",
    tier: "Tier 1",
    expected_change: false,
    expected_category: "noise",
    source_url: "https://www.revolut.com/en-DE/our-pricing-plans/",
    archive_url_before: "https://web.archive.org/web/20230601000000/https://www.revolut.com/en-DE/our-pricing-plans/",
    archive_url_after: "https://web.archive.org/web/20230601120000/https://www.revolut.com/en-DE/our-pricing-plans/",
    timestamp_before: "2023-06-01T00:00:00Z",
    timestamp_after: "2023-06-01T12:00:00Z",
    description: "Dynamic CSRF nonce and form session ID change in hidden inputs",
    html_before: `
      <main>
        <input type="hidden" name="csrf_token" value="d98a7cf1e29b48c" />
        <div class="pricing-grid"><h3>Standard</h3><p>0.00 € / month</p></div>
      </main>
    `,
    html_after: `
      <main>
        <input type="hidden" name="csrf_token" value="fa0284bc91238ef" />
        <div class="pricing-grid"><h3>Standard</h3><p>0.00 € / month</p></div>
      </main>
    `
  },

  // 13. NOISE 3: Footer Copyright Year Bump
  {
    id: "case_13_noise_copyright_year",
    competitor: "Scalable Capital",
    category: "noise",
    tier: "Tier 1",
    expected_change: false,
    expected_category: "noise",
    source_url: "https://de.scalable.capital/en/pricing",
    archive_url_before: "https://web.archive.org/web/20231231000000/https://de.scalable.capital/en/pricing",
    archive_url_after: "https://web.archive.org/web/20240101000000/https://de.scalable.capital/en/pricing",
    timestamp_before: "2023-12-31T23:59:00Z",
    timestamp_after: "2024-01-01T00:01:00Z",
    description: "Footer copyright year bump from 2023 to 2024",
    html_before: `
      <main><div id="pricing"><h3>Prime+</h3><p>4.99 €/mo</p><p>3.75% p.a. interest</p></div></main>
      <footer><p>© 2023 Scalable Capital GmbH. All rights reserved.</p></footer>
    `,
    html_after: `
      <main><div id="pricing"><h3>Prime+</h3><p>4.99 €/mo</p><p>3.75% p.a. interest</p></div></main>
      <footer><p>© 2024 Scalable Capital GmbH. All rights reserved.</p></footer>
    `
  },

  // 14. NOISE 4: Seasonal Hero Banner Image & Slogan
  {
    id: "case_14_noise_seasonal_banner",
    competitor: "Bitpanda",
    category: "noise",
    tier: "Tier 1",
    expected_change: false,
    expected_category: "noise",
    source_url: "https://www.bitpanda.com/en/limits-and-fees",
    archive_url_before: "https://web.archive.org/web/20230701000000/https://www.bitpanda.com/en/limits-and-fees",
    archive_url_after: "https://web.archive.org/web/20230708000000/https://www.bitpanda.com/en/limits-and-fees",
    timestamp_before: "2023-07-01T00:00:00Z",
    timestamp_after: "2023-07-08T00:00:00Z",
    description: "Header seasonal slogan change from Spring to Summer campaign without fee changes",
    html_before: `
      <header class="promo-banner"><h2>Spring into crypto with zero deposit fees</h2></header>
      <main><div id="fees"><p>SEPA Deposit: 0.00 €</p><p>Maker fee: 0.15%</p><p>Taker fee: 0.25%</p></div></main>
    `,
    html_after: `
      <header class="promo-banner"><h2>Summer trading made simple with zero deposit fees</h2></header>
      <main><div id="fees"><p>SEPA Deposit: 0.00 €</p><p>Maker fee: 0.15%</p><p>Taker fee: 0.25%</p></div></main>
    `
  },

  // 15. NOISE 5: CSS Class Renaming & Tailwind Wrapper
  {
    id: "case_15_noise_css_classes",
    competitor: "N26",
    category: "noise",
    tier: "Tier 1",
    expected_change: false,
    expected_category: "noise",
    source_url: "https://n26.com/en-de/plans",
    archive_url_before: "https://web.archive.org/web/20230901000000/https://n26.com/en-de/plans",
    archive_url_after: "https://web.archive.org/web/20230905000000/https://n26.com/en-de/plans",
    timestamp_before: "2023-09-01T00:00:00Z",
    timestamp_after: "2023-09-05T00:00:00Z",
    description: "Frontend refactor: class names changed to modern Tailwind utility classes",
    html_before: `
      <main>
        <div class="container-fluid legacy-pricing-wrapper">
          <div class="col-md-6 plan-box">
            <h2>Metal Plan</h2>
            <span>16.90 € / month</span>
          </div>
        </div>
      </main>
    `,
    html_after: `
      <main>
        <div class="w-full max-w-7xl mx-auto grid grid-cols-2 gap-4">
          <div class="p-6 rounded-2xl bg-white shadow-sm">
            <h2>Metal Plan</h2>
            <span>16.90 € / month</span>
          </div>
        </div>
      </main>
    `
  },

  // 16. NOISE 6: Script Bundle Hashes & Build Timestamps
  {
    id: "case_16_noise_script_hashes",
    competitor: "Revolut",
    category: "noise",
    tier: "Tier 1",
    expected_change: false,
    expected_category: "noise",
    source_url: "https://www.revolut.com/en-DE/our-pricing-plans/",
    archive_url_before: "https://web.archive.org/web/20230801000000/https://www.revolut.com/en-DE/our-pricing-plans/",
    archive_url_after: "https://web.archive.org/web/20230802000000/https://www.revolut.com/en-DE/our-pricing-plans/",
    timestamp_before: "2023-08-01T00:00:00Z",
    timestamp_after: "2023-08-02T00:00:00Z",
    description: "Webpack / Vite script bundle asset hash changes in HTML head and script tags",
    html_before: `
      <head><script src="/assets/pricing.98f12a.js"></script><meta name="build-id" content="v2023.8.1"/></head>
      <main><div class="pricing-grid"><p>Standard: 0.00 €/mo</p><p>Plus: 2.99 €/mo</p></div></main>
    `,
    html_after: `
      <head><script src="/assets/pricing.b31c94.js"></script><meta name="build-id" content="v2023.8.2"/></head>
      <main><div class="pricing-grid"><p>Standard: 0.00 €/mo</p><p>Plus: 2.99 €/mo</p></div></main>
    `
  },

  // 17. NOISE 7: FAQ Accordion State Flip
  {
    id: "case_17_noise_faq_accordion",
    competitor: "Scalable Capital",
    category: "noise",
    tier: "Tier 1",
    expected_change: false,
    expected_category: "noise",
    source_url: "https://de.scalable.capital/en/pricing",
    archive_url_before: "https://web.archive.org/web/20231001000000/https://de.scalable.capital/en/pricing",
    archive_url_after: "https://web.archive.org/web/20231004000000/https://de.scalable.capital/en/pricing",
    timestamp_before: "2023-10-01T00:00:00Z",
    timestamp_after: "2023-10-04T00:00:00Z",
    description: "Accordion state attribute toggle (aria-expanded true/false) on pricing FAQ",
    html_before: `
      <main>
        <div id="pricing"><p>Prime+ 4.99 € / month</p></div>
        <div class="faq">
          <details open><summary>How is interest calculated?</summary><p>Calculated daily on up to 1,000,000 EUR.</p></details>
        </div>
      </main>
    `,
    html_after: `
      <main>
        <div id="pricing"><p>Prime+ 4.99 € / month</p></div>
        <div class="faq">
          <details><summary>How is interest calculated?</summary><p>Calculated daily on up to 1,000,000 EUR.</p></details>
        </div>
      </main>
    `
  },

  // 18. NOISE 8: Privacy Policy Revision Timestamp in Footer
  {
    id: "case_18_noise_legal_date_bump",
    competitor: "Bitpanda",
    category: "noise",
    tier: "Tier 1",
    expected_change: false,
    expected_category: "noise",
    source_url: "https://www.bitpanda.com/en/limits-and-fees",
    archive_url_before: "https://web.archive.org/web/20231015000000/https://www.bitpanda.com/en/limits-and-fees",
    archive_url_after: "https://web.archive.org/web/20231120000000/https://www.bitpanda.com/en/limits-and-fees",
    timestamp_before: "2023-10-15T00:00:00Z",
    timestamp_after: "2023-11-20T00:00:00Z",
    description: "Minor legal notice footer timestamp change without changes to fee tables",
    html_before: `
      <main><div id="fees"><p>Crypto maker fee: 0.15%</p><p>Crypto taker fee: 0.25%</p></div></main>
      <footer><small>Imprint last updated: 15 October 2023</small></footer>
    `,
    html_after: `
      <main><div id="fees"><p>Crypto maker fee: 0.15%</p><p>Crypto taker fee: 0.25%</p></div></main>
      <footer><small>Imprint last updated: 20 November 2023</small></footer>
    `
  },

  // 19. NOISE 9: UTM Campaign Query Parameters in App Store Links
  {
    id: "case_19_noise_utm_tracking",
    competitor: "N26",
    category: "noise",
    tier: "Tier 1",
    expected_change: false,
    expected_category: "noise",
    source_url: "https://n26.com/en-de/plans",
    archive_url_before: "https://web.archive.org/web/20231101000000/https://n26.com/en-de/plans",
    archive_url_after: "https://web.archive.org/web/20231105000000/https://n26.com/en-de/plans",
    timestamp_before: "2023-11-01T00:00:00Z",
    timestamp_after: "2023-11-05T00:00:00Z",
    description: "UTM tracking parameters updated in download badge links",
    html_before: `
      <main>
        <div class="plans-table"><p>Standard: 0.00 €/mo</p></div>
        <a href="https://apps.apple.com/app/n26?utm_source=web&utm_campaign=autumn">Download iOS App</a>
      </main>
    `,
    html_after: `
      <main>
        <div class="plans-table"><p>Standard: 0.00 €/mo</p></div>
        <a href="https://apps.apple.com/app/n26?utm_source=web&utm_campaign=winter_promo">Download iOS App</a>
      </main>
    `
  },

  // 20. NOISE 10: Whitespace & Tab Formatting Reorganization
  {
    id: "case_20_noise_whitespace_formatting",
    competitor: "Revolut",
    category: "noise",
    tier: "Tier 1",
    expected_change: false,
    expected_category: "noise",
    source_url: "https://www.revolut.com/en-DE/our-pricing-plans/",
    archive_url_before: "https://web.archive.org/web/20231201000000/https://www.revolut.com/en-DE/our-pricing-plans/",
    archive_url_after: "https://web.archive.org/web/20231202000000/https://www.revolut.com/en-DE/our-pricing-plans/",
    timestamp_before: "2023-12-01T00:00:00Z",
    timestamp_after: "2023-12-02T00:00:00Z",
    description: "HTML minification/beautification changes (extra spaces and indentation only)",
    html_before: `
      <main>
        <div class="pricing-grid">
          <h3>Standard</h3>
          <p>0.00 € / month</p>
        </div>
      </main>
    `,
    html_after: `
      <main>
        <div   class="pricing-grid"  >
          <h3>Standard</h3>
          
          <p>0.00 € / month</p>
        </div>
      </main>
    `
  }
];

// Write individual fixture files and manifest.json
const manifest: Record<string, FixtureMeta> = {};

for (const fix of fixtures) {
  const meta: FixtureMeta = {
    id: fix.id,
    competitor: fix.competitor,
    category: fix.category,
    tier: fix.tier,
    expected_change: fix.expected_change,
    expected_category: fix.expected_category,
    source_url: fix.source_url,
    archive_url_before: fix.archive_url_before,
    archive_url_after: fix.archive_url_after,
    timestamp_before: fix.timestamp_before,
    timestamp_after: fix.timestamp_after,
    description: fix.description,
    ground_truth_summary: fix.ground_truth_summary,
    ground_truth_why_it_matters: fix.ground_truth_why_it_matters
  };

  manifest[fix.id] = meta;

  fs.writeFileSync(path.join(fixturesDir, `${fix.id}_before.html`), fix.html_before.trim(), 'utf-8');
  fs.writeFileSync(path.join(fixturesDir, `${fix.id}_after.html`), fix.html_after.trim(), 'utf-8');
}

fs.writeFileSync(
  path.join(fixturesDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf-8'
);

console.log(`Generated ${fixtures.length} fixtures and manifest.json in ${fixturesDir}`);
