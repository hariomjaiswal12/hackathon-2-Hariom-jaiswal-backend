const fs = require('fs');
const path = require('path');

console.log('=== CHECKING WORKSPACE SOURCE FILES FOR SECRET EXPOSURE ===\n');

const ROOT_DIR = path.resolve(__dirname, '../..');

const suspiciousPatterns = [
  { name: 'Atlas Connection String', regex: /mongodb\+srv:\/\/(?!\[REDACTED)[^@\s]+@[^/\s]+/i },
  { name: 'Gemini Live Key', regex: /AIzaSy[A-Za-z0-9_-]{33}/ },
  { name: 'JWT Private Key or Live Secret', regex: /["'](?:companyiq_[a-z0-9_]+_prod)["']/i },
];

let scannedCount = 0;
let flaggedCount = 0;

function walk(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.tmp_chrome_careers_profile' || item === '.tmp_chrome_whatif_profile') continue;
    // Skip .env files because they are gitignored and contain local dev configuration
    if (item.startsWith('.env') && item !== '.env.example') continue;

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (stat.isFile()) {
      if (item.endsWith('.png') || item.endsWith('.jpg') || item.endsWith('.ico') || item.endsWith('.pdf')) continue;
      scannedCount++;
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        suspiciousPatterns.forEach(pattern => {
          if (pattern.regex.test(content)) {
            const rel = path.relative(ROOT_DIR, fullPath);
            console.warn(`[WARNING] Pattern '${pattern.name}' matched in file: ${rel}`);
            flaggedCount++;
          }
        });
      } catch (_) {}
    }
  }
}

walk(ROOT_DIR);

console.log(`Scanned ${scannedCount} files across workspace.`);
if (flaggedCount === 0) {
  console.log('[PASS] No hardcoded Atlas URIs, credentials, or live API keys found in project source files.');
} else {
  console.log(`[ALERT] Found ${flaggedCount} potential secret matches.`);
}
