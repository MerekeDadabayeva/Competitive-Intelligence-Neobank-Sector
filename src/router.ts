import { CompetitorSignal } from './types.js';

export interface RoutingDecision {
  destination: 'auto_published' | 'staged_review';
  reason: string;
}

export function routeSignal(signal: CompetitorSignal): RoutingDecision {
  // 1. Tier 2 and Tier 3 ALWAYS go to review queue (cannot be bypassed)
  if (signal.source_tier === 'Tier 2' || signal.source_tier === 'Tier 3') {
    return {
      destination: 'staged_review',
      reason: `Mandatory review gate for ${signal.source_tier} source.`
    };
  }

  // 2. Non-pricing / Non-promo categories (e.g. product launches, positioning shifts, app reviews) go to review queue
  if (signal.category !== 'pricing' && signal.category !== 'marketing_promo') {
    return {
      destination: 'staged_review',
      reason: `${signal.category} signal requires PM context review.`
    };
  }

  // 3. Tier 1 Pricing / Promo: Check if escalated by synthesizer/health check
  if (signal.requires_review) {
    return {
      destination: 'staged_review',
      reason: signal.escalation_reason || 'Escalated by synthesizer review heuristic.'
    };
  }

  // 4. Clean Tier 1 pricing/promo signal
  return {
    destination: 'auto_published',
    reason: `Verified Tier 1 ${signal.category} diff auto-published.`
  };
}
