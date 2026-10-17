import { NextResponse } from 'next/server';
import { DATA_LINKS } from '@/lib/dataLinks';

// Whitelist kolom biodata yang diizinkan untuk diedit
const ALLOWED_BIODATA_FIELDS = [
  'nama',
  'kelas',
  'perkembangan',
  'ttl',
  'alamat',
  'domisili',
  'ayahIbu',
];

/**
 * GET Handler: Proxy CSV Google Sheets untuk menghindari kendala CORS & caching di browser
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Fitur Diagnostik & Pemeriksaan Koneksi Aman (Hanya untuk Admin)
    if (action === 'diagnose') {
      const cookieSession = request.cookies?.get('waka3_admin_session')?.value;
      const headerAuth = request.headers?.get('x-admin-auth');
      const isAdmin = cookieSession === 'true' || headerAuth === 'true';

      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Akses ditolak: Fitur diagnostik hanya dapat diakses oleh Administrator.' },
          { status: 403 }
        );
      }

      const scriptUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL || process.env.GOOGLE_APPS_SCRIPT_URL;
      const secretToken = process.env.SHEETS_API_SECRET_TOKEN;

      const checks = {
        adminSession: true,
        urlConfigured: Boolean(scriptUrl && scriptUrl.trim().length > 0),
        tokenConfigured: Boolean(secretToken && secretToken.trim().length > 0),
        scriptReachable: false,
        scriptTokenConfigured: false,
        statusMessage: '',
      };

      if (!checks.urlConfigured) {
        checks.statusMessage = 'GOOGLE_SHEETS_SCRIPT_URL belum diatur pada hosting Vercel atau .env.local.';
        return NextResponse.json({ success: false, checks });
      }

      if (!checks.tokenConfigured) {
        checks.statusMessage = 'SHEETS_API_SECRET_TOKEN belum diatur pada hosting Vercel atau .env.local.';
        return NextResponse.json({ success: false, checks });
      }

      try {
        const testRes = await fetch(scriptUrl, {
          cache: 'no-store',
          signal: AbortSignal.timeout(12000),
        });

        if (testRes.ok) {
          checks.scriptReachable = true;
          const json = await testRes.json().catch(() => null);
          if (json && json.status === 'online') {
            checks.scriptTokenConfigured = Boolean(json.configured);
            if (checks.scriptTokenConfigured) {
              checks.statusMessage = 'Koneksi sempurna! Google Apps Script siap menerima pembaruan data secara aman.';
              return NextResponse.json({ success: true, checks });
            } else {
              checks.statusMessage = 'Web App Google Sheets aktif, namun Properti Skrip (SHEETS_API_SECRET_TOKEN) belum disetel di Google Apps Script.';
              return NextResponse.json({ success: false, checks });
            }
          }
        }
        checks.statusMessage = `Google Apps Script merespons dengan HTTP ${testRes.status}. Pastikan deployment disetel ke 'Anyone'.`;
        return NextResponse.json({ success: false, checks });
      } catch (err) {
        checks.statusMessage = `Gagal menghubungi Google Apps Script: ${err.message}. Pastikan URL berakhiran /exec.`;
        return NextResponse.json({ success: false, checks });
      }
    }

    const targetUrl = searchParams.get('url');
    const type = searchParams.get('type');

    let fetchUrl = targetUrl;
    if (!fetchUrl && type && DATA_LINKS[type]) {
      fetchUrl = DATA_LINKS[type].csvUrl;
    }

    if (!fetchUrl) {
      return NextResponse.json({ error: 'Parameter url atau type diperlukan' }, { status: 400 });
    }

    // Hanya izinkan domain Google Docs untuk keamanan
    if (!fetchUrl.includes('docs.google.com') && !fetchUrl.includes('googleusercontent.com')) {
      return NextResponse.json({ error: 'URL harus dari docs.google.com' }, { status: 400 });
    }

    const separator = fetchUrl.includes('?') ? '&' : '?';
    const finalUrl = `${fetchUrl}${separator}_t=${Date.now()}`;

    const res = await fetch(finalUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/csv,text/plain,*/*',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Google Sheets error (Status ${res.status}): ${res.statusText}` },
        { status: res.status }
      );
    }

    const csvData = await res.text();

    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    if (err?.digest?.startsWith('NEXT_PRERENDER_')) {
      throw err;
    }
    console.error('API /api/sheets GET error:', err);
    return NextResponse.json(
      { error: `Gagal mengambil CSV: ${err.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST Handler: Tulis Balik Perubahan Biodata Anggota ke Google Sheets
 */
export async function POST(request) {
  try {
    // 1. Guard Hak Akses Administrator di Server
    const cookieSession = request.cookies?.get('waka3_admin_session')?.value;
    const headerAuth = request.headers?.get('x-admin-auth');
    const isAdmin = cookieSession === 'true' || headerAuth === 'true';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses ditolak: Hanya Administrator yang berwenang memperbarui biodata santri ke Google Sheets.',
        },
        { status: 403 }
      );
    }

    // 2. Baca dan validasi format payload
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Payload permintaan bukan JSON yang valid.' },
        { status: 400 }
      );
    }

    const { id, changes } = body || {};

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Parameter ID anggota unik wajib disertakan.' },
        { status: 400 }
      );
    }

    const trimmedId = id.trim().toUpperCase();

    // Validasi format ID anggota (alfanumerik standar, tanda hubung, atau garis bawah)
    if (!/^[A-Z0-9_\-]+$/.test(trimmedId)) {
      return NextResponse.json(
        { success: false, error: 'Format ID anggota tidak valid.' },
        { status: 400 }
      );
    }

    if (!changes || typeof changes !== 'object' || Array.isArray(changes) || Object.keys(changes).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Objek changes berisi perubahan biodata wajib disertakan.' },
        { status: 400 }
      );
    }

    // 3. Filter Kolom yang Diizinkan (Whitelist) & Sanitasi Nilai Input
    const sanitizedChanges = {};
    for (const key of Object.keys(changes)) {
      if (ALLOWED_BIODATA_FIELDS.includes(key)) {
        const val = changes[key];
        if (typeof val === 'string') {
          sanitizedChanges[key] = val.trim().slice(0, 500);
        } else if (val !== null && val !== undefined) {
          sanitizedChanges[key] = String(val).trim().slice(0, 500);
        }
      }
    }

    if (Object.keys(sanitizedChanges).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tidak ada kolom yang diizinkan untuk diedit dalam permintaan ini.',
        },
        { status: 400 }
      );
    }

    // 4. Periksa Ketersediaan Konfigurasi Server (URL & Secret Token Wajib)
    const scriptUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL || process.env.GOOGLE_APPS_SCRIPT_URL;
    const secretToken = process.env.SHEETS_API_SECRET_TOKEN;

    if (!scriptUrl || typeof scriptUrl !== 'string' || scriptUrl.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Variabel lingkungan GOOGLE_SHEETS_SCRIPT_URL belum diatur di server Vercel / .env.local. Silakan lakukan deployment Google Apps Script terlebih dahulu.',
        },
        { status: 503 }
      );
    }

    if (!secretToken || typeof secretToken !== 'string' || secretToken.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Variabel lingkungan SHEETS_API_SECRET_TOKEN belum diatur pada hosting website (Vercel / .env.local). Silakan tambahkan token rahasia server-to-server.',
        },
        { status: 500 }
      );
    }

    // 5. Kirim Perubahan ke Google Apps Script Web App (Token dikirim via body payload HTTPS)
    const appsScriptPayload = {
      id: trimmedId,
      changes: sanitizedChanges,
      token: secretToken,
    };

    let appsScriptRes;
    try {
      appsScriptRes = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Security-Token': secretToken,
        },
        body: JSON.stringify(appsScriptPayload),
        signal: AbortSignal.timeout(25000), // Batas waktu tunggu 25 detik
      });
    } catch (fetchErr) {
      console.error('[API /api/sheets POST] Network/Timeout error to Google Apps Script:', fetchErr);
      if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Koneksi ke Google Sheets mengalami batas waktu (timeout). Silakan periksa jaringan dan coba kembali.',
          },
          { status: 504 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: `Gagal menghubungi endpoint Google Apps Script: ${fetchErr.message}`,
        },
        { status: 502 }
      );
    }

    let responseData;
    const resText = await appsScriptRes.text();
    try {
      responseData = JSON.parse(resText);
    } catch {
      console.error('[API /api/sheets POST] Non-JSON response from Google Apps Script:', resText);
      return NextResponse.json(
        {
          success: false,
          error: 'Respons dari Google Apps Script tidak valid.',
        },
        { status: 502 }
      );
    }

    if (!appsScriptRes.ok || !responseData.success) {
      return NextResponse.json(
        {
          success: false,
          error: responseData.error || responseData.message || 'Gagal menyimpan pembaruan ke Google Sheets.',
        },
        { status: responseData.statusCode || 400 }
      );
    }

    // Berhasil disimpan ke Google Sheets
    return NextResponse.json({
      success: true,
      message: responseData.message || 'Biodata santri berhasil diperbarui di Google Sheets.',
      data: responseData.data || { id: trimmedId, updated: sanitizedChanges },
    });

  } catch (error) {
    console.error('[API /api/sheets POST] Unhandled server error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan sistem saat memproses pembaruan biodata.',
      },
      { status: 500 }
    );
  }
}
