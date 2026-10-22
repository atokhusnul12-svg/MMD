import fs from 'fs';
import path from 'path';

/**
 * ==============================================================================
 * PENYIMPANAN DATA SUBSCRIPTION PUSH NOTIFIKASI PERSISTEN
 * ==============================================================================
 * Mengatasi masalah kehilangan subscriber saat cold start pada Vercel Serverless:
 * 1. Global in-memory cache untuk performa tinggi & akses cepat.
 * 2. File fallback lokal (.subscriptions.json / /tmp).
 * 3. Sinkronisasi persisten dua arah ke Google Sheets (tab PUSH_SUBSCRIPTIONS)
 *    melalui backend Google Apps Script yang aman ber-token.
 * ==============================================================================
 */

const STORAGE_FILE = process.env.VERCEL
  ? path.join('/tmp', 'waka3_subscriptions.json')
  : path.join(process.cwd(), '.subscriptions.json');

// Inisialisasi memory map global
if (!global.__WAKA3_SUBSCRIPTIONS__) {
  global.__WAKA3_SUBSCRIPTIONS__ = new Map();
  global.__WAKA3_SUBSCRIPTIONS_HYDRATED__ = false;

  // Baca dari file lokal/tmp jika tersedia
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((sub) => {
          if (isValidSubscription(sub)) {
            global.__WAKA3_SUBSCRIPTIONS__.set(sub.endpoint, sub);
          }
        });
      }
    }
  } catch (err) {
    console.warn('[PushStore] Gagal membaca storage lokal awal:', err?.message);
  }
}

/**
 * Validasi Skema Objek Push Subscription
 */
export function isValidSubscription(sub) {
  if (!sub || typeof sub !== 'object') return false;
  if (typeof sub.endpoint !== 'string' || !sub.endpoint.startsWith('https://')) return false;
  if (sub.endpoint.length > 1000) return false;
  if (!sub.keys || typeof sub.keys !== 'object') return false;
  if (typeof sub.keys.p256dh !== 'string' || sub.keys.p256dh.length < 20) return false;
  if (typeof sub.keys.auth !== 'string' || sub.keys.auth.length < 10) return false;
  return true;
}

function persistToFile() {
  try {
    const list = Array.from(global.__WAKA3_SUBSCRIPTIONS__.values());
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[PushStore] Gagal menyimpan ke file lokal:', err?.message);
  }
}

/**
 * Sinkronisasi Asinkron ke Google Apps Script (Persistensi Permanen)
 */
async function syncRemote(action, data) {
  const scriptUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL || process.env.GOOGLE_APPS_SCRIPT_URL;
  const token = process.env.SHEETS_API_SECRET_TOKEN;

  if (!scriptUrl || !token || !scriptUrl.startsWith('https://script.google.com')) {
    return;
  }

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        token: token.trim(),
        ...data,
      }),
      signal: AbortSignal.timeout(6000),
    });
  } catch (err) {
    // Non-fatal logging agar user tidak terganggu
    console.warn(`[PushStore] Sync remote ${action} tertunda:`, err?.message);
  }
}

/**
 * Rehidrasi dari Google Sheets saat Cold Start
 */
export async function hydrateFromRemote() {
  if (global.__WAKA3_SUBSCRIPTIONS_HYDRATED__) return;

  const scriptUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL || process.env.GOOGLE_APPS_SCRIPT_URL;
  const token = process.env.SHEETS_API_SECRET_TOKEN;

  if (!scriptUrl || !token || !scriptUrl.startsWith('https://script.google.com')) {
    global.__WAKA3_SUBSCRIPTIONS_HYDRATED__ = true;
    return;
  }

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getPushSubscriptions',
        token: token.trim(),
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && Array.isArray(data?.subscriptions)) {
        data.subscriptions.forEach((sub) => {
          if (isValidSubscription(sub)) {
            global.__WAKA3_SUBSCRIPTIONS__.set(sub.endpoint, sub);
          }
        });
        persistToFile();
      }
    }
  } catch (err) {
    console.warn('[PushStore] Rehidrasi cold-start tertunda:', err?.message);
  } finally {
    global.__WAKA3_SUBSCRIPTIONS_HYDRATED__ = true;
  }
}

export function saveSubscription(sub) {
  if (!isValidSubscription(sub)) return false;

  const entry = {
    endpoint: sub.endpoint,
    expirationTime: sub.expirationTime || null,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    updatedAt: new Date().toISOString(),
  };

  global.__WAKA3_SUBSCRIPTIONS__.set(sub.endpoint, entry);
  persistToFile();

  // Kirim sinkronisasi ke remote database secara background
  syncRemote('savePushSubscription', { subscription: entry });

  return true;
}

export function deleteSubscription(endpoint) {
  if (!endpoint || typeof endpoint !== 'string') return false;

  const deleted = global.__WAKA3_SUBSCRIPTIONS__.delete(endpoint);
  if (deleted) {
    persistToFile();
    syncRemote('deletePushSubscription', { endpoint });
  }
  return deleted;
}

export async function getSubscriptions() {
  if (!global.__WAKA3_SUBSCRIPTIONS_HYDRATED__) {
    await hydrateFromRemote();
  }
  return Array.from(global.__WAKA3_SUBSCRIPTIONS__.values());
}

export function countSubscriptions() {
  return global.__WAKA3_SUBSCRIPTIONS__.size;
}
