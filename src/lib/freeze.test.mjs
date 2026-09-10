// Boundary tests for the read-only freeze.
// No test runner is configured in package.json, so this runs standalone:
//   node --test src/lib/freeze.test.mjs
// (Node >= 22 strips the types from freeze.ts on import.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { FREEZE_DATE, isFrozen, formatFreezeDate } from './freeze.ts';

const RealDate = Date;

/** Run fn with `new Date()` pinned to `iso`; every other Date use is untouched. */
function at(iso, fn) {
  class FakeDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(iso);
      else super(...args);
    }
    static now() {
      return new RealDate(iso).getTime();
    }
  }
  globalThis.Date = FakeDate;
  try {
    return fn();
  } finally {
    globalThis.Date = RealDate;
  }
}

test('FREEZE_DATE is 2026-09-15', () => {
  assert.equal(FREEZE_DATE, '2026-09-15');
});

test('not frozen well before the freeze date', () => {
  assert.equal(at('2026-09-01T12:00:00Z', isFrozen), false);
});

test('not frozen on the evening before, Denver time', () => {
  // 2026-09-14 23:59:59Z = 17:59:59 Denver on the 14th.
  assert.equal(at('2026-09-14T23:59:59Z', isFrozen), false);
});

test('not frozen one second before midnight Denver', () => {
  assert.equal(at('2026-09-15T05:59:59Z', isFrozen), false);
});

test('frozen exactly at midnight Denver', () => {
  assert.equal(at('2026-09-15T06:00:00Z', isFrozen), true);
});

test('frozen one second after midnight Denver', () => {
  assert.equal(at('2026-09-15T06:00:01Z', isFrozen), true);
});

test('frozen well after the freeze date', () => {
  assert.equal(at('2026-10-01T12:00:00Z', isFrozen), true);
});

test('formatFreezeDate renders the banner date', () => {
  assert.equal(formatFreezeDate(), 'Sep 15, 2026');
});

test('banner copy matches the agreed wording exactly', () => {
  const src = readFileSync(
    fileURLToPath(new URL('../components/layout/FreezeBanner.tsx', import.meta.url)),
    'utf8',
  );
  const start = src.indexOf('This app is closed.');
  const end = src.indexOf('has been carried over.');
  assert.ok(start !== -1 && end !== -1, 'banner copy not found in FreezeBanner.tsx');

  const copy = src
    .slice(start, end + 'has been carried over.'.length)
    .replaceAll("{' '}", ' ')
    .replaceAll('{formatFreezeDate()}', formatFreezeDate())
    .replace(/\s+/g, ' ')
    .trim();

  assert.equal(
    copy,
    'This app is closed. Daily notes and attendance now live in Summit ' +
      '(summit-app-gm.netlify.app). Everything entered here before Sep 15, 2026 ' +
      'has been carried over.',
  );
});
