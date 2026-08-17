# Neobank Competitive Intelligence Digest — Week of 2026-08-17

*Automated competitive intelligence for Fintech PMs tracking N26, Revolut, Scalable Capital, and Bitpanda against Trade Republic baseline.*

## 1. Executive Summary

| Competitor | Category | Change Summary | Why This Matters for PMs | Source |
|---|---|---|---|---|
| **N26** | `pricing` | N26 updated pricing: changed from [Instant Savings: 1.26% p.a.] to [Instant Savings: 3.00% p.a.]. | Impacts deposit competition vs Trade Republic's 3.75% p.a. on uninvested cash up to 50,000 EUR. | [Tier 1](https://n26.com/en-de/plans) |
| **Revolut** | `product_launch` | Revolut updated product_launch: changed from [Metal - 13.99 €/month] to [Metal - 13.99 €/month; Ultra - 45.00 €/month - Platinum-plated card, unlimited airport lounge access]. | Targets premium account tiers; contrast with Trade Republic's free card with 1% saveback on card spending directly invested into savings plan (max 15 EUR/mo). | [Tier 1](https://www.revolut.com/en-DE/our-pricing-plans/) |
| **Scalable Capital** | `pricing` | Scalable Capital updated pricing: changed from [4.00% p.a. interest on cash up to 1,000,000 € with Baader Bank] to [3.75% p.a. interest on cash up to 1,000,000 € with Baader Bank]. | Impacts deposit competition vs Trade Republic's 3.75% p.a. on uninvested cash up to 50,000 EUR. | [Tier 1](https://de.scalable.capital/en/pricing) |
| **Bitpanda** | `pricing` | Bitpanda updated pricing: changed from [\| Ethereum (ETH) \| 3.8% APY \|; \| Solana (SOL) \| 6.5% APY \|] to [\| Ethereum (ETH) \| 3.1% APY \|; \| Solana (SOL) \| 5.8% APY \|]. | Signals a strategic shift in Bitpanda's positioning relative to Trade Republic. | [Tier 1](https://www.bitpanda.com/en/limits-and-fees) |
| **Revolut** | `marketing_promo` | Revolut updated marketing_promo: changed from [Get 40 € for every friend who signs up and orders a card.] to [Summer Referral Boost: Get 60 € for every friend who signs up, orders a physical card, and completes 3 purchases of at least 5 € within 21 days.]. | Targets premium account tiers; contrast with Trade Republic's free card with 1% saveback on card spending directly invested into savings plan (max 15 EUR/mo). | [Tier 1](https://www.revolut.com/en-DE/referral-program/) |
| **Scalable Capital** | `marketing_promo` | Scalable Capital updated marketing_promo: changed from [## Scalable Broker; Start investing in 7,500+ stocks and ETFs.] to [## Portfolio Transfer Bonus; Transfer your existing portfolio to Scalable Capital and receive up to 100 € cash bonus directly into your account (valid for transfers over 10,000 €).]. | Aggressive acquisition promotion impacting user acquisition velocity and CAC benchmarks against Trade Republic. | [Tier 1](https://de.scalable.capital/en/promotions) |
| **N26** | `app_reviews` | N26 updated app_reviews: changed from [iOS: 4.7 ★ (85k) \| Google Play: 4.5 ★ (120k)Users praise smooth daily banking and instant push notifications.] to [iOS: 4.3 ★ (92k) \| Google Play: 4.1 ★ (128k)Sentiment shift across App Store & Google Play: Surge in 1★-2★ reviews reporting KYC verification loops and biometric login failures following update v12.4. Customer support wait times cited as primary complaint.]. | Indicates user sentiment & customer experience shift; highlights product reliability vs Trade Republic app experience. | [Tier 2](https://play.google.com/store/apps/details?id=de.number26.android) |
| **Bitpanda** | `app_reviews` | Bitpanda updated app_reviews: changed from [iOS: 4.5 ★ (40k) \| Google Play: 4.4 ★ (60k)Frequent complaints regarding bank deposit clearance speed.] to [iOS: 4.6 ★ (43k) \| Google Play: 4.5 ★ (65k)Positive sentiment shift across App Store & Google Play: High praise for 0% PayPal instant deposits and streamlined crypto staking UI. Deposit speed complaints down 35% week-over-week.]. | Directly compares to Trade Republic's 1.00 EUR flat fee per order, 50+ tradable cryptocurrencies trading structure. | [Tier 2](https://play.google.com/store/apps/details?id=com.bitpanda.bitpanda) |

---

## 2. Detailed Signal Lineage & Diff Verification

### N26 — N26 updated pricing: changed from [Instant Savings: 1.26% p.a.] to [Instant Savings: 3.00% p.a.].
- **Timestamp**: `2026-08-16T05:00:00.000Z`
- **Source**: [https://n26.com/en-de/plans](https://n26.com/en-de/plans) (Tier 1)
- **Strategic Impact**: Impacts deposit competition vs Trade Republic's 3.75% p.a. on uninvested cash up to 50,000 EUR.

```diff
===================================================================
--- a/n26_pricing.md	prior_snapshot
+++ b/n26_pricing.md	current_snapshot
@@ -3,5 +3,5 @@
 0.00 € / month
 Instant Savings: 1.26% p.a.
 ## N26 Metal
 16.90 € / month
-Instant Savings: 1.26% p.a.
\ No newline at end of file
+Instant Savings: 3.00% p.a.
\ No newline at end of file

```

### Revolut — Revolut updated product_launch: changed from [Metal - 13.99 €/month] to [Metal - 13.99 €/month; Ultra - 45.00 €/month - Platinum-plated card, unlimited airport lounge access].
- **Timestamp**: `2026-08-15T05:00:00.000Z`
- **Source**: [https://www.revolut.com/en-DE/our-pricing-plans/](https://www.revolut.com/en-DE/our-pricing-plans/) (Tier 1)
- **Strategic Impact**: Targets premium account tiers; contrast with Trade Republic's free card with 1% saveback on card spending directly invested into savings plan (max 15 EUR/mo).

```diff
===================================================================
--- a/revolut_ultra.md	prior_snapshot
+++ b/revolut_ultra.md	current_snapshot
@@ -1,4 +1,5 @@
 Standard - 0 €/month
 Plus - 2.99 €/month
 Premium - 7.99 €/month
-Metal - 13.99 €/month
\ No newline at end of file
+Metal - 13.99 €/month
+Ultra - 45.00 €/month - Platinum-plated card, unlimited airport lounge access
\ No newline at end of file

```

### Scalable Capital — Scalable Capital updated pricing: changed from [4.00% p.a. interest on cash up to 1,000,000 € with Baader Bank] to [3.75% p.a. interest on cash up to 1,000,000 € with Baader Bank].
- **Timestamp**: `2026-08-14T05:00:00.000Z`
- **Source**: [https://de.scalable.capital/en/pricing](https://de.scalable.capital/en/pricing) (Tier 1)
- **Strategic Impact**: Impacts deposit competition vs Trade Republic's 3.75% p.a. on uninvested cash up to 50,000 EUR.

```diff
===================================================================
--- a/scalable_interest.md	prior_snapshot
+++ b/scalable_interest.md	current_snapshot
@@ -1,4 +1,4 @@
 ## Scalable Broker Plans
 ### PRIME+
 4.99 € / month
-4.00% p.a. interest on cash up to 1,000,000 € with Baader Bank
\ No newline at end of file
+3.75% p.a. interest on cash up to 1,000,000 € with Baader Bank
\ No newline at end of file

```

### Bitpanda — Bitpanda updated pricing: changed from [| Ethereum (ETH) | 3.8% APY |; | Solana (SOL) | 6.5% APY |] to [| Ethereum (ETH) | 3.1% APY |; | Solana (SOL) | 5.8% APY |].
- **Timestamp**: `2026-08-12T05:00:00.000Z`
- **Source**: [https://www.bitpanda.com/en/limits-and-fees](https://www.bitpanda.com/en/limits-and-fees) (Tier 1)
- **Strategic Impact**: Signals a strategic shift in Bitpanda's positioning relative to Trade Republic.

```diff
===================================================================
--- a/bitpanda_staking.md	prior_snapshot
+++ b/bitpanda_staking.md	current_snapshot
@@ -1,3 +1,3 @@
 ## Bitpanda Staking Yields
-| Ethereum (ETH) | 3.8% APY |
-| Solana (SOL) | 6.5% APY |
\ No newline at end of file
+| Ethereum (ETH) | 3.1% APY |
+| Solana (SOL) | 5.8% APY |
\ No newline at end of file

```

### Revolut — Revolut updated marketing_promo: changed from [Get 40 € for every friend who signs up and orders a card.] to [Summer Referral Boost: Get 60 € for every friend who signs up, orders a physical card, and completes 3 purchases of at least 5 € within 21 days.].
- **Timestamp**: `2026-08-15T17:00:00.000Z`
- **Source**: [https://www.revolut.com/en-DE/referral-program/](https://www.revolut.com/en-DE/referral-program/) (Tier 1)
- **Strategic Impact**: Targets premium account tiers; contrast with Trade Republic's free card with 1% saveback on card spending directly invested into savings plan (max 15 EUR/mo).

```diff
===================================================================
--- a/revolut_referrals.md	prior_snapshot
+++ b/revolut_referrals.md	current_snapshot
@@ -1,2 +1,2 @@
 ## Invite Friends
-Get 40 € for every friend who signs up and orders a card.
\ No newline at end of file
+Summer Referral Boost: Get 60 € for every friend who signs up, orders a physical card, and completes 3 purchases of at least 5 € within 21 days.
\ No newline at end of file

```

### Scalable Capital — Scalable Capital updated marketing_promo: changed from [## Scalable Broker; Start investing in 7,500+ stocks and ETFs.] to [## Portfolio Transfer Bonus; Transfer your existing portfolio to Scalable Capital and receive up to 100 € cash bonus directly into your account (valid for transfers over 10,000 €).].
- **Timestamp**: `2026-08-13T17:00:00.000Z`
- **Source**: [https://de.scalable.capital/en/promotions](https://de.scalable.capital/en/promotions) (Tier 1)
- **Strategic Impact**: Aggressive acquisition promotion impacting user acquisition velocity and CAC benchmarks against Trade Republic.

```diff
===================================================================
--- a/scalable_promos.md	prior_snapshot
+++ b/scalable_promos.md	current_snapshot
@@ -1,2 +1,2 @@
-## Scalable Broker
-Start investing in 7,500+ stocks and ETFs.
\ No newline at end of file
+## Portfolio Transfer Bonus
+Transfer your existing portfolio to Scalable Capital and receive up to 100 € cash bonus directly into your account (valid for transfers over 10,000 €).
\ No newline at end of file

```

### N26 — N26 updated app_reviews: changed from [iOS: 4.7 ★ (85k) | Google Play: 4.5 ★ (120k)Users praise smooth daily banking and instant push notifications.] to [iOS: 4.3 ★ (92k) | Google Play: 4.1 ★ (128k)Sentiment shift across App Store & Google Play: Surge in 1★-2★ reviews reporting KYC verification loops and biometric login failures following update v12.4. Customer support wait times cited as primary complaint.].
- **Timestamp**: `2026-08-13T05:00:00.000Z`
- **Source**: [https://play.google.com/store/apps/details?id=de.number26.android](https://play.google.com/store/apps/details?id=de.number26.android) (Tier 2)
- **Strategic Impact**: Indicates user sentiment & customer experience shift; highlights product reliability vs Trade Republic app experience.

```diff
===================================================================
--- a/n26_app_reviews.md	prior_snapshot
+++ b/n26_app_reviews.md	current_snapshot
@@ -1,1 +1,1 @@
-iOS: 4.7 ★ (85k) | Google Play: 4.5 ★ (120k)Users praise smooth daily banking and instant push notifications.
\ No newline at end of file
+iOS: 4.3 ★ (92k) | Google Play: 4.1 ★ (128k)Sentiment shift across App Store & Google Play: Surge in 1★-2★ reviews reporting KYC verification loops and biometric login failures following update v12.4. Customer support wait times cited as primary complaint.
\ No newline at end of file

```

### Bitpanda — Bitpanda updated app_reviews: changed from [iOS: 4.5 ★ (40k) | Google Play: 4.4 ★ (60k)Frequent complaints regarding bank deposit clearance speed.] to [iOS: 4.6 ★ (43k) | Google Play: 4.5 ★ (65k)Positive sentiment shift across App Store & Google Play: High praise for 0% PayPal instant deposits and streamlined crypto staking UI. Deposit speed complaints down 35% week-over-week.].
- **Timestamp**: `2026-08-11T05:00:00.000Z`
- **Source**: [https://play.google.com/store/apps/details?id=com.bitpanda.bitpanda](https://play.google.com/store/apps/details?id=com.bitpanda.bitpanda) (Tier 2)
- **Strategic Impact**: Directly compares to Trade Republic's 1.00 EUR flat fee per order, 50+ tradable cryptocurrencies trading structure.

```diff
===================================================================
--- a/bitpanda_app_reviews.md	prior_snapshot
+++ b/bitpanda_app_reviews.md	current_snapshot
@@ -1,1 +1,1 @@
-iOS: 4.5 ★ (40k) | Google Play: 4.4 ★ (60k)Frequent complaints regarding bank deposit clearance speed.
\ No newline at end of file
+iOS: 4.6 ★ (43k) | Google Play: 4.5 ★ (65k)Positive sentiment shift across App Store & Google Play: High praise for 0% PayPal instant deposits and streamlined crypto staking UI. Deposit speed complaints down 35% week-over-week.
\ No newline at end of file

```
