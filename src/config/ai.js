let GoogleGenAI;
try {
  GoogleGenAI = require('@google/genai').GoogleGenAI;
} catch (e) {
  GoogleGenAI = null;
}
const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('./env');
const logger = require('../utils/logger');
const { sanitizeSecrets } = require('../utils/sanitizer');

let cachedClient = null;
let cachedKey = null;
let lastProbeResult = null;
let lastProbeTime = 0;

/**
 * Return an initialized Gemini client using either @google/genai or @google/generative-ai
 */
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }

  const cleanKey = apiKey.trim();
  if (cachedClient && cachedKey === cleanKey) {
    return cachedClient;
  }

  try {
    if (GoogleGenAI) {
      cachedClient = new GoogleGenAI({ apiKey: cleanKey });
      logger.info('Google GenAI (@google/genai) client initialized successfully.');
    } else {
      cachedClient = new GoogleGenerativeAI(cleanKey);
      logger.info('Google Generative AI (@google/generative-ai) client initialized successfully.');
    }
    cachedKey = cleanKey;
    return cachedClient;
  } catch (err) {
    const safeMsg = sanitizeSecrets(err.message || 'Initialization failed');
    logger.warn('Failed to initialize Google Gemini client:', safeMsg);
    return null;
  }
};

/**
 * Safely check the real status of the Gemini provider without exposing API keys
 */
const probeProviderStatus = async (forceFresh = false) => {
  const now = Date.now();
  if (!forceFresh && lastProbeResult && now - lastProbeTime < 30000) {
    return lastProbeResult;
  }

  const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey || !apiKey.trim()) {
    lastProbeResult = {
      provider: env.AI_PROVIDER || 'gemini',
      configured: false,
      model: modelName,
      status: 'unconfigured',
      message: 'GEMINI_API_KEY is not configured in environment. Grounded rule engine active.',
    };
    lastProbeTime = now;
    return lastProbeResult;
  }

  const client = getGeminiClient();
  if (!client) {
    lastProbeResult = {
      provider: env.AI_PROVIDER || 'gemini',
      configured: true,
      model: modelName,
      status: 'error',
      message: 'Client initialization failed.',
    };
    lastProbeTime = now;
    return lastProbeResult;
  }

  try {
    if (client.models && typeof client.models.generateContent === 'function') {
      await Promise.race([
        client.models.generateContent({
          model: modelName,
          contents: 'ping',
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Provider probe timed out')), 8000)),
      ]);
    } else if (typeof client.getGenerativeModel === 'function') {
      const model = client.getGenerativeModel({ model: modelName });
      await Promise.race([
        model.generateContent('ping'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Provider probe timed out')), 8000)),
      ]);
    }

    lastProbeResult = {
      provider: 'gemini',
      configured: true,
      model: modelName,
      status: 'ready',
      message: 'Gemini provider is connected, authorized, and responding normally.',
    };
  } catch (err) {
    const safeMsg = sanitizeSecrets(err.message || 'Provider connection error');
    const isSuspended =
      safeMsg.includes('CONSUMER_SUSPENDED') ||
      safeMsg.includes('has been suspended') ||
      (err.status === 403 && safeMsg.includes('suspended'));

    lastProbeResult = {
      provider: 'gemini',
      configured: true,
      model: modelName,
      status: isSuspended ? 'suspended' : 'error',
      errorReason: isSuspended
        ? 'Google Cloud project has been suspended (CONSUMER_SUSPENDED).'
        : safeMsg.slice(0, 150),
      message: isSuspended
        ? 'Gemini API key is from a suspended Google Cloud project. Please generate a new key in Google AI Studio.'
        : `Gemini API call failed (${safeMsg.slice(0, 100)}). Grounded rule engine active.`,
    };
  }

  lastProbeTime = now;
  return lastProbeResult;
};

// Initial check on module load
if (process.env.GEMINI_API_KEY || env.GEMINI_API_KEY) {
  getGeminiClient();
} else {
  logger.info('No GEMINI_API_KEY provided. Grounded synthesis fallback engine will be used.');
}

module.exports = {
  get geminiClient() {
    return getGeminiClient();
  },
  getGeminiClient,
  probeProviderStatus,
};
