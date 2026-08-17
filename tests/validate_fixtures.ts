import * as fs from 'fs';
import * as path from 'path';

interface FixtureMeta {
  id: string;
  competitor: string;
  category: string;
  tier: string;
  expected_change: boolean;
  source_url: string;
  archive_url_before: string;
  archive_url_after: string;
  timestamp_before: string;
  timestamp_after: string;
  description: string;
  ground_truth_summary?: string;
  ground_truth_why_it_matters?: string;
}

export function validateFixtures(): { valid: boolean; total: number; genuineChanges: number; noiseCases: number } {
  const fixturesDir = path.resolve('tests/fixtures');
  const manifestPath = path.join(fixturesDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }

  const manifest: Record<string, FixtureMeta> = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const ids = Object.keys(manifest);

  let genuineChanges = 0;
  let noiseCases = 0;

  for (const id of ids) {
    const meta = manifest[id];
    const beforeFile = path.join(fixturesDir, `${id}_before.html`);
    const afterFile = path.join(fixturesDir, `${id}_after.html`);

    if (!fs.existsSync(beforeFile)) {
      throw new Error(`Missing before fixture: ${beforeFile}`);
    }
    if (!fs.existsSync(afterFile)) {
      throw new Error(`Missing after fixture: ${afterFile}`);
    }

    const beforeContent = fs.readFileSync(beforeFile, 'utf-8');
    const afterContent = fs.readFileSync(afterFile, 'utf-8');

    if (beforeContent.length === 0 || afterContent.length === 0) {
      throw new Error(`Empty fixture file detected for ${id}`);
    }

    if (!meta.archive_url_before.startsWith('https://web.archive.org/web/')) {
      throw new Error(`Invalid archive URL for ${id}: ${meta.archive_url_before}`);
    }

    if (meta.expected_change) {
      genuineChanges++;
      if (!meta.ground_truth_summary || !meta.ground_truth_why_it_matters) {
        throw new Error(`Missing ground truth summary or why_it_matters for genuine change ${id}`);
      }
    } else {
      noiseCases++;
    }
  }

  console.log(`✓ Step 0 Fixture Validation Passed: ${ids.length} fixtures verified (${genuineChanges} genuine changes, ${noiseCases} noise cases).`);
  return { valid: true, total: ids.length, genuineChanges, noiseCases };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateFixtures();
}
