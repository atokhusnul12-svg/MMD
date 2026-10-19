import { DATA_LINKS } from './dataLinks';
import {
  getAnggotaData,
  getKeuanganData,
  getBahsuData,
  getKalenderData,
} from './fetchCSV';

/**
 * PUSAT PENGAMBILAN DATA SERVER (SERVER COMPONENT & ISR)
 * ======================================================
 * Mengambil data Google Sheets di sisi server dengan strategi ISR (revalidate 60 detik).
 * Menghasilkan fallback yang aman jika Google Sheets tidak dapat dijangkau
 * sehingga aplikasi bebas dari 500 Server Error.
 */

const DEFAULT_REVALIDATE = 60; // 60 detik ISR

/**
 * Pengambilan data Bahtsul Masail & Anggota LBM di server
 */
export async function getBahsuServerData(options = {}) {
  const revalidate = options.revalidate ?? DEFAULT_REVALIDATE;
  try {
    const [bahsuRes, anggotaRes] = await Promise.allSettled([
      getBahsuData(DATA_LINKS.bahsu.csvUrl, { revalidate }),
      getAnggotaData(DATA_LINKS.anggota.csvUrl, { revalidate }),
    ]);

    const data =
      bahsuRes.status === 'fulfilled'
        ? bahsuRes.value
        : {
            title: 'JADWAL & DELEGASI BAHTSUL MASAIL (LBM) 2026',
            events: [],
            totalAgenda: 0,
            totalBelumBerangkat: 0,
            totalSudahBerangkat: 0,
            totalIzin: 0,
          };

    const anggotaList =
      anggotaRes.status === 'fulfilled' && anggotaRes.value?.anggota
        ? anggotaRes.value.anggota
        : [];

    const error =
      bahsuRes.status === 'rejected'
        ? bahsuRes.reason?.message || 'Gagal memuat jadwal & delegasi Bahtsul Masail dari Google Sheets.'
        : null;

    if (error) {
      console.warn('[sheets] Bahsu server fetch warning:', error);
    }

    return {
      data,
      anggotaList,
      error,
    };
  } catch (err) {
    console.error('[sheets] Error getBahsuServerData:', err);
    return {
      data: {
        title: 'JADWAL & DELEGASI BAHTSUL MASAIL (LBM) 2026',
        events: [],
        totalAgenda: 0,
        totalBelumBerangkat: 0,
        totalSudahBerangkat: 0,
        totalIzin: 0,
      },
      anggotaList: [],
      error: err?.message || 'Gagal terhubung ke Google Sheets.',
    };
  }
}

/**
 * Pengambilan data Anggota LBM di server
 */
export async function getAnggotaServerData(options = {}) {
  const revalidate = options.revalidate ?? DEFAULT_REVALIDATE;
  try {
    const data = await getAnggotaData(DATA_LINKS.anggota.csvUrl, { revalidate });
    return {
      data,
      error: null,
    };
  } catch (err) {
    console.error('[sheets] Error getAnggotaServerData:', err);
    return {
      data: {
        anggota: [],
        total: 0,
        statusCounts: {},
      },
      error: err?.message || 'Gagal memuat data anggota dari Google Sheets.',
    };
  }
}

/**
 * Pengambilan data Kalender Kerja di server
 */
export async function getKalenderServerData(options = {}) {
  const revalidate = options.revalidate ?? DEFAULT_REVALIDATE;
  try {
    const data = await getKalenderData(DATA_LINKS.kalender.csvUrl, { revalidate });
    return {
      data,
      error: null,
    };
  } catch (err) {
    console.error('[sheets] Error getKalenderServerData:', err);
    return {
      data: {
        bulanList: [],
        allActivities: [],
        totalKegiatan: 0,
        totalWaka3: 0,
        kordinatorList: [],
      },
      error: err?.message || 'Gagal memuat Kalender Kerja dari Google Sheets.',
    };
  }
}

/**
 * Pengambilan data Keuangan di server
 */
export async function getKeuanganServerData(options = {}) {
  const revalidate = options.revalidate ?? DEFAULT_REVALIDATE;
  try {
    const data = await getKeuanganData(DATA_LINKS.keuangan.csvUrl, { revalidate });
    return {
      data,
      error: null,
    };
  } catch (err) {
    console.error('[sheets] Error getKeuanganServerData:', err);
    return {
      data: {
        rekapitulasi: [],
        totalData: null,
        title: 'Ringkasan RAB & LPJ MMD',
      },
      error: err?.message || 'Gagal memuat rekapitulasi keuangan dari Google Sheets.',
    };
  }
}
