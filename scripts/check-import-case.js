const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const RESOLVE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.json',
  '.css', '.scss', '.sass', '.less',
  '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
  '.mjs', '.cjs'
];

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      out.push(...walk(fullPath));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (SOURCE_EXTENSIONS.has(ext)) {
      out.push(fullPath);
    }
  }

  return out;
}

function readEntriesSafe(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return null;
  }
}

function checkPathCaseSensitive(absPath) {
  const normalized = path.normalize(absPath);
  const parsed = path.parse(normalized);
  const withoutRoot = normalized.slice(parsed.root.length);
  const segments = withoutRoot.split(path.sep).filter(Boolean);

  let current = parsed.root;
  for (const segment of segments) {
    const entries = readEntriesSafe(current);
    if (!entries) {
      return { ok: false, reason: 'not_found', actualPath: null };
    }

    if (entries.includes(segment)) {
      current = path.join(current, segment);
      continue;
    }

    const ciMatch = entries.find((name) => name.toLowerCase() === segment.toLowerCase());
    if (ciMatch) {
      const actualPath = path.join(current, ciMatch);
      return { ok: false, reason: 'case_mismatch', actualPath };
    }

    return { ok: false, reason: 'not_found', actualPath: null };
  }

  return { ok: true, reason: 'ok', actualPath: normalized };
}

function resolveImport(importerFile, specifier) {
  const importerDir = path.dirname(importerFile);
  const base = path.resolve(importerDir, specifier);

  const candidates = [];

  if (path.extname(base)) {
    candidates.push(base);
  } else {
    for (const ext of RESOLVE_EXTENSIONS) {
      candidates.push(base + ext);
    }

    for (const ext of RESOLVE_EXTENSIONS) {
      candidates.push(path.join(base, `index${ext}`));
    }
  }

  let firstCaseMismatch = null;

  for (const candidate of candidates) {
    const result = checkPathCaseSensitive(candidate);
    if (result.ok) {
      return { found: true, mismatch: null };
    }

    if (!firstCaseMismatch && result.reason === 'case_mismatch') {
      firstCaseMismatch = { candidate, actualPath: result.actualPath };
    }
  }

  return { found: false, mismatch: firstCaseMismatch };
}

function collectRelativeImports(sourceCode) {
  const imports = [];
  const pattern = /(?:import|export)\s[^'"\n]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;

  let match;
  while ((match = pattern.exec(sourceCode)) !== null) {
    const specifier = match[1] || match[2] || match[3];
    if (specifier && specifier.startsWith('.')) {
      imports.push(specifier);
    }
  }

  return imports;
}

function main() {
  if (!fs.existsSync(srcRoot)) {
    console.error('Could not find src directory to validate imports.');
    process.exit(1);
  }

  const sourceFiles = walk(srcRoot);
  const errors = [];
  const warnings = [];

  for (const filePath of sourceFiles) {
    const code = fs.readFileSync(filePath, 'utf8');
    const imports = collectRelativeImports(code);

    for (const specifier of imports) {
      const resolved = resolveImport(filePath, specifier);
      if (resolved.found) continue;

      const relativeFile = path.relative(repoRoot, filePath).replace(/\\/g, '/');
      if (resolved.mismatch) {
        const expectedPath = path.relative(path.dirname(filePath), resolved.mismatch.actualPath).replace(/\\/g, '/');
        const normalizedExpected = expectedPath.startsWith('.') ? expectedPath : `./${expectedPath}`;
        errors.push(
          `${relativeFile}: import "${specifier}" has wrong case. Use "${normalizedExpected}".`
        );
      } else {
        warnings.push(`${relativeFile}: import "${specifier}" could not be resolved.`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn('\nImport resolution warnings (non-blocking):\n');
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
    console.warn(`\nTotal warnings: ${warnings.length}`);
  }

  if (errors.length > 0) {
    console.error('\nImport case-sensitivity check failed:\n');
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    console.error(`\nTotal issues: ${errors.length}`);
    process.exit(1);
  }

  console.log('Import case-sensitivity check passed.');
}

main();
