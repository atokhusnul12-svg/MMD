import { DATA_LINKS } from '../lib/dataLinks.js';
import { getAnggotaData, getBahsuData, fetchRawCSV } from '../lib/fetchCSV.js';
import Papa from 'papaparse';

// Helper to normalize names
function normalizeName(str) {
  if (!str) return '';
  return String(str)
    .replace(/^(\d+[\.\)]|\-|\•)\s*/, '')
    .replace(/^(\d+[\.\)]\s*m\.)/i, 'm. ')   // handle 3.M. or 3.m.
    .replace(/^(bpk\.|bapak|ust\.|ustadz|gus)\s+/i, '')
    .replace(/[''’`]/g, '')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function shouldSkip(line) {
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

async function fullDryRun() {
  const anggotaRes = await getAnggotaData(DATA_LINKS.anggota.csvUrl);
  const bahsuRes = await getBahsuData(DATA_LINKS.bahsu.csvUrl);
  const csvRaw = await fetchRawCSV(DATA_LINKS.anggota.csvUrl);
  const parsedAnggota = Papa.parse(csvRaw, { header: false }).data;

  // Map 25 anggota
  const members = anggotaRes.anggota.map(a => ({
    ...a,
    normNama: normalizeName(a.nama),
  }));

  const pendingWrites = []; // { studentId, studentName, eventNo, acara, tanggal, writeContent, reason }
  const unmatchedDelegates = []; // { eventNo, acara, line, normLine }

  bahsuRes.events.forEach(ev => {
    const ket = (ev.keterangan || '').toUpperCase();
    const isIzin = ket.includes('IZIN') || ket.includes('BATAL') || ket.includes('MUHAFADZOH') || ket.includes('BERHALANGAN');
    if (isIzin) return; // Izin tidak dicatat di kolom J

    const delegasi = Array.isArray(ev.delegasi) ? ev.delegasi : [ev.delegasi];
    delegasi.forEach(delLine => {
      if (shouldSkip(delLine)) return;

      const normDel = normalizeName(delLine);
      // Find matching member: strict exact match after normalization
      const matched = members.find(m => m.normNama === normDel);

      if (!matched) {
        // Find closest candidates for reporting
        const candidates = members.filter(m => {
          return m.normNama.includes(normDel) || normDel.includes(m.normNama);
        }).map(m => `${m.id} (${m.nama})`);

        unmatchedDelegates.push({
          eventNo: ev.no,
          acara: ev.acara,
          line: delLine,
          normLine: normDel,
          candidates,
        });
        return;
      }

      // Check if entry already in student's Column J
      const studentRow = parsedAnggota.find(r => r[0] == matched.noOriginal);
      const rawJ = studentRow ? (studentRow[9] || '') : '';
      const existingLines = rawJ.split(/\r?\n/).map(l => cleanEntryForCompare(l)).filter(Boolean);

      const targetEntryText = `${ev.acara}\t${ev.tanggal}`;
      const targetCompare = cleanEntryForCompare(`${ev.acara} ${ev.tanggal}`);

      const alreadyExists = existingLines.some(el => {
        if (el === targetCompare) return true;
        // check if both acara and tanggal are in this line
        const normAcara = cleanEntryForCompare(ev.acara);
        const normTgl = cleanEntryForCompare(ev.tanggal);
        if (normAcara.length >= 6 && el.includes(normAcara)) {
          if (!normTgl || el.includes(normTgl)) return true;
        }
        return false;
      });

      if (!alreadyExists) {
        pendingWrites.push({
          studentId: matched.id,
          studentName: matched.nama,
          eventNo: ev.no,
          acara: ev.acara,
          tanggal: ev.tanggal,
          writeContent: targetEntryText,
        });
      }
    });
  });

  console.log('=== HASIL ANALISIS DRY-RUN PENDING WRITES ===');
  console.log('Total pending writes found:', pendingWrites.length);
  pendingWrites.forEach((pw, idx) => {
    console.log(`${idx + 1}. [${pw.studentId}] ${pw.studentName} <- Agenda #${pw.eventNo}: "${pw.acara}" (${pw.tanggal})`);
  });

  console.log('\n=== UNMATCHED DELEGATES (TIDAK COCOK DENGAN 25 SANTRI LBM) ===');
  console.log('Total unmatched lines:', unmatchedDelegates.length);
  console.log('\n=== STRUKTUR SEL KOLOM J PER ANGGOTA ===');
  for (let i = 1; i < parsedAnggota.length; i++) {
    const r = parsedAnggota[i];
    const no = r[0];
    const nama = r[1];
    if (!nama || nama.toLowerCase() === 'nama') continue;
    const rawJ = r[9] || '';
    const lines = rawJ.split(/\r?\n/);
    const filledLines = lines.map((l, idx) => ({ l: l.trim(), idx })).filter(x => x.l);
    const lastFilledIdx = filledLines.length > 0 ? filledLines[filledLines.length - 1].idx : -1;
    const trailingEmpty = lines.length - 1 - lastFilledIdx;
    console.log(`No. ${no} | ${nama} | Total Baris: ${lines.length} | Baris Terisi: ${filledLines.length} | Index Terakhir: ${lastFilledIdx} | Baris Kosong di Bawah: ${trailingEmpty}`);
  }
}
fullDryRun();
