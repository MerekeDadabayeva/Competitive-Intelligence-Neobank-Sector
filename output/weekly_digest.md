# Neobank Competitive Intelligence Digest — Week of 2024-04-15

*Automated competitive intelligence for Fintech PMs tracking N26, Revolut, Scalable Capital, and Bitpanda against Trade Republic baseline.*

## 1. Executive Summary

| Competitor | Category | Change Summary | Why This Matters for PMs | Source |
|---|---|---|---|---|
| **N26** | `pricing` | N26 updated pricing: changed from [Instant Savings: 1.26% p.a.] to [Instant Savings: 3.00% p.a.]. | Impacts deposit competition vs Trade Republic's 3.75% p.a. on uninvested cash up to 50,000 EUR. | [Tier 1](https://n26.com/en-de/plans) |
| **Scalable Capital** | `pricing` | Scalable Capital updated pricing: changed from [4.00% p.a. interest on cash up to 1,000,000 € with Baader Bank] to [3.75% p.a. interest on cash up to 1,000,000 € with Baader Bank]. | Impacts deposit competition vs Trade Republic's 3.75% p.a. on uninvested cash up to 50,000 EUR. | [Tier 1](https://de.scalable.capital/en/pricing) |

---

## 2. Detailed Signal Lineage & Diff Verification

### N26 — N26 updated pricing: changed from [Instant Savings: 1.26% p.a.] to [Instant Savings: 3.00% p.a.].
- **Timestamp**: `2026-08-17T20:46:27.707Z`
- **Source**: [https://n26.com/en-de/plans](https://n26.com/en-de/plans) (Tier 1)
- **Strategic Impact**: Impacts deposit competition vs Trade Republic's 3.75% p.a. on uninvested cash up to 50,000 EUR.

```diff
===================================================================
--- a/pricing.md	prior_snapshot
+++ b/pricing.md	current_snapshot
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

### Scalable Capital — Scalable Capital updated pricing: changed from [4.00% p.a. interest on cash up to 1,000,000 € with Baader Bank] to [3.75% p.a. interest on cash up to 1,000,000 € with Baader Bank].
- **Timestamp**: `2026-08-17T20:46:27.714Z`
- **Source**: [https://de.scalable.capital/en/pricing](https://de.scalable.capital/en/pricing) (Tier 1)
- **Strategic Impact**: Impacts deposit competition vs Trade Republic's 3.75% p.a. on uninvested cash up to 50,000 EUR.

```diff
===================================================================
--- a/pricing.md	prior_snapshot
+++ b/pricing.md	current_snapshot
@@ -1,4 +1,4 @@
 ## Scalable Broker Plans
 ### PRIME+
 4.99 € / month
-4.00% p.a. interest on cash up to 1,000,000 € with Baader Bank
\ No newline at end of file
+3.75% p.a. interest on cash up to 1,000,000 € with Baader Bank
\ No newline at end of file

```

---

## 3. Staged Items Awaiting PM Triage (1 items)
*Review in `output/staged_review.md` (Monday 09:00 CET SLA)*