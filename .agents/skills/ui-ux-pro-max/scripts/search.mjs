import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

const CSV_FILES = {
  style: 'styles.csv',
  color: 'colors.csv',
  typography: 'typography.csv',
  ux: 'ux-guidelines.csv',
  chart: 'charts.csv',
  motion: 'motion.csv',
  product: 'products.csv',
  reasoning: 'ui-reasoning.csv',
  landing: 'landing.csv',
  icons: 'icons.csv',
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function searchDomain(domain = 'ux', query = '', maxResults = 5) {
  const fileName = CSV_FILES[domain] || 'ux-guidelines.csv';
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return { error: `File ${fileName} not found for domain ${domain}` };
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return { results: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = vals[idx] || '';
    });
    rows.push(obj);
  }

  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = rows.map((row) => {
    let score = 0;
    const text = Object.values(row).join(' ').toLowerCase();
    queryTerms.forEach((t) => {
      if (text.includes(t)) score += 1;
    });
    return { score, row };
  });

  scored.sort((a, b) => b.score - a.score);
  const filtered = queryTerms.length > 0 ? scored.filter((s) => s.score > 0) : scored;
  const results = filtered.slice(0, maxResults).map((s) => s.row);

  return { domain, query, count: results.length, results };
}

// CLI usage
const args = process.argv.slice(2);
if (args.length > 0) {
  const query = args[0] || '';
  let domain = 'ux';
  const domainIdx = args.indexOf('--domain');
  if (domainIdx !== -1 && args[domainIdx + 1]) {
    domain = args[domainIdx + 1];
  }
  const res = searchDomain(domain, query);
  console.log(JSON.stringify(res, null, 2));
}
