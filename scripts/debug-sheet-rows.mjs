import { DATA_LINKS } from '../lib/dataLinks.js';
import { fetchRawCSV } from '../lib/fetchCSV.js';
import Papa from 'papaparse';

async function debugEvents() {
  const csvRaw = await fetchRawCSV(DATA_LINKS.bahsu.csvUrl);
  const rawRows = Papa.parse(csvRaw, { header: false }).data;

  console.log('Total raw rows:', rawRows.length);
  for (let r = 20; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    console.log(`Row #${r + 1} | A: "${row[0] || ''}" | B: "${row[1] || ''}" | C: "${row[2] || ''}" | D: "${(row[3] || '').replace(/\r?\n/g, '\\n')}" | E: "${row[4] || ''}"`);
  }
}
debugEvents();
