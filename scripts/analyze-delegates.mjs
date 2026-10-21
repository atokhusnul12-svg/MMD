import { DATA_LINKS } from '../lib/dataLinks.js';
import { getBahsuData, getAnggotaData } from '../lib/fetchCSV.js';

async function checkAllDelegates() {
  const bahsu = await getBahsuData(DATA_LINKS.bahsu.csvUrl);
  const anggota = await getAnggotaData(DATA_LINKS.anggota.csvUrl);

  console.log('=== SELURUH AGENDA & DELEGASI DI DAFTAR PEMBERANGKATAN ===');
  bahsu.events.forEach((ev, i) => {
    console.log(`\nEvent #${ev.no || i + 1} | "${ev.acara}" | ${ev.tanggal} | Ket: ${ev.keterangan}`);
    const delegasi = Array.isArray(ev.delegasi) ? ev.delegasi : [ev.delegasi];
    delegasi.forEach((d, di) => {
      console.log(`   ${di + 1}. "${d}"`);
    });
  });

  console.log('\n=== REKAP TOTAL KEHADIRAN PER SANTRI DI KOLOM J SAAT INI ===');
  anggota.anggota.forEach(a => {
    console.log(`${a.id} | ${a.nama} (${a.kelas}) : ${a.bahtsuList.length} BM`);
  });
}
checkAllDelegates();
