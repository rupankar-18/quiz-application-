import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCertificateSummaryFromHistory } from './certificateEligibility.js';

test('qualifies when 3 different streams average at least 55%', () => {
  const summary = buildCertificateSummaryFromHistory([
    { category: 'Science', accuracy: 70 },
    { category: 'Tech', accuracy: 55 },
    { category: 'Math', accuracy: 50 },
    { category: 'Tech', accuracy: 60 }
  ]);

  assert.equal(summary.qualifies, true);
  assert.equal(summary.uniqueCategories.length, 3);
  assert.ok(summary.overallAccuracy >= 55);
});

test('does not qualify with fewer than 3 unique streams', () => {
  const summary = buildCertificateSummaryFromHistory([
    { category: 'Science', accuracy: 90 },
    { category: 'Science', accuracy: 80 }
  ]);

  assert.equal(summary.qualifies, false);
  assert.equal(summary.uniqueCategories.length, 1);
});

test('ignores duplicate stream entries when checking the latest 3 unique streams', () => {
  const summary = buildCertificateSummaryFromHistory([
    { category: 'Science', accuracy: 40 },
    { category: 'Tech', accuracy: 70 },
    { category: 'Math', accuracy: 90 },
    { category: 'Science', accuracy: 80 },
    { category: 'History', accuracy: 90 }
  ]);

  assert.equal(summary.qualifies, true);
  assert.deepEqual(summary.uniqueCategories, ['History', 'Science', 'Math']);
});
