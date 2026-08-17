import { z } from 'zod';

export const CategoryEnum = z.enum(['pricing', 'product_launch', 'positioning', 'marketing_promo', 'app_reviews']);
export type Category = z.infer<typeof CategoryEnum>;

export const SourceConfigSchema = z.object({
  id: z.string(),
  competitor: z.enum(['N26', 'Revolut', 'Scalable Capital', 'Bitpanda']),
  category: CategoryEnum,
  tier: z.enum(['Tier 1', 'Tier 2', 'Tier 3']),
  url: z.string().url(),
  ios_url: z.string().url().optional(),
  android_url: z.string().url().optional(),
  frequency: z.enum(['daily', 'weekly']),
  selector: z.string(),
  anchor_terms: z.array(z.string()),
  min_character_count: z.number().default(500),
  requires_review_by_default: z.boolean().default(false)
});

export type SourceConfig = z.infer<typeof SourceConfigSchema>;

export const JtbdPillarEnum = z.enum([
  'Onboarding Friction',
  'Value Realization',
  'Feature Bloat',
  'Conversion / Monetization Hooks',
  'Regulatory Compliance'
]);
export type JtbdPillar = z.infer<typeof JtbdPillarEnum>;

export const ImpactClassificationEnum = z.enum([
  'Defensive Need (Parity)',
  'Differentiator (Moat)',
  'Noise (Low ROI)'
]);
export type ImpactClassification = z.infer<typeof ImpactClassificationEnum>;

export const MiniPrdSchema = z.object({
  problem_statement: z.string(),
  proposed_mvp_response: z.string(),
  target_metrics: z.array(z.string()),
  explicit_out_of_scope: z.array(z.string())
});
export type MiniPrd = z.infer<typeof MiniPrdSchema>;

export const JiraGherkinSchema = z.object({
  epic_title: z.string(),
  user_story: z.string(),
  gherkin_scenarios: z.array(z.string()),
  acceptance_criteria: z.array(z.string())
});
export type JiraGherkin = z.infer<typeof JiraGherkinSchema>;

export const CompetitorSignalSchema = z.object({
  id: z.string(),
  competitor: z.enum(['N26', 'Revolut', 'Scalable Capital', 'Bitpanda']),
  category: CategoryEnum,
  source_url: z.string(),
  ios_url: z.string().optional(),
  android_url: z.string().optional(),
  source_tier: z.enum(['Tier 1', 'Tier 2', 'Tier 3']),
  timestamp: z.string(),
  change_summary: z.string(),
  why_it_matters: z.string(),
  diff_snippet: z.string(),
  requires_review: z.boolean(),
  escalation_reason: z.string().optional(),
  rating_delta?: z.string().optional(),
  sentiment_theme?: z.string().optional(),
  jtbd_pillar: JtbdPillarEnum.optional(),
  impact_scoring: z.object({
    classification: ImpactClassificationEnum,
    urgency: z.enum(['P0 - Immediate Response', 'P1 - Next Sprint', 'P2 - Monitor Only', 'P3 - Ignore']),
    rationale: z.string()
  }).optional(),
  mini_prd: MiniPrdSchema.optional(),
  jira_gherkin_story: JiraGherkinSchema.optional(),
  status: z.enum(['auto_published', 'staged_review', 'approved', 'rejected']).default('staged_review')
});

export type CompetitorSignal = z.infer<typeof CompetitorSignalSchema>;

export interface SnapshotMeta {
  source_id: string;
  competitor: string;
  url: string;
  timestamp: string;
  content_hash: string;
  char_count: number;
  anchors_found: string[];
}

export interface DiffResult {
  has_change: boolean;
  is_meaningful: boolean;
  added_lines: string[];
  removed_lines: string[];
  unified_diff: string;
  detected_numbers_before: string[];
  detected_numbers_after: string[];
}

export interface HealthCheckResult {
  status: 'HEALTHY' | 'CRAWL_BLOCKED' | 'EMPTY_CONTENT' | 'SELECTOR_DRIFT_WARNING' | 'FETCH_ERROR';
  status_code?: number;
  message: string;
  char_count: number;
  anchors_matched: number;
  drift_percentage?: number;
}
