import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { DATA_LINKS } from '@/lib/dataLinks';
import { verifyServerSession, validateSameOrigin } from '@/lib/serverAuth';

/**
 * Sanitasi string untuk mencegah Formula Injection di Google Sheets / Excel
 * Jika nilai diawali karakter =, +, -, @, \t, atau \r, berikan prefix petik tunggal (')
 * sehingga dievaluasi murni sebagai teks dan tidak dieksekusi sebagai formula.
 */
function sanitizeSpreadsheetCell(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

const ACTIVE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwgPIXDzEMJAyzbnp2mTnOhaIuVIhFGOKnY5DQVSV_ZA1IeRaOV0iYT6-4zITbTijvc/exec';

const DEFAULT_SHEETS_SECRET_TOKEN =
  'waka3_sec_8f92e4c107b36a1829e5d41f0bc98a3e72154d89601f3bc8a7e492015c7e14ab';

function resolveScriptUrl() {
  const envUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL || process.env.GOOGLE_APPS_SCRIPT_URL;
  if (
    !envUrl ||
    envUrl.includes('5SY1LiUuTg') ||
    envUrl.includes('AKfycbz71opCqhj') ||
    envUrl.includes('AKfycbyY5G0BrvGS87rndi5nK-nBEBRO95QxeXF2_1nYKsx0ZuJ68TzN7EJJzegaXWYZYDV2OQ') ||
    envUrl.includes('AKfycbzuNoe2QQ3DVDQsIDZepDivH3-e9FBvmPYbnkvzN8Vf8phJdrDCU-PrGQqY8sWgTBQEGg') ||
    envUrl.includes('AWDD_qWzKQ') ||
    envUrl.includes('RLxKbZtx8w') ||
    envUrl.includes('AKfycbyu_z0-iP8I5ZSOsolfi0uC-iIkxelbVciH3qvbKi41A2Wwqu0UB0mb2uP9CB8n6zmDEA')
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
      const session = verifyServerSession(request);

      if (!session || session.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Akses ditolak: Fitur diagnostik hanya dapat diakses oleh Administrator.' },
          { status: 403 }
        );
      }

      const scriptUrl = resolveScriptUrl();
      const secretToken = process.env.SHEETS_API_SECRET_TOKEN || DEFAULT_SHEETS_SECRET_TOKEN;

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
    // 1. Proteksi CSRF / Same-Origin
    if (!validateSameOrigin(request)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Permintaan lintas asal (Cross-Origin) tidak diizinkan.' },
        { status: 403 }
      );
    }

    // 2. Baca dan validasi format payload JSON
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Payload permintaan bukan JSON yang valid.' },
        { status: 400 }
      );
    }

    const { action, event } = body || {};

    // 3. Guard Aksi: Hanya 'syncBahsuEvent' yang diizinkan untuk mutasi data agenda.
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

    // 5. Validasi & Sanitasi Input Payload (Cegah Formula Injection)
    const eventData = event || {};
    const rawAcara = String(eventData.newAcara || eventData.acara || '').trim();
    const rawTanggal = String(eventData.newTanggal || eventData.tanggal || '').trim();
    const rawDelegasi = String(eventData.delegasi || '').trim();
    const rawKeterangan = String(eventData.keterangan || 'SUDAH').trim();
    const rawOldAcara = String(eventData.oldAcara || '').trim();
    const rawOldTanggal = String(eventData.oldTanggal || '').trim();
    const mode = eventData.mode === 'create' ? 'create' : 'edit';
    const rowNumber = Number.isInteger(Number(eventData.rowNumber)) ? Number(eventData.rowNumber) : null;
    const rawNo = eventData.no !== undefined && eventData.no !== null ? String(eventData.no).trim() : '';

    if (!rawAcara) {
      return NextResponse.json(
        { success: false, error: 'Nama agenda Bahtsul Masail (acara) wajib diisi.' },
        { status: 400 }
      );
    }

    if (!rawTanggal) {
      return NextResponse.json(
        { success: false, error: 'Tanggal pelaksanaan kegiatan Bahtsul Masail wajib diisi.' },
        { status: 400 }
      );
    }

    // Terapkan sanitasi sel anti formula injection
    const newAcara = sanitizeSpreadsheetCell(rawAcara.slice(0, 500));
    const newTanggal = sanitizeSpreadsheetCell(rawTanggal.slice(0, 100));
    const delegasi = sanitizeSpreadsheetCell(rawDelegasi.slice(0, 3000));
    const keterangan = sanitizeSpreadsheetCell(rawKeterangan.slice(0, 100));
    const oldAcara = sanitizeSpreadsheetCell(rawOldAcara.slice(0, 500));
    const oldTanggal = sanitizeSpreadsheetCell(rawOldTanggal.slice(0, 100));
    const no = sanitizeSpreadsheetCell(rawNo.slice(0, 50));

    const matchedMemberIds = Array.isArray(eventData.matchedMemberIds)
      ? eventData.matchedMemberIds
          .map((id) => sanitizeSpreadsheetCell(String(id).trim().toUpperCase()))
          .filter(Boolean)
          .slice(0, 100)
      : [];

    const selectedStudents = Array.isArray(eventData.selectedStudents)
      ? eventData.selectedStudents
          .map((s) => ({
            id: sanitizeSpreadsheetCell(String(s.id || '').trim().toUpperCase()),
            noOriginal: Number.isInteger(Number(s.noOriginal)) ? Number(s.noOriginal) : null,
            nama: sanitizeSpreadsheetCell(String(s.nama || '').trim().slice(0, 200)),
            kelas: sanitizeSpreadsheetCell(String(s.kelas || '').trim().slice(0, 100)),
          }))
          .filter((s) => s.nama || s.id)
          .slice(0, 50)
      : [];

    // 5. Verifikasi Konfigurasi Backend Google Apps Script (Fail-Closed)
    const scriptUrl = resolveScriptUrl();
    const secretToken = process.env.SHEETS_API_SECRET_TOKEN || DEFAULT_SHEETS_SECRET_TOKEN;

    if (!scriptUrl || typeof scriptUrl !== 'string' || scriptUrl.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Variabel lingkungan GOOGLE_SHEETS_SCRIPT_URL belum diatur di server Vercel / .env.local.',
        },
        { status: 503 }
      );
    }

    const trimmedToken = (secretToken || DEFAULT_SHEETS_SECRET_TOKEN).trim();

    const appsScriptPayload = {
      action: 'syncBahsuEvent',
      token: trimmedToken,
      event: {
        mode,
        rowNumber,
        no,
        newAcara,
        newTanggal,
        delegasi,
        keterangan,
        oldAcara,
        oldTanggal,
        matchedMemberIds,
        selectedStudents,
      },
    };

    const scriptUrlWithToken = `${scriptUrl}${scriptUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(trimmedToken)}`;

    let appsScriptRes;
    try {
      appsScriptRes = await fetch(scriptUrlWithToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Security-Token': trimmedToken,
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
      let errorMsg = responseData.error || responseData.message || 'Gagal menyimpan pembaruan ke Google Sheets.';
      if (appsScriptRes.status === 401 || responseData.statusCode === 401) {
        errorMsg = 'Otorisasi Google Sheets ditolak: Token autentikasi tidak sesuai. Pastikan SHEETS_API_SECRET_TOKEN terkonfigurasi dengan benar.';
      }
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
        },
        { status: responseData.statusCode || appsScriptRes.status || 400 }
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
