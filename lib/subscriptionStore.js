import fs from 'fs';
import path from 'path';

/**
 * ==============================================================================
 * PENYIMPANAN DATA SUBSCRIPTION PUSH NOTIFIKASI
 * ==============================================================================
 * Menyimpan daftar browser/perangkat yang telah mengaktifkan notifikasi.
 * Menggunakan memori global + file storage di sistem.
 */

// Gunakan folder /tmp di Vercel Serverless atau folder root lokal
const STORAGE_FILE = process.env.VERCEL
  ? path.join('/tmp', 'waka3_subscriptions.json')
  : path.join(process.cwd(), '.subscriptions.json');

// Global memory cache untuk performa tinggi
if (!global.__WAKA3_SUBSCRIPTIONS__) {
  global.__WAKA3_SUBSCRIPTIONS__ = new Map();

  // Coba baca dari file jika ada
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((sub) => {
          if (sub && sub.endpoint) {
            global.__WAKA3_SUBSCRIPTIONS__.set(sub.endpoint, sub);
          }
        });
      }
    }
  } catch (err) {
    console.warn('[PushStore] Gagal membaca storage awal:', err?.message);
  }
}

function persistToFile() {
  try {
    const list = Array.from(global.__WAKA3_SUBSCRIPTIONS__.values());
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal error jika environment readonly
    console.warn('[PushStore] Gagal menyimpan ke file:', err?.message);
  }
}

export function saveSubscription(sub) {
  if (!sub || !sub.endpoint) return false;
  global.__WAKA3_SUBSCRIPTIONS__.set(sub.endpoint, {
    ...sub,
    updatedAt: new Date().toISOString(),
  });
  persistToFile();
  return true;
}

export function deleteSubscription(endpoint) {
  if (!endpoint) return false;
  const deleted = global.__WAKA3_SUBSCRIPTIONS__.delete(endpoint);
  if (deleted) persistToFile();
  return deleted;
}

export function getSubscriptions() {
  return Array.from(global.__WAKA3_SUBSCRIPTIONS__.values());
}

export function countSubscriptions() {
  return global.__WAKA3_SUBSCRIPTIONS__.size;
}
