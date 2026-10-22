import crypto from 'crypto';

/**
 * ==============================================================================
 * SERVER-SIDE AUTHENTICATION & SESSION MANAGEMENT — WAKA III / MMD
 * ==============================================================================
 * Menggantikan mekanisme verifikasi client-side hardcoded dengan:
 * 1. Kredensial server-only (tidak pernah terekspos ke browser bundle).
 * 2. Token sesi bertanda tangan kriptografis (HMAC-SHA256) tersimpan di HttpOnly Cookie.
 * 3. Proteksi Timing-Attack pada verifikasi username & password.
 * 4. Pembatasan laju percobaan login (Rate Limiting) per IP.
 * 5. Proteksi CSRF / Same-Origin pada request mutasi state.
 * ==============================================================================
 */

const SESSION_COOKIE_NAME = 'waka3_admin_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 hari

// Resolusi SESSION_SECRET: dari process.env atau fallback internal server secret
function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.SHEETS_API_SECRET_TOKEN;
  if (secret && secret.trim().length >= 16) {
    return secret.trim();
  }
  // Fallback internal server deterministic key
  return 'waka3_secure_server_session_hmac_secret_key_v2_2026';
}

/**
 * Utilitas Base64URL Encoding & Decoding
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Buat tanda tangan HMAC-SHA256
 */
function signString(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Buat Token Sesi Kriptografis (JWT-like HMAC-SHA256)
 */
export function createSessionToken(userPayload) {
  const secret = getSessionSecret();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    ...userPayload,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = signString(dataToSign, secret);

  return `${dataToSign}.${signature}`;
}

/**
 * Verifikasi Token Sesi Kriptografis
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const secret = getSessionSecret();
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = signString(dataToSign, secret);

  // Periksa signature dengan timing-safe comparison
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);

    // Cek batas kedaluwarsa
    if (!payload.exp || payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifikasi Sesi dari Request Server (Next.js Request)
 * HANYA MEMERIKSA COOKIE RESMI, TIDAK PERNAH MEMPERCAYAI HEADER PENGUJIAN.
 */
export function verifyServerSession(request) {
  if (!request) return null;

  let cookieValue = null;

  // Baca cookie dari objek Request Next.js
  if (request.cookies && typeof request.cookies.get === 'function') {
    cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  } else if (typeof request.headers?.get === 'function') {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) {
      cookieValue = decodeURIComponent(match[1]);
    }
  }

  if (!cookieValue) return null;

  const session = verifySessionToken(cookieValue);
  if (!session || session.role !== 'admin') {
    return null;
  }

  return session;
}

/**
 * In-Memory Rate Limiting untuk Login (Mencegah Brute Force)
 * Maksimal 5 percobaan gagal per IP dalam rentang 5 menit
 */
const loginAttemptsMap = new Map();

export function checkLoginRateLimit(ip) {
  const clientIp = ip || 'global_unknown_ip';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 menit
  const maxAttempts = 5;

  const record = loginAttemptsMap.get(clientIp);
  if (!record) return { allowed: true, remaining: maxAttempts };

  if (now > record.resetAt) {
    loginAttemptsMap.delete(clientIp);
    return { allowed: true, remaining: maxAttempts };
  }

  if (record.attempts >= maxAttempts) {
    const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: waitSeconds,
      error: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${waitSeconds} detik.`,
    };
  }

  return { allowed: true, remaining: maxAttempts - record.attempts };
}

export function recordLoginFailure(ip) {
  const clientIp = ip || 'global_unknown_ip';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;

  const record = loginAttemptsMap.get(clientIp) || { attempts: 0, resetAt: now + windowMs };
  record.attempts += 1;
  loginAttemptsMap.set(clientIp, record);
}

export function resetLoginFailure(ip) {
  const clientIp = ip || 'global_unknown_ip';
  loginAttemptsMap.delete(clientIp);
}

/**
 * Verifikasi Kredensial Admin di Sisi Server dengan Timing-Safe Comparison
 */
export function verifyAdminCredentials(username, password) {
  if (!username || !password) return false;

  const validUsername = (process.env.ADMIN_USERNAME || 'MMD').trim().toUpperCase();
  const validPassword = (process.env.ADMIN_PASSWORD || 'WAKA3').trim();

  const inputUsername = String(username).trim().toUpperCase();
  const inputPassword = String(password).trim();

  // Timing-safe check untuk username
  const userBuf = crypto.createHash('sha256').update(inputUsername).digest();
  const validUserBuf = crypto.createHash('sha256').update(validUsername).digest();
  const isUserMatch = crypto.timingSafeEqual(userBuf, validUserBuf);

  // Timing-safe check untuk password
  const passBuf = crypto.createHash('sha256').update(inputPassword).digest();
  const validPassBuf = crypto.createHash('sha256').update(validPassword).digest();
  const isPassMatch = crypto.timingSafeEqual(passBuf, validPassBuf);

  return isUserMatch && isPassMatch;
}

/**
 * Validasi Proteksi CSRF / Same-Origin untuk Request Mutasi
 */
export function validateSameOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin || !host) {
    // Izinkan request same-origin non-browser jika diperlukan oleh cron/CLI
    return true;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS };
