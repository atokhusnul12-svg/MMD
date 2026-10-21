import { DATA_LINKS } from '../lib/dataLinks.js';
import { fetchRawCSV, getAnggotaData } from '../lib/fetchCSV.js';
import Papa from 'papaparse';

async function testContinuationAndCleanup() {
  const csvRaw = await fetchRawCSV(DATA_LINKS.bahsu.csvUrl);
  const rows = Papa.parse(csvRaw, { header: false }).data;

  console.log('Total raw rows:', rows.length);
  // Group rows into events
  const events = [];
  let currentEvent = null;

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r] || [];
    const no = String(row[0] || '').trim();
    const acara = String(row[1] || '').trim();
    const tanggal = String(row[2] || '').trim();
    const del = String(row[3] || '').trim();
    const ket = String(row[4] || '').trim();

    if (acara) {
      if (currentEvent) events.push(currentEvent);
      currentEvent = {
        startRow: r + 1,
        no,
        acara,
        tanggal,
        delegasi: del ? [del] : [],
        keterangan: ket,
      };
    } else if (currentEvent && del) {
      // Continuation row
      currentEvent.delegasi.push(del);
    }
  }
  if (currentEvent) events.push(currentEvent);

  console.log('Total grouped events:', events.length);
  events.forEach((ev, idx) => {
    const isTest = (ev.acara + ' ' + ev.keterangan).toLowerCase().includes('uji') || (ev.acara + ' ' + ev.keterangan).toLowerCase().includes('verifikasi');
    console.log(`Event #${idx + 1} (Row ${ev.startRow}): "${ev.acara}" | ${ev.tanggal} | ${isTest ? '[TEST ROW]' : '[VALID]'} | Delegates: ${ev.delegasi.length} lines`);
  });
}
testContinuationAndCleanup();
