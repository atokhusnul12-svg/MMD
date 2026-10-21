import { DATA_LINKS } from '../lib/dataLinks.js';
import { fetchRawCSV } from '../lib/fetchCSV.js';
import Papa from 'papaparse';

function cleanNameStrict(str) {
  if (!str) return '';
  return String(str)
    .replace(/^(\d+[\.\)]|\-|\•)\s*/, '')
    .replace(/^(\d+[\.\)]\s*m\.)/i, 'm. ')
    .replace(/^(bpk\.|bapak|ust\.|ustadz|gus)\s+/i, '')
    .replace(/[''’`]/g, '')
    .replace(/[\.\,\;\:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function resolveStudentAlias(cleanName) {
  if (cleanName === 'moh sabiqun nasich' || cleanName === 'sabiqun nasich') return 'm sabiqun nasih';
  if (cleanName === 'abdul hakim ibnu asyharii') return 'abdul hakim ibnu asyhari';
  if (cleanName === 'azza aulia') return 'm aulia azza muzaka';
  if (cleanName === 'qolbun lam yanam') return 'moh qolbu lamyanam asshufi';
  return cleanName;
}

function shouldSkipDelegasiLine(line) {
  if (!line || !line.trim()) return true;
  const raw = line.trim().toLowerCase();
  const stripped = raw.replace(/^(\d+[\.\)]|\-|\•)\s*/, '').trim();

  if (stripped.startsWith('bpk.') || stripped.startsWith('bapak')) return true;
  if (raw === '-' || stripped === '-' || stripped.startsWith('komisi') || stripped.startsWith('kom ') || stripped === 'kom a' || stripped === 'kom b') return true;
  if (raw.includes('semua anggota') || stripped.includes('semua anggota')) return true;
  if (stripped === 'izin' || stripped === 'batal' || stripped === 'nihil' || stripped === 'tidak ada') return true;

  return false;
}

function cleanEntryForCompare(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\t\s]+/g, ' ')
    .replace(/[''’`]/g, '')
    .trim()
    .toLowerCase();
}

async function verifyDetailedCounts() {
  const anggotaRaw = await fetchRawCSV(DATA_LINKS.anggota.csvUrl);
  const bahsuRaw = await fetchRawCSV(DATA_LINKS.bahsu.csvUrl);

  const aRows = Papa.parse(anggotaRaw, { header: false }).data;
  const bRows = Papa.parse(bahsuRaw, { header: false }).data;

  // Build members
  const members = [];
  for (let i = 1; i < aRows.length; i++) {
    const r = aRows[i];
    const no = r[0];
    const nama = r[1];
    if (!nama || nama.toLowerCase() === 'nama') continue;
    const curJ = r[9] || '';
    // filter out test rows
    const cleanedJ = curJ.split(/\r?\n/).filter(line => {
      const l = line.toLowerCase();
      return !l.includes('uji coba') && !l.includes('verifikasi otomatis') && !l.includes('uji dua siswa');
    });
    members.push({
      no,
      nama,
      cleanNama: cleanNameStrict(nama),
      lines: cleanedJ
    });
  }

  // Parse events with continuation
  const events = [];
  for (let r = 2; r < bRows.length; r++) {
    const row = bRows[r] || [];
    const acara = String(row[1] || '').trim();
    const tgl = String(row[2] || '').trim();
    const del = String(row[3] || '').trim();
    const ket = String(row[4] || '').trim();

    if (!acara) continue; // continuation row skipped as main
    if (acara.includes('Uji Coba') || acara.includes('Verifikasi Otomatis')) continue; // test row skipped

    // Gather continuation delegates
    const allDelLines = del ? del.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];
    for (let cr = r + 1; cr < bRows.length; cr++) {
      const nextR = bRows[cr] || [];
      const nextAcara = String(nextR[1] || '').trim();
      const nextNo = String(nextR[0] || '').trim();
      const nextTgl = String(nextR[2] || '').trim();
      const nextDel = String(nextR[3] || '').trim();

      if (nextAcara || (nextNo && !isNaN(parseInt(nextNo))) || nextTgl) break;
      if (nextDel) {
        nextDel.split(/\r?\n/).forEach(s => {
          if (s.trim()) allDelLines.push(s.trim());
        });
      }
    }

    events.push({
      acara,
      tanggal: tgl,
      keterangan: ket,
      delegates: allDelLines
    });
  }

  // Sync to members
  events.forEach(ev => {
    const ketUpper = ev.keterangan.toUpperCase();
    if (ketUpper.includes('IZIN') || ketUpper.includes('BATAL') || ketUpper.includes('MUHAFADZOH')) return;

    const entryText = `${ev.acara}\t${ev.tanggal}`;
    const compareText = cleanEntryForCompare(`${ev.acara} ${ev.tanggal}`);

    ev.delegates.forEach(dLine => {
      if (shouldSkipDelegasiLine(dLine)) return;
      let clean = cleanNameStrict(dLine);
      clean = resolveStudentAlias(clean);

      let m = members.find(x => x.cleanNama === clean);
      if (!m) {
        if (clean === 'thohir' || clean === 'muhammad thohir') m = members.find(x => x.no == 2);
        else if (clean === 'muthohir' || clean === 'muhammad muthohir') m = members.find(x => x.no == 11);
      }

      if (m) {
        const exists = m.lines.some(l => cleanEntryForCompare(l) === compareText);
        if (!exists) {
          m.lines.push(entryText);
        }
      }
    });
  });

  console.log('=== DAFTAR DETAIL HASIL SINKRONISASI AKHIR PER SANTRI ===');
  members.forEach(m => {
    console.log(`No. ${m.no.toString().padStart(2, ' ')} | ${m.nama.padEnd(35, ' ')} : ${m.lines.length} Forum`);
  });
  const grandTotal = members.reduce((a, b) => a + b.lines.length, 0);
  console.log('\nTotal Kehadiran Seluruh Santri:', grandTotal);
}
verifyDetailedCounts();
