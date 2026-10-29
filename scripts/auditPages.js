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

const pagesDir = path.join(__dirname, '../../h2frontend/src/pages');
const files = [];

function getFiles(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) getFiles(full);
    else if (/\.(tsx|ts)$/.test(item)) files.push(full);
  }
}
getFiles(pagesDir);

console.log('CHECKING ' + files.length + ' PAGE FILES...');

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  const rel = path.relative(pagesDir, f);

  lines.forEach((l, i) => {
    // Check navigate
    const nav = l.match(/navigate\(([^)]+)\)/);
    if (nav) {
      const arg = nav[1].trim();
      if (arg.startsWith("'") || arg.startsWith('"')) {
        const route = arg.slice(1, -1);
        if (!isRouteValid(route) && !route.startsWith('/company/')) {
          console.log(`[INVALID NAVIGATE] ${rel}:${i+1} -> navigate(${arg})`);
        }
      }
    }

    // Check Link to
    const linkTo = l.match(/<Link[^>]+to=(?:\{([^}]+)\}|["']([^"']+)["'])/);
    if (linkTo) {
      const lit = linkTo[2];
      if (lit && !isRouteValid(lit)) {
        console.log(`[INVALID LINK TO] ${rel}:${i+1} -> to="${lit}"`);
      }
    }

    // Check href
    const href = l.match(/href=(?:\{([^}]+)\}|["']([^"']+)["'])/);
    if (href) {
      const lit = href[2];
      const expr = href[1];
      if (lit) {
        if (lit === '#' || lit === '' || lit.includes('unavailable') || lit.includes('example.com')) {
          console.log(`[PLACEHOLDER HREF] ${rel}:${i+1} -> href="${lit}"`);
        }
      }
      if (expr) {
        if (expr.includes('unavailable') || expr.includes('example.com')) {
          console.log(`[PLACEHOLDER EXPR HREF] ${rel}:${i+1} -> href={${expr}}`);
        }
      }
    }
  });
});

console.log('PAGE AUDIT COMPLETE.');

