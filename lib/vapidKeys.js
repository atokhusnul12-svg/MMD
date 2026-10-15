/**
 * ==============================================================================
 * KUNCI VAPID UNTUK WEB PUSH NOTIFICATION MANDIRI (TANPA PIHAK KETIGA)
 * ==============================================================================
 * Menggunakan standar Web Push resmi W3C/IETF (RFC 8292).
 * Tidak memerlukan pendaftaran akun ke OneSignal atau layanan eksternal apapun!
 * 
 * Bekerja langsung di:
 * - Google Chrome (Desktop & Android)
 * - Microsoft Edge (Windows & Mac)
 * - Mozilla Firefox
 * - Apple Safari (Mac & iOS 16.4+ PWA)
 */

export const VAPID_KEYS = {
  // Public Key dikirim ke browser saat meminta izin push
  publicKey:
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BDMarVQznsZ0Qb8gM_H6pgxtbLc0UpjOdvNK4WDQfDln2OyvO5f015qP1EaR9_J-xb0MPQEPnryC14-_AjGPyBE',

  // Private Key disimpan aman di server untuk menandatangani payload notifikasi
  privateKey:
    process.env.VAPID_PRIVATE_KEY ||
    '9BR38IIbL-zKcfK_gnR_HMY8Emt3MQuqWXmTcUvbmkQ',

  // Identitas kontak pengirim push
  subject: 'mailto:waka3mmd@darussalamah.sch.id',
};

/**
 * Konversi string Base64 VAPID Public Key ke format Uint8Array untuk PushManager
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
