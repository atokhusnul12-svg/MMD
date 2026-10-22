import { NextResponse } from 'next/server';
import {
  verifyAdminCredentials,
  createSessionToken,
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginFailure,
  validateSameOrigin,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from '@/lib/serverAuth';

export async function POST(request) {
  try {
    // 1. Proteksi CSRF / Same-Origin
    if (!validateSameOrigin(request)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Permintaan lintas asal (Cross-Origin) tidak diizinkan.' },
        { status: 403 }
      );
    }

    // 2. Dapatkan IP Klien untuk Rate Limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // 3. Periksa Rate Limit (Maksimal 5 percobaan gagal per 5 menit)
    const rateCheck = checkLoginRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: rateCheck.error },
        { status: 429 }
      );
    }

    // 4. Baca Body JSON
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Format permintaan bukan JSON yang valid.' },
        { status: 400 }
      );
    }

    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    // 5. Verifikasi Kredensial di Sisi Server (Timing-Safe)
    const isValid = verifyAdminCredentials(username, password);

    if (!isValid) {
      recordLoginFailure(ip);
      const remainingAttempts = checkLoginRateLimit(ip).remaining;
      return NextResponse.json(
        {
          success: false,
          error: `Username atau Password salah. (Sisa percobaan: ${remainingAttempts})`,
        },
        { status: 401 }
      );
    }

    // 6. Reset catatan kegagalan jika login berhasil
    resetLoginFailure(ip);

    // 7. Buat Token Sesi Kriptografis
    const token = createSessionToken({
      username: String(username).trim().toUpperCase(),
      role: 'admin',
      name: 'Admin WAKA III',
    });

    // 8. Bentuk Respons & Set Cookie HttpOnly yang Aman
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil sebagai Pengurus MMD.',
      user: {
        username: String(username).trim().toUpperCase(),
        role: 'admin',
        name: 'Admin WAKA III',
      },
    });

    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });

    return response;
  } catch (err) {
    console.error('API /api/auth/login error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    );
  }
}
