export function createRateLimiter({ windowMs, maxRequests }) {
  const store = new Map();

  function check(clientKey, now = Date.now()) {
    const key = clientKey || 'unknown';
    const entry = store.get(key);
    if (!entry || now - entry.windowStart >= windowMs) {
      store.set(key, { count: 1, windowStart: now });
      return { limited: false, retryAfterSeconds: 0 };
    }

    if (entry.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - entry.windowStart)) / 1000));
      return { limited: true, retryAfterSeconds };
    }

    entry.count += 1;
    store.set(key, entry);
    return { limited: false, retryAfterSeconds: 0 };
  }

  function cleanup(now = Date.now()) {
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart >= windowMs) {
        store.delete(key);
      }
    }
  }

  function size() {
    return store.size;
  }

  return {
    check,
    cleanup,
    size
  };
}
