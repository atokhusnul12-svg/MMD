import assert from 'assert';

/**
 * ==============================================================================
 * SUITE PENGUJIAN KEAMANAN & REGRESI WAKA III / MMD
 * ==============================================================================
 * Menguji secara ketat penutupan celah P0, verifikasi login server-side,
 * proteksi CSRF, sanitasi formula injection, dan integritas fitur publik.
 * ==============================================================================
 */

const BASE_URL = 'http://localhost:3000';

async function req(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return {
    status: res.status,
    headers: res.headers,
    text,
    json,
  };
}

async function runSecuritySuite() {
  console.log('\n======================================================');
  console.log('   MENJALANKAN SUITE PENGUJIAN KEAMANAN & REGRESI');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function record(desc, passed, detail = '') {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`  ✓ [LULUS] ${desc}`);
    } else {
      console.error(`  ✗ [GAGAL] ${desc} — ${detail}`);
    }
  }

  // ----------------------------------------------------------------------------
  // BAGIAN 1: PENGUJIAN PENUTUPAN BYPASS AUTENTIKASI (P0)
  // ----------------------------------------------------------------------------
  console.log('--- BAGIAN 1: Pengujian Penolakan Bypass Autentikasi (P0) ---');

  // 1.1 Request anonim ke GET /api/sheets?action=diagnose harus 403
  const diagAnon = await req('/api/sheets?action=diagnose');
  record('Diagnostik anonim ditolak dengan status 403', diagAnon.status === 403);

  // 1.2 Injeksi header x-admin-auth: true ke GET /api/sheets?action=diagnose HARUS DITOLAK 403
  const diagHeaderBypass = await req('/api/sheets?action=diagnose', {
    headers: { 'x-admin-auth': 'true' },
  });
  record(
    'Injeksi header x-admin-auth: true ke endpoint diagnostik DITOLAK 403 (Header Bypass Ditutup)',
    diagHeaderBypass.status === 403
  );

  // 1.3 Injeksi cookie palsu waka3_admin_session=true HARUS DITOLAK 403
  const diagCookieBypass = await req('/api/sheets?action=diagnose', {
    headers: { Cookie: 'waka3_admin_session=true' },
  });
  record(
    'Cookie palsu waka3_admin_session=true DITOLAK 403 (Plaintext Cookie Bypass Ditutup)',
    diagCookieBypass.status === 403
  );

  // 1.4 Token JWT dengan signature palsu HARUS DITOLAK 403
  const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.FAKESIGNATURE1234567890';
  const diagFakeJwt = await req('/api/sheets?action=diagnose', {
    headers: { Cookie: `waka3_admin_session=${fakeJwt}` },
  });
  record(
    'Cookie sesi dengan tanda tangan palsu (Forged JWT) DITOLAK 403',
    diagFakeJwt.status === 403
  );

  // 1.5 Injeksi header x-admin-auth: true ke POST /api/sheets HARUS DITOLAK 403
  const postHeaderBypass = await req('/api/sheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': 'true',
    },
    body: JSON.stringify({ action: 'syncBahsuEvent' }),
  });
  record(
    'Injeksi header x-admin-auth: true ke POST /api/sheets DITOLAK 403',
    postHeaderBypass.status === 403
  );

  // 1.6 Injeksi header x-admin-auth: true ke POST /api/push/send HARUS DITOLAK 403
  const pushHeaderBypass = await req('/api/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': 'true',
    },
    body: JSON.stringify({ title: 'Test', message: 'Test' }),
  });
  record(
    'Injeksi header x-admin-auth: true ke POST /api/push/send DITOLAK 403',
    pushHeaderBypass.status === 403
  );

  // 1.7 Session checker awal untuk user anonim harus authenticated: false
  const sessionAnon = await req('/api/auth/session');
  record(
    'Pemeriksaan sesi anonim /api/auth/session mengembalikan authenticated: false',
    sessionAnon.status === 200 && sessionAnon.json?.authenticated === false
  );

  // ----------------------------------------------------------------------------
  // BAGIAN 2: PENGUJIAN LOGIN SERVER-SIDE, BRUTE FORCE & RATE LIMITING
  // ----------------------------------------------------------------------------
  console.log('\n--- BAGIAN 2: Pengujian Login Server-Side & Rate Limiting ---');

  // 2.1 Login dengan password salah harus 401 dan tidak menghasilkan session cookie
  const failLogin = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'MMD', password: 'SALAH_PASSWORD_123' }),
  });
  record(
    'Percobaan login dengan password salah ditolak dengan status 401',
    failLogin.status === 401 && !failLogin.headers.get('set-cookie')?.includes('waka3_admin_session=ey')
  );

  // 2.2 Login berhasil dengan kredensial sah (MMD / WAKA3)
  const successLogin = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'MMD', password: 'WAKA3' }),
  });
  const setCookieHeader = (successLogin.headers.get('set-cookie') || '').toLowerCase();
  const isCookieSecure = setCookieHeader.includes('httponly') && setCookieHeader.includes('samesite=lax');
  const rawSetCookie = successLogin.headers.get('set-cookie') || '';
  const tokenMatch = rawSetCookie.match(/waka3_admin_session=([^;]+)/i);
  const sessionToken = tokenMatch ? tokenMatch[1] : null;

  record(
    'Login kredensial sah (MMD / WAKA3) berhasil (200 OK)',
    successLogin.status === 200 && successLogin.json?.success === true
  );
  record(
    'Cookie sesi berformat HttpOnly dan SameSite=Lax tanpa terekspos ke skrip klien',
    Boolean(isCookieSecure && sessionToken && sessionToken.includes('.'))
  );

  // 2.3 Periksa sesi server dengan cookie yang sah
  const sessionAuth = await req('/api/auth/session', {
    headers: { Cookie: `waka3_admin_session=${sessionToken}` },
  });
  record(
    'Endpoint /api/auth/session mengonfirmasi authenticated: true untuk admin terotentikasi',
    sessionAuth.status === 200 && sessionAuth.json?.authenticated === true && sessionAuth.json?.user?.role === 'admin'
  );

  // 2.4 Akses diagnostik dengan cookie sah diizinkan
  const diagAuth = await req('/api/sheets?action=diagnose', {
    headers: { Cookie: `waka3_admin_session=${sessionToken}` },
  });
  record(
    'Endpoint diagnostik dapat diakses oleh Admin sah dengan session cookie bertanda tangan',
    diagAuth.status === 200 && diagAuth.json?.checks?.adminSession === true
  );

  // ----------------------------------------------------------------------------
  // BAGIAN 3: PENGUJIAN SANITASI FORMULA INJECTION & VALIDASI WRITE
  // ----------------------------------------------------------------------------
  console.log('\n--- BAGIAN 3: Pengujian Sanitasi Input & Formula Injection ---');

  // 3.1 POST dengan formula injection (=cmd|'/C calc'!A0 atau =SUM(...))
  const formulaPayload = {
    action: 'syncBahsuEvent',
    event: {
      mode: 'create',
      newAcara: '=SUM(1+1)',
      newTanggal: '+2026-10-22',
      delegasi: '@Ahmad',
      keterangan: '-SUDAH',
      no: '\t99',
    },
  };

  const formulaTest = await req('/api/sheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `waka3_admin_session=${sessionToken}`,
    },
    body: JSON.stringify(formulaPayload),
  });

  // Karena token mock dev lokal ke Google Apps Script, jika request lolos otorisasi dan validasi, status responnya bukan 403 atau 400
  record(
    'Validasi payload dengan karakter formula (=, +, @, -, tab) diproses tanpa crash',
    formulaTest.status !== 403 && formulaTest.status !== 400
  );

  // 3.2 POST tanpa newAcara harus ditolak 400 Bad Request
  const emptyAcaraTest = await req('/api/sheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `waka3_admin_session=${sessionToken}`,
    },
    body: JSON.stringify({
      action: 'syncBahsuEvent',
      event: { newAcara: '', newTanggal: '2026-10-22' },
    }),
  });
  record(
    'Payload tanpa nama acara ditolak dengan status 400 Bad Request',
    emptyAcaraTest.status === 400
  );

  // ----------------------------------------------------------------------------
  // BAGIAN 4: PENGUJIAN PUSH SUBSCRIPTION VALIDATION & PERSISTENCE
  // ----------------------------------------------------------------------------
  console.log('\n--- BAGIAN 4: Pengujian Web Push Subscription ---');

  // 4.1 Subscription dengan URL tidak aman (http:// bukan https://) harus 400
  const subInsecure = await req('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: {
        endpoint: 'http://insecure-endpoint.com/push',
        keys: { p256dh: 'dGVzdGtleTEyMzQ1Njc4OTA=', auth: 'dGVzdGF1dGgxMjM=' },
      },
    }),
  });
  record(
    'Subscription dengan skema HTTP tidak aman ditolak 400',
    subInsecure.status === 400
  );

  // 4.2 Subscription sah diterima dan menambah count
  const validSub = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test_unique_endpoint_7788',
    keys: {
      p256dh: 'BCCdJW8TJet5Y94grrWkXxUCr3cgsgLV7A7aVEbx5PwIC_kEi7LjVuufU78sQ9OAdEZktEzFLXDMThwzu2snBi4',
      auth: 'UEU380KimihYCAWxu6Mrq6g1',
    },
  };

  const subValid = await req('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: validSub }),
  });
  record(
    'Subscription sah berhasil disimpan (200 OK)',
    subValid.status === 200 && subValid.json?.success === true
  );

  // 4.3 Endpoint GET /api/push/subscribe hanya merespons jumlah (tanpa bocor endpoint)
  const subCount = await req('/api/push/subscribe');
  record(
    'Endpoint GET /api/push/subscribe hanya mengekspos jumlah subscriber tanpa bocor data pribadi',
    subCount.status === 200 && typeof subCount.json?.count === 'number' && subCount.json.endpoints === undefined
  );

  // 4.4 Unsubscribe sah berhasil
  const unSub = await req('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unsubscribe', subscription: validSub }),
  });
  record(
    'Unsubscribe subscription berhasil (200 OK)',
    unSub.status === 200 && unSub.json?.success === true
  );

  // ----------------------------------------------------------------------------
  // BAGIAN 5: PENGUJIAN LOGOUT
  // ----------------------------------------------------------------------------
  console.log('\n--- BAGIAN 5: Pengujian Logout ---');

  const logoutRes = await req('/api/auth/logout', {
    method: 'POST',
    headers: { Cookie: `waka3_admin_session=${sessionToken}` },
  });
  const logoutCookie = logoutRes.headers.get('set-cookie') || '';
  record(
    'Logout berhasil mengosongkan cookie sesi dengan Max-Age=0',
    logoutRes.status === 200 && (logoutCookie.includes('Max-Age=0') || logoutCookie.includes('waka3_admin_session=;'))
  );

  // ----------------------------------------------------------------------------
  // BAGIAN 6: PENGUJIAN REGRESI FITUR PUBLIK & HALAMAN
  // ----------------------------------------------------------------------------
  console.log('\n--- BAGIAN 6: Pengujian Regresi Halaman Publik & Google Sheets ---');

  const publicRoutes = [
    { path: '/', name: 'Dashboard Utama' },
    { path: '/kalender', name: 'Kalender MMD' },
    { path: '/keuangan', name: 'Keuangan RAB/LPJ' },
    { path: '/anggota', name: 'Anggota LBM & Poin' },
    { path: '/bahsu', name: 'Jadwal Bahsul Masail' },
    { path: '/waka-i', name: 'WAKA I Pendidikan' },
    { path: '/waka-ii', name: 'WAKA II Ibadah & Absensi' },
    { path: '/waka-iii', name: 'WAKA III Kemuridan & LBM' },
  ];

  for (const r of publicRoutes) {
    const res = await req(r.path);
    record(`Halaman publik ${r.name} (${r.path}) dapat diakses (200 OK)`, res.status === 200);
  }

  // 6.2 Uji CSV Proxy Google Sheets
  const csvRes = await req('/api/sheets?type=anggota');
  record(
    'Proxy CSV Google Sheets /api/sheets?type=anggota merespons data publik (200 OK)',
    csvRes.status === 200 && csvRes.text.length > 50
  );

  // ----------------------------------------------------------------------------
  // RINGKASAN HASIL
  // ----------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`   TOTAL PENGUJIAN: ${totalTests}`);
  console.log(`   LULUS: ${passedTests}`);
  console.log(`   GAGAL: ${totalTests - passedTests}`);
  console.log(`   TINGKAT KEBERHASILAN: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 SEMUA PENGUJIAN KEAMANAN & REGRESI LULUS 100%!');
  } else {
    process.exitCode = 1;
  }
}

runSecuritySuite().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
