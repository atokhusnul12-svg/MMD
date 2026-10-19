import Papa from 'papaparse';
import { fetchRawCSV } from '@/lib/fetchCSV';
import { getProgramConfig } from '@/lib/waka2Config';

/**
 * PARSER DATA ABSENSI WAKA II MMD DENGAN SUMBER TABULAR TERBARU
 * ==============================================================
 * Mendukung pembacaan seluruh baris (multi-bulan kronologis):
 * 1. Dzulqo'dah
 * 2. Dzulhijjah
 * 3. Muharram
 * 4. Shafar
 * 5. Rabiul Tsani
 * Dan bulan-bulan berikutnya yang ditambahkan ke spreadsheet secara otomatis.
 */

function cleanText(val) {
  return val !== null && val !== undefined ? String(val).trim() : '';
}

export async function getWaka2Absensi(programSlug, options = {}) {
  const config = getProgramConfig(programSlug);
  if (!config) {
    throw new Error(`Program WAKA II dengan id "${programSlug}" tidak ditemukan.`);
  }

  const csvText = await fetchRawCSV(config.csvUrl, options);
  if (!csvText || !csvText.trim()) {
    throw new Error(`Data CSV absensi untuk program "${config.name}" kosong.`);
  }

  const parsed = Papa.parse(csvText, { skipEmptyLines: true });
  const allRows = parsed.data || [];
  if (allRows.length <= 1) {
    throw new Error('Data CSV absensi tidak memiliki baris catatan yang valid.');
  }

  const header = allRows[0].map((h) => cleanText(h).toLowerCase());
  const dataRows = allRows.slice(1);

  // Deteksi indeks kolom berdasarkan header
  const idxBulan = header.indexOf('bulan') !== -1 ? header.indexOf('bulan') : 0;
  const idxProgram = header.indexOf('program') !== -1 ? header.indexOf('program') : 1;
  const idxTingkat = header.indexOf('tingkat') !== -1 ? header.indexOf('tingkat') : 2;
  const idxKelas = header.indexOf('kelas') !== -1 ? header.indexOf('kelas') : 3;
  const idxNo = header.indexOf('no') !== -1 ? header.indexOf('no') : 4;
  const idxNama = header.indexOf('nama') !== -1 ? header.indexOf('nama') : 5;
  const idxDomisili = header.indexOf('domisili') !== -1 ? header.indexOf('domisili') : 6;

  // Indeks kolom Usbu'
  const idxU1_H = header.indexOf('usbu1_h') !== -1 ? header.indexOf('usbu1_h') : 7;
  const idxU1_S = header.indexOf('usbu1_s') !== -1 ? header.indexOf('usbu1_s') : 8;
  const idxU1_I = header.indexOf('usbu1_i') !== -1 ? header.indexOf('usbu1_i') : 9;
  const idxU1_A = header.indexOf('usbu1_a') !== -1 ? header.indexOf('usbu1_a') : 10;

  const idxU2_H = header.indexOf('usbu2_h') !== -1 ? header.indexOf('usbu2_h') : 11;
  const idxU2_S = header.indexOf('usbu2_s') !== -1 ? header.indexOf('usbu2_s') : 12;
  const idxU2_I = header.indexOf('usbu2_i') !== -1 ? header.indexOf('usbu2_i') : 13;
  const idxU2_A = header.indexOf('usbu2_a') !== -1 ? header.indexOf('usbu2_a') : 14;

  const idxU3_H = header.indexOf('usbu3_h') !== -1 ? header.indexOf('usbu3_h') : 15;
  const idxU3_S = header.indexOf('usbu3_s') !== -1 ? header.indexOf('usbu3_s') : 16;
  const idxU3_I = header.indexOf('usbu3_i') !== -1 ? header.indexOf('usbu3_i') : 17;
  const idxU3_A = header.indexOf('usbu3_a') !== -1 ? header.indexOf('usbu3_a') : 18;

  const idxU4_H = header.indexOf('usbu4_h') !== -1 ? header.indexOf('usbu4_h') : 19;
  const idxU4_S = header.indexOf('usbu4_s') !== -1 ? header.indexOf('usbu4_s') : 20;
  const idxU4_I = header.indexOf('usbu4_i') !== -1 ? header.indexOf('usbu4_i') : 21;
  const idxU4_A = header.indexOf('usbu4_a') !== -1 ? header.indexOf('usbu4_a') : 22;

  // Kolom total dan persentase
  const idxTotalH = header.indexOf('total_h') !== -1 ? header.indexOf('total_h') : 23;
  const idxTotalS = header.indexOf('total_s') !== -1 ? header.indexOf('total_s') : 24;
  const idxTotalI = header.indexOf('total_i') !== -1 ? header.indexOf('total_i') : 25;
  const idxTotalA = header.indexOf('total_a') !== -1 ? header.indexOf('total_a') : 26;
  const idxTotalPertemuan =
    header.indexOf('total_pertemuan') !== -1 ? header.indexOf('total_pertemuan') : 27;

  // Aturan pencocokan program
  const matchTingkat = (tingkatVal, programVal) => {
    const t = cleanText(tingkatVal).toUpperCase();
    const p = cleanText(programVal).toUpperCase();

    if (config.id === 'aliyah') {
      return t === 'MA' || (p.includes('TAFAQQUH') && t.includes('MA'));
    }
    if (config.id === 'tsanawiyah') {
      return t === 'MTS' || (p.includes('TAFAQQUH') && t.includes('MTS'));
    }
    if (config.id === 'mubahitsin') {
      return (
        p.includes('MUBAHITSIN') ||
        t === 'MI' ||
        t === 'MIS' ||
        t === 'MI-MIS' ||
        t.includes('MI')
      );
    }
    return false;
  };

  const monthsMap = new Map(); // monthId => { id, name, year, pertemuanCount }
  const membersMap = new Map(); // normalizedName => memberData
  const classesSet = new Set();
  const domisiliSet = new Set();

  for (const r of dataRows) {
    const bulan = cleanText(r[idxBulan]);
    const program = cleanText(r[idxProgram]);
    const tingkat = cleanText(r[idxTingkat]);
    const kelas = cleanText(r[idxKelas]);
    const noRaw = cleanText(r[idxNo]);
    const nama = cleanText(r[idxNama]);
    const domisili = cleanText(r[idxDomisili]);

    // Abaikan baris rekapitulasi kelas (di mana domisili adalah angka murni atau nama adalah nama kelas)
    const isClassSummary =
      /^\d+$/.test(domisili) ||
      /^(5 MI|6 MI|MIS|1 MTS|2 MTS|3 MTS|1 MA|2 MA|3 MA)$/i.test(nama) ||
      !nama ||
      nama.toUpperCase().startsWith('TOTAL') ||
      nama.toUpperCase().startsWith('REKAP');

    if (isClassSummary) continue;

    // Filter baris sesuai program aktif
    if (!matchTingkat(tingkat, program)) continue;

    // Catat bulan secara dinamis
    const monthId = bulan
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');

    if (!monthsMap.has(monthId)) {
      const yearMatch = bulan.match(/\b(20\d\d|14\d\d)\b/);
      monthsMap.set(monthId, {
        id: monthId,
        name: bulan,
        year: yearMatch ? yearMatch[1] : null,
        pertemuanCount: 4,
      });
    }

    const parseUsbu = (colH, colS, colI, colA, usbuNo) => {
      const h = cleanText(r[colH]);
      const s = cleanText(r[colS]);
      const i = cleanText(r[colI]);
      const a = cleanText(r[colA]);
      let status = '';
      if (a === '1') status = 'A';
      if (i === '1') status = 'I';
      if (s === '1') status = 'S';
      if (h === '1') status = 'H';
      return {
        usbuNo,
        status,
        h,
        s,
        i,
        a,
        hasRecord: h === '1' || s === '1' || i === '1' || a === '1',
      };
    };

    const usbuList = [
      parseUsbu(idxU1_H, idxU1_S, idxU1_I, idxU1_A, 1),
      parseUsbu(idxU2_H, idxU2_S, idxU2_I, idxU2_A, 2),
      parseUsbu(idxU3_H, idxU3_S, idxU3_I, idxU3_A, 3),
      parseUsbu(idxU4_H, idxU4_S, idxU4_I, idxU4_A, 4),
    ];

    const hadirCount = parseInt(r[idxTotalH], 10) || (usbuList.filter((u) => u.status === 'H').length);
    const sakitCount = parseInt(r[idxTotalS], 10) || (usbuList.filter((u) => u.status === 'S').length);
    const izinCount = parseInt(r[idxTotalI], 10) || (usbuList.filter((u) => u.status === 'I').length);
    const alpaCount = parseInt(r[idxTotalA], 10) || (usbuList.filter((u) => u.status === 'A').length);
    const totalPertemuan = parseInt(r[idxTotalPertemuan], 10) || 4;

    // Persentase kehadiran bulanan = (Hadir / Total Pertemuan Valid) * 100%
    const persenBulanan = totalPertemuan > 0 ? (hadirCount / totalPertemuan) * 100 : null;
    const cleanPersenBulanan =
      persenBulanan !== null ? Math.round(persenBulanan * 10) / 10 : null;

    if (kelas && !/^\d+$/.test(kelas)) classesSet.add(kelas);
    if (domisili && !/^\d+$/.test(domisili)) domisiliSet.add(domisili);

    // Kunci normalisasi nama santri untuk identitas unik multi-bulan
    const normKey = nama
      .toLowerCase()
      .replace(/['’`.]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!membersMap.has(normKey)) {
      membersMap.set(normKey, {
        id: `${config.id}-${membersMap.size + 1}`,
        no: parseInt(noRaw, 10) || membersMap.size + 1,
        nama,
        domisili: domisili || '-',
        kelas: kelas || '-',
        monthlyRecords: {},
      });
    }

    const member = membersMap.get(normKey);
    // Perbarui data kelas dan domisili jika sebelumnya kosong
    if (kelas && !/^\d+$/.test(kelas)) member.kelas = kelas;
    if (domisili && !/^\d+$/.test(domisili)) member.domisili = domisili;

    member.monthlyRecords[monthId] = {
      monthId,
      monthName: bulan,
      pertemuanCount: totalPertemuan,
      hadir: hadirCount,
      sakit: sakitCount,
      izin: izinCount,
      alpa: alpaCount,
      persenHadir: cleanPersenBulanan,
      persenHadirText: cleanPersenBulanan !== null ? `${cleanPersenBulanan}%` : '—',
      usbu: usbuList,
    };
  }

  // Urutan kronologis bulan sesuai dengan kemunculan di spreadsheet
  const availableMonths = Array.from(monthsMap.values());

  // 2. Hitung Persentase Kehadiran Keseluruhan per Anggota (Poin 6)
  // Rumus: (Total Hadir Seluruh Bulan / Total Pertemuan Valid Seluruh Bulan) * 100%
  // BUKAN rata-rata sederhana dari persentase bulanan!
  const members = Array.from(membersMap.values()).map((m) => {
    let sumMeetings = 0;
    let sumHadir = 0;
    let sumSakit = 0;
    let sumIzin = 0;
    let sumAlpa = 0;

    for (const rec of Object.values(m.monthlyRecords)) {
      if (typeof rec.pertemuanCount === 'number' && rec.pertemuanCount > 0) {
        sumMeetings += rec.pertemuanCount;
        sumHadir += rec.hadir;
        sumSakit += rec.sakit;
        sumIzin += rec.izin;
        sumAlpa += rec.alpa;
      }
    }

    const overallPersen = sumMeetings > 0 ? (sumHadir / sumMeetings) * 100 : null;
    const cleanOverall =
      overallPersen !== null ? Math.round(overallPersen * 10) / 10 : null;

    return {
      ...m,
      overall: {
        totalPertemuanValid: sumMeetings,
        totalHadir: sumHadir,
        totalSakit: sumSakit,
        totalIzin: sumIzin,
        totalAlpa: sumAlpa,
        persenHadir: cleanOverall,
        persenHadirText: cleanOverall !== null ? `${cleanOverall}%` : '—',
      },
    };
  });

  // 3. Hitung Rekapitulasi Bulanan Seluruh Anggota (Poin 8)
  const monthlyAggregates = availableMonths.map((mInfo) => {
    let totalSantriValid = 0;
    let sumPersenAnggota = 0;
    let sumHadirSemua = 0;
    let sumSakitSemua = 0;
    let sumIzinSemua = 0;
    let sumAlpaSemua = 0;
    let sumKesempatanHadir = 0;

    for (const m of members) {
      const rec = m.monthlyRecords[mInfo.id];
      if (rec && typeof rec.persenHadir === 'number') {
        totalSantriValid++;
        sumPersenAnggota += rec.persenHadir;
        sumHadirSemua += rec.hadir;
        sumSakitSemua += rec.sakit;
        sumIzinSemua += rec.izin;
        sumAlpaSemua += rec.alpa;
        sumKesempatanHadir += rec.pertemuanCount;
      }
    }

    // A. Rata-rata persentase per anggota santri aktif
    const avgKehadiranAnggota =
      totalSantriValid > 0 ? Math.round((sumPersenAnggota / totalSantriValid) * 10) / 10 : 0;

    // B. Rasio total kehadiran terhadap seluruh kesempatan hadir
    const rasioKehadiranTotal =
      sumKesempatanHadir > 0
        ? Math.round((sumHadirSemua / sumKesempatanHadir) * 1000) / 10
        : 0;

    return {
      monthId: mInfo.id,
      monthName: mInfo.name,
      year: mInfo.year,
      pertemuanCount: mInfo.pertemuanCount,
      totalSantriValid,
      totalKesempatanHadir: sumKesempatanHadir,
      totalHadirSemua: sumHadirSemua,
      totalSakitSemua: sumSakitSemua,
      totalIzinSemua: sumIzinSemua,
      totalAlpaSemua: sumAlpaSemua,
      avgKehadiranAnggota,
      rasioKehadiranTotal,
    };
  });

  // 4. Ringkasan Global
  let globalKesempatanHadir = 0;
  let globalHadir = 0;
  let globalSakit = 0;
  let globalIzin = 0;
  let globalAlpa = 0;

  for (const agg of monthlyAggregates) {
    globalKesempatanHadir += agg.totalKesempatanHadir;
    globalHadir += agg.totalHadirSemua;
    globalSakit += agg.totalSakitSemua;
    globalIzin += agg.totalIzinSemua;
    globalAlpa += agg.totalAlpaSemua;
  }

  const globalPersenKeseluruhan =
    globalKesempatanHadir > 0
      ? Math.round((globalHadir / globalKesempatanHadir) * 1000) / 10
      : 0;

  const totalPertemuanValidSemuaBulan = availableMonths.reduce(
    (sum, m) => sum + (m.pertemuanCount || 0),
    0
  );

  const periodeAwal = availableMonths[0]?.name || 'Periode Awal';
  const periodeAkhir = availableMonths[availableMonths.length - 1]?.name || 'Periode Akhir';

  return {
    programId: config.id,
    programName: config.name,
    tingkat: config.tingkat,
    availableMonths,
    members,
    classes: Array.from(classesSet).sort(),
    domisiliList: Array.from(domisiliSet).sort(),
    monthlyAggregates,
    summary: {
      totalSantri: members.length,
      totalBulanTercatat: availableMonths.length,
      totalPertemuanValid: totalPertemuanValidSemuaBulan,
      totalCatatanKehadiran: globalKesempatanHadir,
      totalHadirSemua: globalHadir,
      totalSakitSemua: globalSakit,
      totalIzinSemua: globalIzin,
      totalAlpaSemua: globalAlpa,
      persenKehadiranKeseluruhan: `${globalPersenKeseluruhan}%`,
      periodeAwal,
      periodeAkhir,
    },
    sourceUrl: config.csvUrl,
    jurnalDocUrl: config.jurnalDocUrl,
  };
}
