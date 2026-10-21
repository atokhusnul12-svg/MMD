import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { DATA_LINKS } from '@/lib/dataLinks';

const ACTIVE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwgPIXDzEMJAyzbnp2mTnOhaIuVIhFGOKnY5DQVSV_ZA1IeRaOV0iYT6-4zITbTijvc/exec';

function resolveScriptUrl() {
  const envUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL || process.env.GOOGLE_APPS_SCRIPT_URL;
  if (
    !envUrl ||
    envUrl.includes('5SY1LiUuTg') ||
    envUrl.includes('AKfycbz71opCqhj') ||
    envUrl.includes('AKfycbyY5G0BrvGS87rndi5nK-nBEBRO95QxeXF2_1nYKsx0ZuJ68TzN7EJJzegaXWYZYDV2OQ') ||
    envUrl.includes('AKfycbzuNoe2QQ3DVDQsIDZepDivH3-e9FBvmPYbnkvzN8Vf8phJdrDCU-PrGQqY8sWgTBQEGg') ||
    envUrl.includes('AWDD_qWzKQ')
  ) {
    return ACTIVE_APPS_SCRIPT_URL;
  }
  return envUrl.trim();
}

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

      const scriptUrl = resolveScriptUrl();
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

        const contentType = testRes.headers.get('content-type') || '';
        const text = await testRes.text();
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {}

        checks.httpStatus = testRes.status;
        checks.contentType = contentType;
        checks.scriptUrlEnding = scriptUrl.slice(-15);
        checks.redirected = testRes.redirected;
        checks.diagnoseTime = new Date().toISOString();

        // Kasus 1: Mengembalikan HTML login / error dari Apps Script
        if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('accounts.google.com') || contentType.includes('text/html')) {
          const titleMatch = text.match(/<title>(.*?)<\/title>/i);
          checks.pageTitle = titleMatch ? titleMatch[1] : '';
          
          // Ambil isi teks dari body atau div error
          const bodyText = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                               .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                               .replace(/<[^>]+>/g, ' ')
                               .replace(/\s+/g, ' ')
                               .trim();
          checks.bodySnippet = bodyText.slice(0, 300);

          if (checks.pageTitle.toLowerCase().includes('error')) {
            checks.statusMessage = `Google Apps Script menghasilkan Error saat dijalankan: "${checks.bodySnippet}".`;
          } else {
            checks.statusMessage = 'Google Apps Script merespons dengan halaman login. Pada editor Apps Script, pastikan saat Deploy Web App, pilihan "Who has access" disetel ke "Anyone" (Siapa saja). Jika Anda membuat New Deployment, pastikan URL /exec yang baru sudah disalin dan di-redeploy di Vercel.';
          }
          return NextResponse.json({ success: false, checks });
        }

        // Kasus 2: Berhasil mengembalikan JSON dari doGet
        if (json && json.status === 'online') {
          checks.scriptReachable = true;
          checks.scriptTokenConfigured = Boolean(json.configured);
          if (checks.scriptTokenConfigured) {
            checks.statusMessage = 'Koneksi sempurna! Google Apps Script dan token keamanan telah terverifikasi dan siap digunakan.';
            return NextResponse.json({ success: true, checks });
          } else {
            checks.statusMessage = 'Web App Google Sheets aktif, namun Script Property "SHEETS_API_SECRET_TOKEN" belum disetel pada Project Settings Google Apps Script.';
            return NextResponse.json({ success: false, checks });
          }
        }

        // Kasus 3: Deployment masih menggunakan kode versi lama sebelum doGet diperbarui
        checks.scriptReachable = true;
        checks.statusMessage = 'Web App Google Sheets terhubung, tetapi masih menjalankan kode versi lama. Silakan buka editor Apps Script, lalu klik Deploy > Manage deployments > Edit > New version > Deploy.';
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

    // Normalisasi URL: pastikan awalan /2PACX- selalu kapital karena Google Docs URL case-sensitive
    fetchUrl = fetchUrl.replace(/\/2PACx-/g, '/2PACX-');

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

    const { action, id, changes, event } = body || {};

    // 1. Guard Aksi: Hanya 'syncBahsuEvent' yang diizinkan. Pengeditan biodata ditolak permanen.
    if (action !== 'syncBahsuEvent' && !event) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Fitur pengeditan biodata santri dinonaktifkan. Data biodata santri pada Google Sheets bersifat tetap (read-only) dan tidak dapat diubah melalui website.',
        },
        { status: 403 }
      );
    }

    // 2. Validasi Input Payload Kegiatan Bahtsul Masail
    const eventData = event || {};
    const newAcara = String(eventData.newAcara || eventData.acara || '').trim();
    const newTanggal = String(eventData.newTanggal || eventData.tanggal || '').trim();
    const delegasi = String(eventData.delegasi || '').trim();
    const keterangan = String(eventData.keterangan || 'SUDAH').trim();
    const oldAcara = String(eventData.oldAcara || '').trim();
    const oldTanggal = String(eventData.oldTanggal || '').trim();
    const mode = eventData.mode === 'create' ? 'create' : 'edit';
    const rowNumber = Number(eventData.rowNumber) || null;
    const no = eventData.no !== undefined && eventData.no !== null ? String(eventData.no).trim() : '';
    const matchedMemberIds = Array.isArray(eventData.matchedMemberIds)
      ? eventData.matchedMemberIds.map((id) => String(id).trim().toUpperCase()).filter(Boolean)
      : [];

    const selectedStudents = Array.isArray(eventData.selectedStudents)
      ? eventData.selectedStudents
          .map((s) => ({
            id: String(s.id || '').trim().toUpperCase(),
            noOriginal: s.noOriginal !== undefined && s.noOriginal !== null ? Number(s.noOriginal) : null,
            nama: String(s.nama || '').trim(),
            kelas: String(s.kelas || '').trim(),
          }))
          .filter((s) => s.nama || s.id)
      : [];

    if (!newAcara) {
      return NextResponse.json(
        { success: false, error: 'Nama agenda Bahtsul Masail (acara) wajib diisi.' },
        { status: 400 }
      );
    }

    if (!newTanggal) {
      return NextResponse.json(
        { success: false, error: 'Tanggal pelaksanaan kegiatan Bahtsul Masail wajib diisi.' },
        { status: 400 }
      );
    }

    // 3. Verifikasi Konfigurasi Backend Google Apps Script
    const scriptUrl = resolveScriptUrl();
    const secretToken = process.env.SHEETS_API_SECRET_TOKEN || 'waka3_internal_token_2026';

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
      // Fallback dev lokal: jika dijalankan di localhost tanpa token, teruskan ke live endpoint produksi Vercel
      if (process.env.NODE_ENV !== 'production') {
        try {
          const fallbackRes = await fetch('https://waka-iii.vercel.app/api/sheets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-auth': 'true',
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(25000),
          });
          const fallbackData = await fallbackRes.json();
          return NextResponse.json(fallbackData, { status: fallbackRes.status });
        } catch (fallbackErr) {
          console.error('[API /api/sheets POST] Fallback proxy dev error:', fallbackErr);
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Variabel lingkungan SHEETS_API_SECRET_TOKEN belum diatur pada hosting website (Vercel / .env.local). Silakan tambahkan token rahasia server-to-server.',
        },
        { status: 500 }
      );
    }

    const appsScriptPayload = {
      action: 'syncBahsuEvent',
      token: secretToken,
      event: {
        mode,
        rowNumber,
        no,
        newAcara: newAcara.slice(0, 500),
        newTanggal: newTanggal.slice(0, 100),
        delegasi: delegasi.slice(0, 3000),
        keterangan: keterangan.slice(0, 100),
        oldAcara: oldAcara.slice(0, 500),
        oldTanggal: oldTanggal.slice(0, 100),
        matchedMemberIds: matchedMemberIds.slice(0, 100),
        selectedStudents: selectedStudents.slice(0, 50),
      },
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
      const titleMatch = resText.match(/<title>(.*?)<\/title>/i);
      const cleanSnippet = resText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 250);
      console.error('[API /api/sheets POST] Non-JSON response from Google Apps Script:', resText);
      return NextResponse.json(
        {
          success: false,
          error: `Respons dari Google Apps Script bukan JSON (${titleMatch ? titleMatch[1] : 'Non-JSON'}): ${cleanSnippet}`,
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

    // Invalidate Next.js server ISR cache for related pages
    try {
      revalidatePath('/anggota');
      revalidatePath('/bahsu');
      revalidatePath('/waka-iii');
    } catch (revalErr) {
      console.warn('[API /api/sheets POST] revalidatePath warning:', revalErr);
    }

    // Berhasil disimpan ke Google Sheets
    return NextResponse.json({
      success: true,
      message: responseData.message || 'Perubahan berhasil disimpan ke Google Sheets.',
      data: responseData.data || null,
      isPartial: Boolean(responseData.data?.isPartial),
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
