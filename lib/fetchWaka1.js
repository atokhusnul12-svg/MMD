import Papa from 'papaparse';
import { fetchRawCSV } from '@/lib/fetchCSV';
import { WAKA1_CONFIG } from '@/lib/waka1Config';

function clean(val) {
  return val !== null && val !== undefined ? String(val).trim() : '';
}

export async function getWaka1Data(options = {}) {
  const csvUrl = WAKA1_CONFIG.csvUrl;
  const csvText = await fetchRawCSV(csvUrl, options);

  if (!csvText || !csvText.trim()) {
    throw new Error('Data CSV WAKA I kosong atau tidak dapat diakses dari Google Sheets.');
  }

  const parsed = Papa.parse(csvText, { skipEmptyLines: true });
  const allRows = parsed.data || [];

  if (allRows.length < 5) {
    throw new Error('Format data CSV WAKA I tidak memiliki baris data siswa yang mencukupi.');
  }

  // Header berada pada baris ke-4 (indeks 3)
  const headerRow = allRows[3].map((h) => clean(h).toLowerCase());
  const dataRows = allRows.slice(4);

  const students = [];
  const tingkatStats = {
    MI: { total: 0, bebas: 0, takzir: 0 },
    MTs: { total: 0, bebas: 0, takzir: 0 },
    MA: { total: 0, bebas: 0, takzir: 0 },
  };

  const monthlyCounts = {
    dzulqodah: 0,
    dzulhijjah: 0,
    muharram: 0,
    shofar: 0,
    rawai: 0,
    rtsani: 0,
  };

  const domisiliSet = new Set();
  const kelasSet = new Set();

  dataRows.forEach((r, idx) => {
    const tingkat = clean(r[0]);
    const kelas = clean(r[1]);
    const noRaw = clean(r[2]);
    const nama = clean(r[3]);
    const domisili = clean(r[4]);
    const dataTakziran = clean(r[5]);
    const jmlTakziranRaw = clean(r[6]);

    // Abaikan baris kosong atau baris judul/rekap yang tidak valid
    if (!nama || nama.toUpperCase().startsWith('DATA') || nama.toUpperCase().startsWith('TOTAL')) {
      return;
    }

    const jmlTakziran = parseInt(jmlTakziranRaw, 10) || 0;
    const isDzulqodah = clean(r[7]).toUpperCase() === 'YA';
    const isDzulhijjah = clean(r[8]).toUpperCase() === 'YA';
    const isMuharram = clean(r[9]).toUpperCase() === 'YA';
    const isShofar = clean(r[10]).toUpperCase() === 'YA';
    const isRawai = clean(r[11]).toUpperCase() === 'YA';
    const isRtsani = clean(r[12]).toUpperCase() === 'YA';

    if (isDzulqodah) monthlyCounts.dzulqodah++;
    if (isDzulhijjah) monthlyCounts.dzulhijjah++;
    if (isMuharram) monthlyCounts.muharram++;
    if (isShofar) monthlyCounts.shofar++;
    if (isRawai) monthlyCounts.rawai++;
    if (isRtsani) monthlyCounts.rtsani++;

    if (domisili) domisiliSet.add(domisili);
    if (kelas) kelasSet.add(kelas);

    // Statistik per tingkat
    const tKey = tingkat.toUpperCase().includes('MTS')
      ? 'MTs'
      : tingkat.toUpperCase().includes('MA')
      ? 'MA'
      : 'MI';

    if (tingkatStats[tKey]) {
      tingkatStats[tKey].total++;
      if (jmlTakziran === 0) tingkatStats[tKey].bebas++;
      else tingkatStats[tKey].takzir++;
    }

    students.push({
      id: `w1-${idx + 1}`,
      no: parseInt(noRaw, 10) || idx + 1,
      tingkat: tKey,
      kelas: kelas || '-',
      nama,
      domisili: domisili || '-',
      dataTakziran: dataTakziran || '—',
      jmlBulanTakziran: jmlTakziran,
      isBebasTakziran: jmlTakziran === 0,
      isPerhatianKhusus: jmlTakziran >= 3,
      takziranBulanan: {
        dzulqodah: isDzulqodah,
        dzulhijjah: isDzulhijjah,
        muharram: isMuharram,
        shofar: isShofar,
        rawai: isRawai,
        rtsani: isRtsani,
      },
    });
  });

  const totalSiswa = students.length;
  const totalBebasTakziran = students.filter((s) => s.isBebasTakziran).length;
  const totalKenaTakziran = totalSiswa - totalBebasTakziran;
  const totalPerhatianKhusus = students.filter((s) => s.isPerhatianKhusus).length;
  const persenDisiplin = totalSiswa > 0 ? Math.round((totalBebasTakziran / totalSiswa) * 1000) / 10 : 0;

  return {
    title: WAKA1_CONFIG.title,
    subtitle: WAKA1_CONFIG.subtitle,
    sourceUrl: WAKA1_CONFIG.csvUrl,
    bulanList: WAKA1_CONFIG.bulanList,
    students,
    classes: Array.from(kelasSet).sort(),
    domisiliList: Array.from(domisiliSet).sort(),
    summary: {
      totalSiswa,
      totalBebasTakziran,
      totalKenaTakziran,
      totalPerhatianKhusus,
      persenDisiplin: `${persenDisiplin}%`,
    },
    tingkatStats,
    monthlyCounts,
  };
}
