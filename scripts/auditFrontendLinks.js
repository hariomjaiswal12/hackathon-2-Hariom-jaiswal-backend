const fs = require('fs');
const path = require('path');

const registeredRoutes = [
  '/',
  '/dashboard',
  '/explore',
  '/career-dna',
  '/career-dna/build',
  '/career-fit',
  '/compare',
  '/compare/battle',
  '/what-if',
  '/ask',
  '/review-insights',
  '/saved',
  '/saved-comparisons',
  '/history',
  '/sources',
  '/alerts',
  '/settings',
  '/design-system',
];

function isRouteValid(to) {
  if (!to || to === '#') return false;
  if (to.startsWith('/company/')) return true;
  const clean = to.split('?')[0].split('#')[0];
  return registeredRoutes.includes(clean);
}

const findings = {
  brokenInternalLinks: [],
  placeholderHref: [],
  externalUrls: [],
  buttonsWithoutAction: [],
  dynamicLinks: [],
};

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Match all <Link to={...} or to="..."
  const linkMatches = content.matchAll(/<(?:Link|NavLink)[^>]*?\sto=(?:\{([^}]+)\}|["']([^"']+)["'])[^>]*?>/gs);
  for (const m of linkMatches) {
    const rawTo = m[1] || m[2];
    if (m[2]) {
      // Literal string
      if (!isRouteValid(m[2]) && !m[2].startsWith('http')) {
        findings.brokenInternalLinks.push({ file: filePath, dest: m[2], raw: m[0] });
      }
    } else {
      findings.dynamicLinks.push({ file: filePath, expr: rawTo, tag: 'Link' });
    }
  }

  // Match all <a href={...} or href="..."
  const aMatches = content.matchAll(/<a[^>]*?\shref=(?:\{([^}]+)\}|["']([^"']+)["'])[^>]*?>/gs);
  for (const m of aMatches) {
    const expr = m[1];
    const literal = m[2];
    if (literal) {
      if (literal === '#' || literal === '' || literal.includes('unavailable') || literal.includes('example.com')) {
        findings.placeholderHref.push({ file: filePath, href: literal, raw: m[0] });
      } else if (literal.startsWith('http')) {
        findings.externalUrls.push({ file: filePath, href: literal, raw: m[0] });
      } else if (!isRouteValid(literal) && !literal.startsWith('mailto:') && !literal.startsWith('tel:') && !literal.startsWith('#')) {
        findings.brokenInternalLinks.push({ file: filePath, dest: literal, raw: m[0] });
      }
    } else {
      if (expr.includes('unavailable') || expr.includes('example.com')) {
        findings.placeholderHref.push({ file: filePath, href: expr, raw: m[0] });
      }
      findings.dynamicLinks.push({ file: filePath, expr, tag: 'a' });
    }
  }

  // Match all navigate(...)
  const navMatches = content.matchAll(/navigate\(\s*(`[^`]+`|["'][^"']+["']|[^)]+)\s*\)/g);
  for (const m of navMatches) {
    const raw = m[1];
    if (raw.startsWith('"') || raw.startsWith("'")) {
      const clean = raw.slice(1, -1);
      if (!isRouteValid(clean) && !clean.startsWith('/company/') && !clean.startsWith('..')) {
        findings.brokenInternalLinks.push({ file: filePath, dest: clean, raw: m[0] });
      }
    }
  }

  // Match all <Button ...> and <button ...> without onClick or type="submit" or disabled
  const buttonMatches = content.matchAll(/<(?:Button|button)([^>]*?)>/g);
  for (const m of buttonMatches) {
    const attrs = m[1];
    const hasOnClick = /onClick\s*=/.test(attrs);
    const hasTypeSubmit = /type\s*=\s*["']submit["']/.test(attrs);
    const hasDisabled = /disabled/.test(attrs);
    const isCloseBtn = /aria-label\s*=\s*["']Close["']/.test(attrs);
    const hasForm = /form\s*=/.test(attrs);
    if (!hasOnClick && !hasTypeSubmit && !hasDisabled && !isCloseBtn && !hasForm) {
      // Check if it's styled like a link or interactive button
      findings.buttonsWithoutAction.push({ file: filePath, tag: m[0] });
    }
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === 'dist' || f === '.git') continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (/\.(tsx|ts|jsx|js)$/.test(f)) {
      scanFile(full);
    }
  }
}

walk(path.join(__dirname, '../../h2frontend/src'));

console.log('=== AUDIT REPORT: FRONTEND CODEBASE ===\n');
console.log(`Found ${findings.brokenInternalLinks.length} broken literal internal links:`);
findings.brokenInternalLinks.forEach(f => console.log(`  ${f.file} -> ${f.dest}`));

console.log(`\nFound ${findings.placeholderHref.length} placeholder / invalid hrefs:`);
findings.placeholderHref.forEach(f => console.log(`  ${f.file} -> ${f.href} (${f.raw})`));

console.log(`\nFound ${findings.externalUrls.length} literal external URLs in JSX:`);
findings.externalUrls.forEach(f => console.log(`  ${f.file} -> ${f.href}`));

console.log(`\nFound ${findings.dynamicLinks.length} dynamic links (<Link to={...}> or <a href={...}>):`);
findings.dynamicLinks.slice(0, 20).forEach(f => console.log(`  ${f.file} [${f.tag}] -> ${f.expr}`));
if (findings.dynamicLinks.length > 20) console.log(`  ... and ${findings.dynamicLinks.length - 20} more`);

console.log(`\nFound ${findings.buttonsWithoutAction.length} buttons without onClick:`);
findings.buttonsWithoutAction.slice(0, 15).forEach(f => console.log(`  ${f.file} -> ${f.tag}`));
if (findings.buttonsWithoutAction.length > 15) console.log(`  ... and ${findings.buttonsWithoutAction.length - 15} more`);
