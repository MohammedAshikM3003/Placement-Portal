/**
 * scripts/check-css-leaks.js
 * CI script: fails if any .module.css file contains global CSS leak patterns.
 * Run: node scripts/check-css-leaks.js
 * Add to package.json scripts: "lint:css-leaks": "node scripts/check-css-leaks.js"
 */

const fs   = require('fs');
const path = require('path');

const RULES = [
  {
    pattern: /^\s*body\s*\{/m,
    message: 'bare `body {}` — leaks globally. Use a scoped class.',
  },
  {
    pattern: /^\s*html\s*\{/m,
    message: 'bare `html {}` — leaks globally.',
  },
  {
    pattern: /^\s*\*\s*\{/m,
    message: 'universal `* {}` — high specificity risk.',
  },
  {
    pattern: /\[class\*=/,
    message: '`[class*=]` attribute selector — not allowed in CSS Modules.',
  },
];

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.')) walk(full, acc);
    else if (e.isFile() && e.name.endsWith('.module.css')) acc.push(full);
  }
}

const files = [];
walk(path.join(__dirname, '..', 'src'), files);

let errors = 0;
for (const file of files) {
  const content  = fs.readFileSync(file, 'utf8');
  const relPath  = path.relative(process.cwd(), file);
  for (const rule of RULES) {
    if (rule.pattern.test(content)) {
      console.error('LEAK: ' + relPath + '\n  Rule: ' + rule.message);
      errors++;
    }
  }
}

if (errors === 0) {
  console.log('CSS leak check passed. Scanned ' + files.length + ' module files.');
  process.exit(0);
} else {
  console.error('CSS leak check FAILED. ' + errors + ' issue(s) in ' + files.length + ' module files.');
  process.exit(1);
}