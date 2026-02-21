import { buildIssuePayload, validateReportInput } from '../../api/report-helpers.js';
import { createRateLimiter } from '../../api/rate-limit.js';

const GITHUB_OWNER = 'thomascarlyonrussell';
const GITHUB_REPO = 'shrouded-sails';
const ISSUE_LABEL = 'player-report';
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

const rateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: RATE_LIMIT_MAX_REQUESTS
});

function response(statusCode, payload, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    },
    body: JSON.stringify(payload)
  };
}

function getClientIp(headers = {}) {
  const netlifyIp = headers['x-nf-client-connection-ip'];
  if (typeof netlifyIp === 'string' && netlifyIp.trim()) {
    return netlifyIp.trim();
  }

  const xForwardedFor = headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string' && xForwardedFor.trim()) {
    return xForwardedFor.split(',')[0].trim();
  }

  const realIp = headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return 'unknown';
}

function hasLabelValidationError(errorPayload) {
  if (!errorPayload || typeof errorPayload !== 'object') return false;
  if (!Array.isArray(errorPayload.errors)) return false;

  return errorPayload.errors.some((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    return entry.field === 'labels';
  });
}

async function createGitHubIssue({ token, title, body, includeLabel }) {
  const payload = { title, body };
  if (includeLabel) {
    payload.labels = [ISSUE_LABEL];
  }

  return fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'shrouded-sails-bug-reporter'
    },
    body: JSON.stringify(payload)
  });
}

export async function handler(event) {
  rateLimiter.cleanup();

  if (event.httpMethod !== 'POST') {
    return response(
      405,
      { ok: false, error: 'Method not allowed. Use POST.' },
      { Allow: 'POST' }
    );
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return response(500, {
      ok: false,
      error: 'Server is not configured for issue submission.'
    });
  }

  const clientIp = getClientIp(event.headers || {});
  const rateLimitResult = rateLimiter.check(clientIp);
  if (rateLimitResult.limited) {
    return response(
      429,
      { ok: false, error: 'Too many submissions. Please try again later.' },
      { 'Retry-After': String(rateLimitResult.retryAfterSeconds) }
    );
  }

  let requestBody = {};
  try {
    requestBody = event.body ? JSON.parse(event.body) : {};
  } catch {
    return response(400, { ok: false, error: 'Invalid JSON body.' });
  }

  const validation = validateReportInput(requestBody);
  if (!validation.valid || !validation.value) {
    return response(400, {
      ok: false,
      error: 'Validation failed.',
      fieldErrors: validation.fieldErrors
    });
  }

  const issue = buildIssuePayload({
    title: validation.value.title,
    description: validation.value.description,
    context: requestBody?.context
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
    return response(502, {
      ok: false,
      error: 'Failed to create GitHub issue.'
    });
  }

  const issueNumber = Number.parseInt(String(githubPayload?.number), 10);
  const issueUrl = typeof githubPayload?.html_url === 'string' ? githubPayload.html_url : '';

  return response(201, {
    ok: true,
    issueNumber: Number.isFinite(issueNumber) ? issueNumber : null,
    issueUrl
  });
}
