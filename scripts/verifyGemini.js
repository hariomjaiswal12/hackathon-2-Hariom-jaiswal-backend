/**
 * Verification script to safely test the configured Gemini API key and model
 * WITHOUT exposing any secret keys or tokens.
 */
require('dotenv').config();
const { probeProviderStatus } = require('../src/config/ai');
const { sanitizeSecrets } = require('../src/utils/sanitizer');

(async () => {
  console.log('====================================================');
  console.log('       CompanyIQ — Gemini Provider Verification     ');
  console.log('====================================================\n');

  const rawKey = process.env.GEMINI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const provider = process.env.AI_PROVIDER || 'gemini';

  console.log('1. Configuration Check:');
  console.log(`   - AI_PROVIDER:      ${provider}`);
  console.log(`   - GEMINI_MODEL:     ${model}`);
  console.log(`   - Key Present:      ${rawKey.trim().length > 0 ? 'YES' : 'NO'}`);
  console.log(`   - Key Length:       ${rawKey.trim().length} chars`);
  console.log(`   - Standard Format:  ${rawKey.startsWith('AIzaSy') ? 'YES (AIzaSy...)' : 'NO (Non-standard or custom prefix)'}`);

  console.log('\n2. Live Provider Probe (Testing Google API Endpoint):');
  try {
    const probe = await probeProviderStatus(true);
    console.log(`   - Provider:         ${probe.provider}`);
    console.log(`   - Configured:       ${probe.configured}`);
    console.log(`   - Status:           ${probe.status.toUpperCase()}`);
    console.log(`   - Message:          ${sanitizeSecrets(probe.message)}`);
    if (probe.errorReason) {
      console.log(`   - Reason:           ${sanitizeSecrets(probe.errorReason)}`);
    }

    if (probe.status === 'ready') {
      console.log('\n>>> SUCCESS: Gemini API is connected and responding normally! <<<');
    } else if (probe.status === 'suspended') {
      console.log('\n>>> ACTION REQUIRED: Consumer project suspended (CONSUMER_SUSPENDED).');
      console.log('    The configured key belongs to a Google Cloud project that Google has suspended.');
      console.log('    Solution: Create a free key at https://aistudio.google.com/app/apikey and paste into .env');
    } else {
      console.log('\n>>> WARNING: Provider returned an error. Grounded rule engine active.');
    }
  } catch (err) {
    console.log(`   - Error:            ${sanitizeSecrets(err.message)}`);
  }

  console.log('\n====================================================\n');
})();

