/**
 * Utility to sanitize sensitive strings (API keys, secrets, tokens) from logs and error messages.
 */
const env = require('../config/env');

const sanitizeSecrets = (str) => {
  if (!str) return '';
  let sanitized = String(str);

  const secrets = [
    process.env.GEMINI_API_KEY,
    env.GEMINI_API_KEY,
    process.env.JWT_ACCESS_SECRET,
    env.JWT_ACCESS_SECRET,
    process.env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_SECRET,
    process.env.OPENAI_API_KEY,
    env.OPENAI_API_KEY,
  ].filter((s) => s && s.trim().length > 4);

  for (const secret of secrets) {
    sanitized = sanitized.split(secret.trim()).join('[REDACTED]');
  }

  return sanitized
    .replace(/api_key:[a-zA-Z0-9_.-]+/gi, 'api_key:[REDACTED]')
    .replace(/key=[a-zA-Z0-9_.-]+/gi, 'key=[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9_.-]+/gi, 'Bearer [REDACTED]')
    .replace(/AIzaSy[a-zA-Z0-9_-]{33}/gi, 'AIzaSy[REDACTED]');
};

module.exports = {
  sanitizeSecrets,
};

