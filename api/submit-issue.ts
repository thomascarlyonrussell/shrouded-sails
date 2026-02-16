import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildIssuePayload, validateReportInput } from './report-helpers.js';
import { createRateLimiter } from './rate-limit.js';

const GITHUB_OWNER = 'thomascarlyonrussell';
const GITHUB_REPO = 'shrouded-sails';
const ISSUE_LABEL = 'player-report';
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const rateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: RATE_LIMIT_MAX_REQUESTS
});

function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: IncomingMessage) {
  const maybeBody = (req as any).body;
  if (maybeBody && typeof maybeBody === 'object') {
    return maybeBody;
  }
  if (typeof maybeBody === 'string' && maybeBody.trim()) {
    return JSON.parse(maybeBody);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function getClientIp(req: IncomingMessage) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string' && xForwardedFor.trim()) {
    return xForwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return req.socket?.remoteAddress || 'unknown';
}

function hasLabelValidationError(errorPayload: any) {
  if (!errorPayload || typeof errorPayload !== 'object') return false;
  if (!Array.isArray(errorPayload.errors)) return false;

  return errorPayload.errors.some((entry: any) => {
    if (!entry || typeof entry !== 'object') return false;
    return entry.field === 'labels';
  });
}

async function createGitHubIssue({
  token,
  title,
  body,
  includeLabel
}: {
  token: string;
  title: string;
  body: string;
  includeLabel: boolean;
}) {
  const payload: Record<string, unknown> = { title, body };
  if (includeLabel) {
    payload.labels = [ISSUE_LABEL];
  }

  return fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'shrouded-sails-bug-reporter'
    },
    body: JSON.stringify(payload)
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  rateLimiter.cleanup();

  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed. Use POST.' }, { Allow: 'POST' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return sendJson(res, 500, { ok: false, error: 'Server is not configured for issue submission.' });
  }

  const clientIp = getClientIp(req);
  const rateLimitResult = rateLimiter.check(clientIp);
  if (rateLimitResult.limited) {
    return sendJson(
      res,
      429,
      { ok: false, error: 'Too many submissions. Please try again later.' },
      { 'Retry-After': String(rateLimitResult.retryAfterSeconds) }
    );
  }

  let body: any;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: 'Invalid JSON body.' });
  }

  const validation = validateReportInput(body);
  if (!validation.valid || !validation.value) {
    return sendJson(res, 400, {
      ok: false,
      error: 'Validation failed.',
      fieldErrors: validation.fieldErrors
    });
  }

  const issue = buildIssuePayload({
    title: validation.value.title,
    description: validation.value.description,
    context: body?.context
  });

  let githubResponse = await createGitHubIssue({
    token,
    title: issue.title,
    body: issue.body,
    includeLabel: true
  });
  let githubPayload = await githubResponse.json().catch(() => ({}));

  if (!githubResponse.ok && githubResponse.status === 422 && hasLabelValidationError(githubPayload)) {
    githubResponse = await createGitHubIssue({
      token,
      title: issue.title,
      body: issue.body,
      includeLabel: false
    });
    githubPayload = await githubResponse.json().catch(() => ({}));
  }

  if (!githubResponse.ok) {
    return sendJson(res, 502, {
      ok: false,
      error: 'Failed to create GitHub issue.'
    });
  }

  const issueNumber = Number.parseInt(String(githubPayload?.number), 10);
  const issueUrl = typeof githubPayload?.html_url === 'string' ? githubPayload.html_url : '';

  return sendJson(res, 201, {
    ok: true,
    issueNumber: Number.isFinite(issueNumber) ? issueNumber : null,
    issueUrl
  });
}
