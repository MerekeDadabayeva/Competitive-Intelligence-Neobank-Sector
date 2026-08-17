import * as fs from 'fs';
import * as path from 'path';
import { CompetitorSignal } from './types.js';

export interface NotificationSummary {
  autoPublishedCount: number;
  stagedReviewCount: number;
  signals: CompetitorSignal[];
  digestPath?: string;
  flashPath?: string;
}

export async function sendNotification(summary: NotificationSummary): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const timestamp = new Date().toISOString();

  const title = summary.flashPath ? '⚡ Daily Pricing Flash Alert' : '📊 Weekly Neobank Competitive Digest';
  const message = [
    `*${title}* (${timestamp.slice(0, 10)})`,
    `• *Auto-Published Signals*: ${summary.autoPublishedCount}`,
    `• *Pending PM Review*: ${summary.stagedReviewCount}`,
    '',
    ...summary.signals.map(s => `> *[${s.competitor}]* ${s.change_summary}\n> _Why this matters_: ${s.why_it_matters}\n> _Source_: <${s.source_url}|${s.source_tier}>`),
    '',
    summary.stagedReviewCount > 0 ? `👉 *Action Required*: Triage ${summary.stagedReviewCount} items in \`output/staged_review.md\` (Monday 09:00 SLA)` : '✅ All signals verified and published.'
  ].join('\n');

  // 1. Write notification log
  const outputDir = path.resolve('output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const logPath = path.join(outputDir, 'notifications.log');
  fs.appendFileSync(logPath, `[${timestamp}]\n${message}\n\n---\n\n`, 'utf-8');

  // 2. Dispatch to Slack webhook if configured
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
      console.log(`[Notifier] Slack webhook sent successfully (Status: ${response.status})`);
      return true;
    } catch (err: any) {
      console.error(`[Notifier] Failed to send Slack webhook: ${err.message}`);
      return false;
    }
  } else {
    console.log(`[Notifier] Notification logged to output/notifications.log (Slack webhook not configured).`);
    return true;
  }
}
