/**
 * PUSAT FORMATTER & UTILITAS UMUM MMD
 * ====================================
 * Menyediakan fungsi pemformatan mata uang, tanggal Indonesia, dan pembersihan teks
 * untuk digunakan lintas komponen secara konsisten.
 */

export const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * Membersihkan format uang (misal: "Rp 20,166,500", "21.752.000", atau "21752000") menjadi angka murni
 */
export function parseCurrencyToNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  let str = String(val).trim();
  if (!str) return 0;

  // Hapus simbol selain angka, titik, koma, minus
  str = str.replace(/[^0-9.,-]+/g, '');
  if (!str || str === '-') return 0;

  // Jika terdapat titik dan koma, tentukan mana pemisah ribuan dan desimal
  if (str.includes('.') && str.includes(',')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // Format Indonesia: 1.250.000,50 -> buang titik, ganti koma ke titik
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Format US: 1,250,000.50 -> buang koma
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    // Hanya ada titik. Jika ada lebih dari 1 titik (1.250.000) atau diakhiri 3 digit ribuan (25.000)
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1 || /\.\d{3}$/.test(str)) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
    // Hanya ada koma. Jika ada lebih dari 1 koma (1,250,000) atau diakhiri 3 digit ribuan (25,000)
    const commaCount = (str.match(/,/g) || []).length;
    if (commaCount > 1 || /,\d{3}$/.test(str)) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format angka ke format Rupiah standar Indonesia
 * Contoh: 2500000 -> "Rp 2.500.000"
 */
export function formatRupiah(number) {
  if (number === null || number === undefined || isNaN(number)) return 'Rp 0';
  return 'Rp ' + Math.round(number).toLocaleString('id-ID');
}

/**
 * Format tanggal YYYY-MM-DD ke format resmi Indonesia Masehi
 * Contoh: "2026-05-18" -> "18 Mei 2026 M."
 */
export function formatIndonesianDate(isoDateStr) {
  if (!isoDateStr) return '';
  const parts = String(isoDateStr).trim().split('-');
  if (parts.length !== 3) return isoDateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${day} ${BULAN_INDONESIA[monthIdx]} ${year} M.`;
  }
  return isoDateStr;
}
