import * as fs from 'fs';
import * as path from 'path';
import { HealthCheckResult, SourceConfig } from './types.js';

export interface FetchResult {
  source_id: string;
  url: string;
  timestamp: string;
  raw_html: string;
  health: HealthCheckResult;
}

export async function fetchSource(source: SourceConfig, previousSnapshotPath?: string): Promise<FetchResult> {
  const timestamp = new Date().toISOString();
  const headers = {
    'User-Agent': 'FintechPM-CompetitiveBot/1.0 (+https://internal-pm-tools.local; contact: pm-monitoring@internal.corp)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,de;q=0.8'
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(source.url, {
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // 1. Cloudflare / Anti-Bot block detection
    if (response.status === 403 || response.status === 503) {
      logManualCheckReminder(source, `HTTP ${response.status} - Anti-bot or Cloudflare challenge encountered.`);
      return {
        source_id: source.id,
        url: source.url,
        timestamp,
        raw_html: '',
        health: {
          status: 'CRAWL_BLOCKED',
          status_code: response.status,
          message: `Bot challenge / HTTP ${response.status}. Routed to manual check reminder.`,
          char_count: 0,
          anchors_matched: 0
        }
      };
    }

    if (!response.ok) {
      return {
        source_id: source.id,
        url: source.url,
        timestamp,
        raw_html: '',
        health: {
          status: 'FETCH_ERROR',
          status_code: response.status,
          message: `HTTP error ${response.status}: ${response.statusText}`,
          char_count: 0,
          anchors_matched: 0
        }
      };
    }

    const html = await response.text();
    const charCount = html.length;

    // 2. Anti-Silent Failure: Minimum character count check
    if (charCount < source.min_character_count) {
      logManualCheckReminder(source, `Scraped content too short (${charCount} chars < ${source.min_character_count} min threshold).`);
      return {
        source_id: source.id,
        url: source.url,
        timestamp,
        raw_html: html,
        health: {
          status: 'EMPTY_CONTENT',
          status_code: response.status,
          message: `Content length (${charCount} chars) below minimum threshold (${source.min_character_count}). Possible empty DOM.`,
          char_count: charCount,
          anchors_matched: 0
        }
      };
    }

    // 3. Domain Anchor Keyword Assertion
    const lowerHtml = html.toLowerCase();
    const matchedAnchors = source.anchor_terms.filter(term => lowerHtml.includes(term.toLowerCase()));
    if (matchedAnchors.length < 2) {
      logManualCheckReminder(source, `Selector drift: Matched only ${matchedAnchors.length} anchor terms (${matchedAnchors.join(', ')}).`);
      return {
        source_id: source.id,
        url: source.url,
        timestamp,
        raw_html: html,
        health: {
          status: 'SELECTOR_DRIFT_WARNING',
          status_code: response.status,
          message: `Insufficient domain anchor terms matched (${matchedAnchors.length} < 2).`,
          char_count: charCount,
          anchors_matched: matchedAnchors.length
        }
      };
    }

    // 4. Relative Drift Check (>40% drop vs previous snapshot)
    let driftPercentage = 0;
    if (previousSnapshotPath && fs.existsSync(previousSnapshotPath)) {
      const prevContent = fs.readFileSync(previousSnapshotPath, 'utf-8');
      if (prevContent.length > 0) {
        const drop = (prevContent.length - charCount) / prevContent.length;
        driftPercentage = Math.round(drop * 100);
        if (drop > 0.40) {
          logManualCheckReminder(source, `Snapshot content dropped by ${driftPercentage}% compared to previous snapshot.`);
          return {
            source_id: source.id,
            url: source.url,
            timestamp,
            raw_html: html,
            health: {
              status: 'SELECTOR_DRIFT_WARNING',
              status_code: response.status,
              message: `Significant content drop detected (${driftPercentage}% reduction). Possible site redesign.`,
              char_count: charCount,
              anchors_matched: matchedAnchors.length,
              drift_percentage: driftPercentage
            }
          };
        }
      }
    }

    // 5. Successful healthy fetch
    saveSnapshot(source, html, timestamp);

    return {
      source_id: source.id,
      url: source.url,
      timestamp,
      raw_html: html,
      health: {
        status: 'HEALTHY',
        status_code: response.status,
        message: 'Snapshot healthy and verified.',
        char_count: charCount,
        anchors_matched: matchedAnchors.length
      }
    };

  } catch (error: any) {
    return {
      source_id: source.id,
      url: source.url,
      timestamp,
      raw_html: '',
      health: {
        status: 'FETCH_ERROR',
        message: `Network/Fetch error: ${error.message}`,
        char_count: 0,
        anchors_matched: 0
      }
    };
  }
}

function saveSnapshot(source: SourceConfig, content: string, timestamp: string): string {
  const cleanComp = source.competitor.replace(/\s+/g, '_').toLowerCase();
  const dir = path.resolve(`data/snapshots/${cleanComp}/${source.id}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filename = `${timestamp.replace(/[:.]/g, '-')}.html`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

export function logManualCheckReminder(source: SourceConfig, reason: string): void {
  const outputDir = path.resolve('output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const remindersPath = path.join(outputDir, 'manual_check_reminders.md');
  const entry = `- **[${new Date().toISOString()}] ${source.competitor} (${source.id})**: [${source.url}](${source.url})\n  - *Reason*: ${reason}\n\n`;
  fs.appendFileSync(remindersPath, entry, 'utf-8');
}
