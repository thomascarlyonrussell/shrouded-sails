import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIssuePayload,
  sanitizeText,
  validateReportInput
} from '../api/report-helpers.js';
import { createRateLimiter } from '../api/rate-limit.js';

describe('issue report helpers', () => {
  it('sanitizeText removes control characters and normalizes line endings', () => {
    const result = sanitizeText('Hello\r\nworld\u0000\u0008!');
    assert.equal(result, 'Hello\nworld!');
  });

  it('validateReportInput rejects missing fields and accepts valid boundaries', () => {
    const invalid = validateReportInput({ title: ' abc ', description: 'short' });
    assert.equal(invalid.valid, false);
    assert.equal(typeof invalid.fieldErrors.title, 'string');
    assert.equal(typeof invalid.fieldErrors.description, 'string');

    const valid = validateReportInput({
      title: 'Valid bug title',
      description: 'This description is comfortably longer than twenty chars.'
    });
    assert.equal(valid.valid, true);
    assert.deepEqual(valid.fieldErrors, {});
    assert.equal(valid.value.title, 'Valid bug title');
  });

  it('buildIssuePayload includes description and context lines', () => {
    const payload = buildIssuePayload({
      title: 'Board rendering glitch',
      description: 'The cannon animation overlaps ships on zoomed-in mode.',
      context: {
        timestamp: '2026-02-16T00:00:00.000Z',
        pageUrl: 'https://shrouded-sails.vercel.app/',
        userAgent: 'Mozilla/5.0',
        viewport: { width: 390, height: 844 },
        boardLayout: 'portrait',
        turn: 3,
        currentPlayer: 2,
        fogEnabled: true,
        combatDetailLevel: 'compact'
      }
    });

    assert.equal(payload.title, 'Board rendering glitch');
    assert.match(payload.body, /## Player Description/);
    assert.match(payload.body, /## Auto Context/);
    assert.match(payload.body, /Viewport: 390x844/);
    assert.match(payload.body, /Fog Enabled: true/);
  });
});

describe('rate limiter', () => {
  it('limits requests after maxRequests within window', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });
    const now = 1000;

    assert.equal(limiter.check('1.2.3.4', now).limited, false);
    assert.equal(limiter.check('1.2.3.4', now + 1).limited, false);
    assert.equal(limiter.check('1.2.3.4', now + 2).limited, false);

    const blocked = limiter.check('1.2.3.4', now + 3);
    assert.equal(blocked.limited, true);
    assert.ok(blocked.retryAfterSeconds >= 1);
  });

  it('resets counters after window expires', () => {
    const limiter = createRateLimiter({ windowMs: 10_000, maxRequests: 1 });
    const start = 5000;

    assert.equal(limiter.check('5.6.7.8', start).limited, false);
    assert.equal(limiter.check('5.6.7.8', start + 1).limited, true);
    assert.equal(limiter.check('5.6.7.8', start + 10_100).limited, false);
  });
});
