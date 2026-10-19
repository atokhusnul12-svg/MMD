/**
 * KONFIGURASI SUMBER DATA WAKA I
 * ==============================
 * Mengelola konfigurasi data Kesiswaan, Ketertiban & Kedisiplinan Santri
 * Madrasah Islamiyah Darussalamah (MI, MTs, MA).
 */

export const WAKA1_CONFIG = {
  title: 'WAKA I — Bidang Kesiswaan & Kedisiplinan',
  subtitle: 'Pusat Pendataan Siswa, Monitoring Ketertiban, dan Rekapitulasi Takziran Bulanan',
  csvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSOHHhcx4Sw1547wclkJDAUrXnIOPYLj-nA8x_A1pP-x4ZQs0iKEYDKGqbacrxnZN2AuRQfGhzgopWs/pub?output=csv',
  tingkatList: ['MI', 'MTs', 'MA'],
  bulanList: [
    { id: 'dzulqodah', name: "Dzulqo'dah", colIdx: 7 },
    { id: 'dzulhijjah', name: 'Dzulhijjah', colIdx: 8 },
    { id: 'muharram', name: 'Muharram', colIdx: 9 },
    { id: 'shofar', name: 'Shofar', colIdx: 10 },
    { id: 'rawai', name: 'Rabiul Awal', colIdx: 11 },
    { id: 'rtsani', name: 'Rabiul Tsani', colIdx: 12 },
  ],
};
