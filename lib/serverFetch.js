import { DATA_LINKS } from './dataLinks';
import {
  getAnggotaData,
  getKeuanganData,
  getBahsuData,
  getKalenderData,
} from './fetchCSV';

/**
 * Mengambil seluruh data awal dari Google Sheets di sisi server (Server Component).
 * Menggunakan Next.js Data Cache dengan ISR (revalidate 180 detik / 3 menit).
 * Data dikirim ke Client Component agar halaman langsung tampil dengan angka nyata,
 * tabel, dan diagram tanpa flicker "Memuat...", skeleton kosong, atau Rp 0 palsu.
 */
export async function getInitialServerData() {
  const initial = {
    anggotaData: null,
    keuanganData: null,
    bahsuData: null,
    kalenderData: null,
    anggotaTotal: null,
    bahsuTotal: null,
  };

  try {
    const [resAnggota, resKeuangan, resBahsu, resKalender] = await Promise.allSettled([
      getAnggotaData(DATA_LINKS.anggota.csvUrl, { revalidate: 60 }),
      getKeuanganData(DATA_LINKS.keuangan.csvUrl, { revalidate: 60 }),
      getBahsuData(DATA_LINKS.bahsu.csvUrl, { revalidate: 60 }),
      getKalenderData(DATA_LINKS.kalender.csvUrl, { revalidate: 60 }),
    ]);

    if (resAnggota.status === 'fulfilled') {
      initial.anggotaData = resAnggota.value;
      initial.anggotaTotal = resAnggota.value?.total || null;
    } else {
      console.warn('[serverFetch] Anggota failed:', resAnggota.reason?.message);
    }

    if (resKeuangan.status === 'fulfilled') {
      initial.keuanganData = resKeuangan.value;
    } else {
      console.warn('[serverFetch] Keuangan failed:', resKeuangan.reason?.message);
    }

    if (resBahsu.status === 'fulfilled') {
      initial.bahsuData = resBahsu.value;
      initial.bahsuTotal = resBahsu.value?.totalAgenda || null;
    } else {
      console.warn('[serverFetch] Bahsu failed:', resBahsu.reason?.message);
    }

    if (resKalender.status === 'fulfilled') {
      initial.kalenderData = resKalender.value;
    } else {
      console.warn('[serverFetch] Kalender failed:', resKalender.reason?.message);
    }
  } catch (err) {
    console.error('[serverFetch] Gagal memuat data awal server:', err);
  }

  return initial;
}
