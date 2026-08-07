const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'dataset');
const OCR_URL = process.env.OCR_SERVICE_URL || 'http://localhost:5001/parse-marksheet-pages-v2';

async function readFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.pdf')).map(f => path.join(dir, f));
}

async function run() {
  const categories = ['clean', 'scans', 'rotated', 'mobile', 'low_quality'];
  const results = [];

  for (const cat of categories) {
    const files = await readFiles(path.join(ROOT, cat));
    for (const filePath of files) {
      const file = fs.readFileSync(filePath);
      const form = new FormData();
      const blob = new Blob([file], { type: 'application/pdf' });
      form.append('file', blob, path.basename(filePath));

      const res = await fetch(OCR_URL, { method: 'POST', body: form });
      const json = await res.json();
      results.push({ category: cat, file: path.basename(filePath), ok: json.success, totalPages: json.total_pages || 0 });
    }
  }

  const summary = results.reduce((acc, r) => {
    acc[r.category] = acc[r.category] || { total: 0, ok: 0 };
    acc[r.category].total += 1;
    if (r.ok) acc[r.category].ok += 1;
    return acc;
  }, {});

  console.log('Benchmark summary:', summary);
  fs.writeFileSync(path.join(__dirname, '..', 'benchmark-results.json'), JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error('Benchmark failed:', err.message);
  process.exit(1);
});
