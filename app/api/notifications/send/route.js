import { NextResponse } from 'next/server';

/**
 * ==============================================================================
 * API ROUTE: KIRIM WEB PUSH NOTIFICATION ONESIGNAL
 * ==============================================================================
 * Endpoint: POST /api/notifications/send
 * 
 * Digunakan untuk mengirim notifikasi broadcast kepada seluruh santri, pengurus,
 * dan asatidz yang telah mengaktifkan notifikasi di perangkat mereka (HP & Desktop).
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, url, type, targetSubscriptionId } = body;

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    // 1. Validasi Environment Variables
    if (!appId || appId.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'NEXT_PUBLIC_ONESIGNAL_APP_ID belum diatur di Environment Variable Vercel/Local.',
          code: 'MISSING_APP_ID',
        },
        { status: 400 }
      );
    }

    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'ONESIGNAL_REST_API_KEY belum diatur di Environment Variable Vercel/Local. Harap tambahkan REST API Key dari OneSignal Dashboard.',
          code: 'MISSING_API_KEY',
        },
        { status: 400 }
      );
    }

    // 2. Validasi Input Payload
    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Judul (title) dan pesan (message) notifikasi wajib diisi.',
          code: 'INVALID_PAYLOAD',
        },
        { status: 400 }
      );
    }

    // 3. Tentukan URL Tujuan Notifikasi
    let targetUrl = url || 'https://waka-iii.vercel.app/';
    if (targetUrl.startsWith('/')) {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'https://waka-iii.vercel.app';
      targetUrl = `${baseUrl}${targetUrl}`;
    }

    // 4. Siapkan Payload untuk OneSignal REST API v1
    const payload = {
      app_id: appId,
      headings: {
        en: title,
        id: title,
      },
      contents: {
        en: message,
        id: message,
      },
      url: targetUrl,
      // Ikon web & badge menggunakan logo resmi MMD Darussalamah
      chrome_web_icon: 'https://waka-iii.vercel.app/icon.png',
      chrome_web_badge: 'https://waka-iii.vercel.app/icon.png',
      firefox_icon: 'https://waka-iii.vercel.app/icon.png',
      data: {
        type: type || 'general',
        timestamp: new Date().toISOString(),
      },
    };

    // Target pengiriman: ke subscription tertentu (jika test perseorangan) atau seluruh subscribers
    if (targetSubscriptionId) {
      payload.include_subscription_ids = [targetSubscriptionId];
    } else {
      payload.included_segments = ['Subscribed Users'];
    }

    // 5. Panggil OneSignal REST API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${apiKey.trim()}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[OneSignal REST API Error]', data);
      return NextResponse.json(
        {
          success: false,
          error: data.errors?.[0] || data.error || 'Gagal mengirim notifikasi via OneSignal REST API.',
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notifikasi berhasil dikirimkan!',
      id: data.id,
      recipients: data.recipients || 0,
    });
  } catch (error) {
    console.error('[OneSignal API Route Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Terjadi kesalahan internal server saat mengirim notifikasi.',
      },
      { status: 500 }
    );
  }
}
