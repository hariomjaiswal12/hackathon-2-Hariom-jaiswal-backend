const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
console.log('=== PHASE 1: CONFIGURATION & ATLAS URI AUDIT ===\n');

if (!fs.existsSync(envPath)) {
  console.error('[FAIL] h2backend/.env file does not exist at:', envPath);
  process.exit(1);
}

const rawEnv = fs.readFileSync(envPath, 'utf8');
const lines = rawEnv.split(/\r?\n/);

console.log(`[PASS] h2backend/.env file located (${lines.length} lines)`);

// Check duplicate keys
const keyCounts = {};
lines.forEach((line, idx) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    keyCounts[key] = (keyCounts[key] || 0) + 1;
  }
});

const duplicates = Object.entries(keyCounts).filter(([_, count]) => count > 1);
if (duplicates.length > 0) {
  console.log('[WARN] Duplicate keys found in .env:', duplicates.map(([k, c]) => `${k} (${c} times)`).join(', '));
} else {
  console.log('[PASS] No duplicate active keys found in .env');
}

// Check commented out vs active MONGODB_URI
const mongoLines = lines.filter(l => l.includes('MONGODB_URI'));
console.log(`[INFO] Found ${mongoLines.length} line(s) referencing MONGODB_URI:`);
mongoLines.forEach((l, i) => {
  const isCommented = l.trim().startsWith('#');
  console.log(`  Line variant ${i + 1}: ${isCommented ? 'Commented out (#)' : 'Active (uncommented)'}`);
});

// Parse active env
const parsed = dotenv.parse(rawEnv);
const uri = parsed.MONGODB_URI;

if (!uri) {
  console.error('[FAIL] No active MONGODB_URI found in parsed .env!');
  process.exit(1);
}

console.log('[PASS] Active MONGODB_URI is defined.');

// Validate URI structure without leaking secrets
try {
  // Check protocol
  const isSrv = uri.startsWith('mongodb+srv://');
  const isStandard = uri.startsWith('mongodb://');
  console.log(`Scheme: ${isSrv ? 'mongodb+srv:// (Atlas SRV)' : (isStandard ? 'mongodb:// (Standard)' : 'UNKNOWN / INVALID')}`);

  // Regex to inspect components without echoing credentials
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)(?:([^:]+)(?::([^@]+))?@)?([^/?#]+)(?:\/([^?#]*))?(?:\?(.*))?$/);

  if (!match) {
    console.error('[FAIL] MONGODB_URI failed regex parse - malformed URI structure.');
  } else {
    const [_, scheme, user, pass, hosts, dbName, queryStr] = match;
    console.log('[PASS] URI syntax conforms to standard MongoDB connection string format.');
    console.log(`  - Has Scheme: ${!!scheme} (${scheme})`);
    console.log(`  - Has Username: ${!!user} (Length: ${user ? user.length : 0})`);
    console.log(`  - Has Password: ${!!pass} (Length: ${pass ? pass.length : 0})`);
    
    // Check for placeholder passwords
    const placeholders = ['<password>', 'password', 'changeme', 'your_password', 'secret', '<db_password>'];
    const isPlaceholder = pass && placeholders.some(p => pass.toLowerCase().includes(p));
    if (isPlaceholder) {
      console.log('  - [FAIL] Password appears to be a literal placeholder!');
    } else {
      console.log('  - [PASS] Password is not a default placeholder.');
    }

    // Check special characters in user/password that need percent encoding
    const reservedChars = /[:/?#\[\]@!$&'()*+,;=]/;
    // Note: in pass, characters like @, :, /, ?, #, etc. must be URL-encoded if unencoded
    const passNeedsEncoding = pass && reservedChars.test(pass);
    // Check if it already has percent encoding %xx
    const hasPercentEncoding = pass && /%[0-9A-Fa-f]{2}/.test(pass);
    console.log(`  - Password URL Encoding Status: ${hasPercentEncoding ? 'Contains URL percent-encoding' : (passNeedsEncoding ? 'Contains unencoded reserved chars (may need encodeURIComponent)' : 'Alphanumeric / standard chars (safe)')}`);

    // Check Hostname
    const isAtlasHost = hosts && hosts.includes('.mongodb.net');
    console.log(`  - Host is Atlas Cluster (.mongodb.net): ${isAtlasHost ? 'YES' : 'NO'}`);
    const hostParts = hosts ? hosts.split('.') : [];
    console.log(`  - Host Domain Structure: ${hostParts.length > 2 ? hostParts.slice(1).join('.') : 'Unknown'}`);

    // Check Database name
    const cleanDbName = dbName ? dbName.trim() : '';
    console.log(`  - Target Database Name: "${cleanDbName}" (Matches 'companyiq': ${cleanDbName === 'companyiq'})`);
    if (cleanDbName !== 'companyiq') {
      console.log(`  - [WARN/FAIL] Target database is "${cleanDbName}", expected "companyiq". If blank or default, operations may land in 'test' or admin.`);
    }

    // Check Query Parameters
    if (queryStr) {
      const qParams = new URLSearchParams(queryStr);
      const keys = Array.from(qParams.keys());
      console.log(`  - Query Options Present: ${keys.join(', ')}`);
      console.log(`    * retryWrites: ${qParams.get('retryWrites')}`);
      console.log(`    * w: ${qParams.get('w')}`);
      console.log(`    * appName: ${qParams.get('appName') || 'not specified'}`);
    } else {
      console.log('  - Query Options: None');
    }
  }
} catch (err) {
  console.error('[FAIL] Error while parsing URI:', err.message);
}

