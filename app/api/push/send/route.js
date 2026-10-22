import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { VAPID_KEYS } from '@/lib/vapidKeys';
import { getSubscriptions, deleteSubscription } from '@/lib/subscriptionStore';
import { verifyServerSession, validateSameOrigin } from '@/lib/serverAuth';

export async function POST(request) {
  try {
    // 1. Proteksi CSRF / Same-Origin
    if (!validateSameOrigin(request)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Permintaan lintas asal (Cross-Origin) tidak diizinkan.' },
        { status: 403 }
      );
    }

    // 2. Guard Hak Akses Administrator di Server (Hanya Sesi Bertanda Tangan Kriptografis)
    const session = verifyServerSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses ditolak: Hanya Administrator yang berwenang mengirim broadcast notifikasi.',
        },
        { status: 403 }
      );
    }

    // 3. Baca dan validasi payload JSON
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Payload permintaan bukan JSON yang valid.' },
        { status: 400 }
      );
    }

    const { title, message, url, type, targetSubscription } = body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Judul notifikasi wajib diisi.' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pesan notifikasi wajib diisi.' },
        { status: 400 }
      );
    }

    // 4. Verifikasi Kredensial VAPID
    if (!VAPID_KEYS.publicKey || !VAPID_KEYS.privateKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Konfigurasi Web Push VAPID belum lengkap di server.',
        },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(
      VAPID_KEYS.subject,
      VAPID_KEYS.publicKey,
      VAPID_KEYS.privateKey
    );

    // 5. Tentukan URL Tujuan yang Aman
    let targetUrl = typeof url === 'string' && url.trim().length > 0 ? url.trim() : '/';
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://waka-iii.vercel.app';
      targetUrl = `${baseUrl}${targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`}`;
    }

    const payload = JSON.stringify({
      title: title.trim().slice(0, 120),
      message: message.trim().slice(0, 500),
      url: targetUrl,
      type: typeof type === 'string' ? type.slice(0, 50) : 'general',
      icon: 'https://waka-iii.vercel.app/icon.png',
      timestamp: Date.now(),
    });

    // 6. Target Penerima: Subscription Tertentu atau Seluruh Subscriber
    const recipients = targetSubscription ? [targetSubscription] : await getSubscriptions();

    if (recipients.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        total: 0,
        message: 'Belum ada perangkat yang terdaftar untuk menerima notifikasi.',
      });
    }

    let successCount = 0;
    let failCount = 0;

    const sendPromises = recipients.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
        successCount++;
      } catch (err) {
        failCount++;
        // Jika token sudah kedaluwarsa atau uninstalled (Status 404 / 410 Gone), bersihkan
        if (err.statusCode === 404 || err.statusCode === 410) {
          if (sub?.endpoint) {
            deleteSubscription(sub.endpoint);
          }
        }
        console.warn('[WebPush] Pengiriman ke subscriber gagal:', err?.message || err);
      }
    });

    await Promise.allSettled(sendPromises);

    return NextResponse.json({
      success: true,
      message: `Notifikasi berhasil dikirimkan ke ${successCount} perangkat.`,
      sent: successCount,
      failed: failCount,
      total: recipients.length,
    });
  } catch (error) {
    console.error('[API /api/push/send error]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan sistem saat mengirimkan notifikasi.',
      },
      { status: 500 }
    );
  }
}
