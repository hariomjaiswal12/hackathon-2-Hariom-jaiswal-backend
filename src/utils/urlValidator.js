/**
 * CompanyIQ — URL Validation & Sanitization Utility
 * Ensures all internal and external URLs are genuine, well-formed,
 * and safe to render, while detecting and neutralizing broken placeholders
 * (e.g., /unavailable/, example.com, #, empty strings).
 */

const KNOWN_PLACEHOLDERS = [
  'unavailable',
  'example.com',
  'company.com',
  'placeholder',
  'todo',
  'test.com',
];

/**
 * Validates whether an external URL is genuine and safe to navigate.
 * @param {string|null|undefined} url - The URL to validate.
 * @returns {{ isValid: boolean, sanitizedUrl: string|null, reason: string|null }}
 */
function validateExternalUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, sanitizedUrl: null, reason: 'URL not provided' };
  }

  const trimmed = url.trim();

  if (trimmed === '' || trimmed === '#' || trimmed === 'about:blank' || trimmed === 'javascript:void(0)') {
    return { isValid: false, sanitizedUrl: null, reason: 'Empty or hash placeholder' };
  }

  // Check known placeholder substrings
  const lower = trimmed.toLowerCase();
  for (const placeholder of KNOWN_PLACEHOLDERS) {
    if (lower.includes(placeholder)) {
      return { isValid: false, sanitizedUrl: null, reason: `Known placeholder detected: ${placeholder}` };
    }
  }

  // Check protocol and format
  try {
    const parsed = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);

    // Must have a valid hostname with at least one dot
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { isValid: false, sanitizedUrl: null, reason: 'Invalid domain name' };
    }

    // Reject localhost or loopback in public source URLs
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return { isValid: false, sanitizedUrl: null, reason: 'Local address not allowed as source' };
    }

    // Strip trailing slash on bare domains (e.g. https://vkaps.com/ -> https://vkaps.com)
    const sanitizedUrl = (parsed.pathname === '/' && !parsed.search && !parsed.hash)
      ? parsed.origin
      : parsed.href;

    return { isValid: true, sanitizedUrl, reason: null };
  } catch {
    return { isValid: false, sanitizedUrl: null, reason: 'Malformed URL' };
  }
}

/**
 * Sanitizes a company's data sources array, ensuring no broken placeholders remain clickable.
 * @param {Array} dataSources
 * @returns {Array}
 */
function sanitizeDataSources(dataSources = []) {
  if (!Array.isArray(dataSources)) return [];

  return dataSources.map((ds) => {
    const rawUrl = ds.sourceUrl || ds.url;
    const validation = validateExternalUrl(rawUrl);

    return {
      provider: ds.provider || ds.name || 'Verified Source',
      sourceUrl: validation.isValid ? validation.sanitizedUrl : null,
      isAvailable: validation.isValid,
      availabilityNotice: validation.isValid ? null : (ds.availabilityNotice || 'External profile not verified · Link unavailable'),
      confidence: ds.confidence || 'OFFICIAL_RECORD',
      fieldsProvided: ds.fieldsProvided || [],
      attribution: ds.attribution || ds.description || 'Verified regulatory record',
      retrievedAt: ds.retrievedAt || new Date(),
    };
  });
}

/**
 * Sanitizes social links object.
 * @param {Object} socialLinks
 * @returns {Object}
 */
function sanitizeSocialLinks(socialLinks = {}) {
  const result = {};
  if (!socialLinks || typeof socialLinks !== 'object') return result;

  for (const [platform, rawUrl] of Object.entries(socialLinks)) {
    const validation = validateExternalUrl(rawUrl);
    result[platform] = validation.isValid ? validation.sanitizedUrl : null;
  }
  return result;
}

module.exports = {
  validateExternalUrl,
  sanitizeDataSources,
  sanitizeSocialLinks,
};
