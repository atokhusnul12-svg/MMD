/**
 * ==============================================================================
 * KUNCI VAPID UNTUK WEB PUSH NOTIFICATION MANDIRI (RFC 8292)
 * ==============================================================================
 * Kunci privat disimpan secara eksklusif di environment variable server (VAPID_PRIVATE_KEY)
 * dan TIDAK PERNAH di-hardcode ke dalam berkas sumber.
 */

export const VAPID_KEYS = {
  // Public Key dikirim ke browser saat meminta izin push
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',

  // Private Key disimpan aman di server untuk menandatangani payload notifikasi
  privateKey: process.env.VAPID_PRIVATE_KEY || '',

  // Identitas kontak pengirim push
  subject: process.env.VAPID_SUBJECT || 'mailto:waka3mmd@darussalamah.sch.id',
};

/**
 * Konversi string Base64 VAPID Public Key ke format Uint8Array untuk PushManager
 */
export function urlBase64ToUint8Array(base64String) {
  if (!base64String || typeof base64String !== 'string') return new Uint8Array(0);

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
