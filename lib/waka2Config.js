/**
 * KONFIGURASI SUMBER DATA WAKA II MMD TERBARU
 * ===========================================
 * Mengelola konfigurasi data untuk 3 program kegiatan:
 * 1. Tafaqquh Aliyah
 * 2. Tafaqquh Tsanawiyah
 * 3. Tarbiyatul Mubahitsin
 *
 * Masing-masing program memiliki URL CSV absensi dan URL Google Docs jurnal terpisah.
 */

const DEFAULT_NEW_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQt8wNHfopVgwuUolH-1vXLnlUdIJqyhed0HtSkHziGFAEi9ta3x92pwPsZ2B9PlsyNlAK5fz_RXb8e/pub?output=csv';

const DEFAULT_JURNAL_DOC_URL =
  'https://docs.google.com/document/d/e/2PACx-1vTZlL7Qv41JtwyWAN6lbqWbhF7Qagxt0ElQacDOUb3Y8g7oY4vOx-6HGsvyoXYZqFd32ELE2l8eqGvT/pub';

export const WAKA2_PROGRAMS = {
  aliyah: {
    id: 'aliyah',
    slug: 'aliyah',
    name: 'Tafaqquh Aliyah',
    shortName: 'Aliyah',
    tingkat: 'Tingkat Madrasah Aliyah (MA)',
    description:
      'Program pendalaman kitab kuning, kajian fiqih lanjutan, dan pelatihan musyawirin tingkat santri Aliyah.',
    tingkatKeywords: ['MA'],
    programKeywords: ['TAFAQQUH'],
    // Sumber Data CSV Google Sheets Terbaru
    csvUrl: DEFAULT_NEW_CSV_URL,
    // Sumber Dokumen Jurnal Pembahasan Google Docs (Published to web)
    jurnalDocUrl: DEFAULT_JURNAL_DOC_URL,
    badgeColor: {
      bg: 'bg-[#EBF3EF]',
      text: 'text-[#1D7A6F]',
      border: 'border-[#C2DDD6]',
    },
    iconName: 'GraduationCap',
  },

  tsanawiyah: {
    id: 'tsanawiyah',
    slug: 'tsanawiyah',
    name: 'Tafaqquh Tsanawiyah',
    shortName: 'Tsanawiyah',
    tingkat: 'Tingkat Madrasah Tsanawiyah (MTs)',
    description:
      'Program penguatan kaidah fiqhiyyah dasar-menengah dan literatur turats bagi santri Tsanawiyah.',
    tingkatKeywords: ['MTS'],
    programKeywords: ['TAFAQQUH'],
    // Sumber Data CSV Google Sheets Terbaru
    csvUrl: DEFAULT_NEW_CSV_URL,
    // Sumber Dokumen Jurnal Pembahasan Google Docs (Published to web)
    jurnalDocUrl: DEFAULT_JURNAL_DOC_URL,
    badgeColor: {
      bg: 'bg-[#FAF3E6]',
      text: 'text-[#8C6D23]',
      border: 'border-[#ECD8A5]',
    },
    iconName: 'BookMarked',
  },

  mubahitsin: {
    id: 'mubahitsin',
    slug: 'mubahitsin',
    name: 'Tarbiyatul Mubahitsin',
    shortName: 'Mubahitsin',
    tingkat: 'Tingkat MI / MIS & Kaderisasi',
    description:
      'Program pembinaan kader musyawirin pemula dan pengenalan metodologi istinbath hukum Islam sejak dini.',
    tingkatKeywords: ['MI', 'MIS', 'MI-MIS'],
    programKeywords: ['MUBAHITSIN'],
    // Sumber Data CSV Google Sheets Terbaru
    csvUrl: DEFAULT_NEW_CSV_URL,
    // Sumber Dokumen Jurnal Pembahasan Google Docs (Published to web)
    jurnalDocUrl: DEFAULT_JURNAL_DOC_URL,
    badgeColor: {
      bg: 'bg-[#EFF5F9]',
      text: 'text-[#2D6A9F]',
      border: 'border-[#BFD5E7]',
    },
    iconName: 'Award',
  },
};

export function getProgramConfig(slug) {
  if (!slug) return null;
  const key = String(slug).toLowerCase().trim();
  return WAKA2_PROGRAMS[key] || null;
}

export function getAllProgramSlugs() {
  return Object.keys(WAKA2_PROGRAMS);
}
