import { DATA_LINKS } from '../lib/dataLinks.js';
import { fetchRawCSV, getAnggotaData } from '../lib/fetchCSV.js';
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

async function simulateFullSync() {
  const anggota = await getAnggotaData(DATA_LINKS.anggota.csvUrl);
  const csvRaw = await fetchRawCSV(DATA_LINKS.bahsu.csvUrl);
  const rows = Papa.parse(csvRaw, { header: false }).data;

  // Build member profiles
  const profiles = anggota.anggota.map(a => ({
    id: a.id,
    nama: a.nama,
    cleanNama: cleanNameStrict(a.nama),
    // Existing list with test rows filtered out
    bahtsuList: a.bahtsuList.filter(b => {
      const l = b.toLowerCase();
      return !l.includes('uji coba') && !l.includes('verifikasi otomatis') && !l.includes('uji dua siswa');
    })
  }));

  // Parse events with continuations
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
      currentEvent.delegasi.push(del);
    }
  }
  if (currentEvent) events.push(currentEvent);

  console.log(`Parsed ${events.length} events.`);

  // Iterate valid events and add entries to students
  events.forEach(ev => {
    const isTestRow = ev.acara.includes('Uji Coba') || ev.acara.includes('Verifikasi Otomatis');
    if (isTestRow) return; // Skip test rows!

    const ket = ev.keterangan.toUpperCase();
    const isIzin = ket.includes('IZIN') || ket.includes('BATAL') || ket.includes('MUHAFADZOH');
    if (isIzin) return;

    const newEntry = `${ev.acara}\t${ev.tanggal}`;
    const newCompare = cleanEntryForCompare(`${ev.acara} ${ev.tanggal}`);

    // Flatten delegates
    const lines = [];
    ev.delegasi.forEach(d => {
      d.split(/\r?\n/).forEach(l => {
        if (l.trim()) lines.push(l.trim());
      });
    });

    lines.forEach(line => {
      if (shouldSkipDelegasiLine(line)) return;

      let clean = cleanNameStrict(line);
      clean = resolveStudentAlias(clean);

      // Match profile
      let matched = profiles.find(p => p.cleanNama === clean);
      if (!matched) {
        if (clean === 'thohir' || clean === 'muhammad thohir') matched = profiles.find(p => p.id === 'LBM-002');
        else if (clean === 'muthohir' || clean === 'muhammad muthohir') matched = profiles.find(p => p.id === 'LBM-011');
      }

      if (matched) {
        const already = matched.bahtsuList.some(b => cleanEntryForCompare(b) === newCompare);
        if (!already) {
          matched.bahtsuList.push(newEntry);
        }
      }
    });
  });

  console.log('\n=== HASIL SETELAH PERBAIKAN CONTINUATION & PEMBERSIHAN DATA UJI ===');
  let totalCount = 0;
  profiles.forEach(p => {
    totalCount += p.bahtsuList.length;
    console.log(`${p.id} | ${p.nama} : ${p.bahtsuList.length} BM`);
  });
  console.log('\nTotal Kehadiran Seluruh Santri:', totalCount);
}
simulateFullSync();
