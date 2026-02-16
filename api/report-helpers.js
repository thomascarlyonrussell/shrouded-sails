export const TITLE_MIN_LENGTH = 5;
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MIN_LENGTH = 20;
export const DESCRIPTION_MAX_LENGTH = 5000;

const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function toSafeString(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function limitLength(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

export function sanitizeText(value) {
  const raw = toSafeString(value);
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS_REGEX, '');
}

export function validateReportInput(input = {}) {
  const sanitizedTitle = sanitizeText(input.title);
  const sanitizedDescription = sanitizeText(input.description);
  const title = sanitizedTitle.trim();
  const description = sanitizedDescription.trim();
  const fieldErrors = {};

  if (!title) {
    fieldErrors.title = 'Title is required.';
  } else if (title.length < TITLE_MIN_LENGTH || title.length > TITLE_MAX_LENGTH) {
    fieldErrors.title = `Title must be ${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH} characters.`;
  }

  if (!description) {
    fieldErrors.description = 'Description is required.';
  } else if (
    description.length < DESCRIPTION_MIN_LENGTH
    || description.length > DESCRIPTION_MAX_LENGTH
  ) {
    fieldErrors.description = `Description must be ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH} characters.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      valid: false,
      fieldErrors,
      value: null
    };
  }

  return {
    valid: true,
    fieldErrors: {},
    value: {
      title,
      description
    }
  };
}

function sanitizeContextValue(value, maxLength = 180) {
  const cleaned = sanitizeText(value).trim();
  if (!cleaned) return 'n/a';
  return limitLength(cleaned, maxLength);
}

function formatViewport(viewport) {
  if (!viewport || typeof viewport !== 'object') return 'n/a';
  const width = Number.parseInt(viewport.width, 10);
  const height = Number.parseInt(viewport.height, 10);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return 'n/a';
  return `${width}x${height}`;
}

export function buildIssuePayload({ title, description, context = {} }) {
  const safeContext = context && typeof context === 'object' ? context : {};

  const lines = [
    `- Timestamp: ${sanitizeContextValue(safeContext.timestamp)}`,
    `- Page URL: ${sanitizeContextValue(safeContext.pageUrl)}`,
    `- User Agent: ${sanitizeContextValue(safeContext.userAgent, 240)}`,
    `- Viewport: ${formatViewport(safeContext.viewport)}`,
    `- Board Layout: ${sanitizeContextValue(safeContext.boardLayout)}`,
    `- Turn: ${sanitizeContextValue(safeContext.turn)}`,
    `- Current Player: ${sanitizeContextValue(safeContext.currentPlayer)}`,
    `- Fog Enabled: ${sanitizeContextValue(safeContext.fogEnabled)}`,
    `- Combat Detail: ${sanitizeContextValue(safeContext.combatDetailLevel)}`
  ];

  const body = [
    '## Player Description',
    '',
    sanitizeText(description).trim(),
    '',
    '## Auto Context',
    '',
    ...lines
  ].join('\n');

  return {
    title: sanitizeText(title).trim(),
    body
  };
}
