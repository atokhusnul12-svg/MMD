import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { VAPID_KEYS } from '@/lib/vapidKeys';
import { getSubscriptions, deleteSubscription } from '@/lib/subscriptionStore';

export async function POST(request) {
  try {
    // 1. Guard hak akses: Hanya Admin yang diizinkan mengirim broadcast
    const cookieSession = request.cookies?.get('waka3_admin_session')?.value;
    const headerAuth = request.headers?.get('x-admin-auth');
    const isAdmin = cookieSession === 'true' || headerAuth === 'true';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Hanya Admin yang dapat mengirim broadcast.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, message, url, type, targetSubscription } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Judul dan pesan notifikasi wajib diisi.' },
        { status: 400 }
      );
    }

    // Setel kredensial VAPID
    webpush.setVapidDetails(
      VAPID_KEYS.subject,
      VAPID_KEYS.publicKey,
      VAPID_KEYS.privateKey
    );

    // Tentukan URL tujuan
    let targetUrl = url || '/';
    if (!targetUrl.startsWith('http')) {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://waka-iii.vercel.app';
      targetUrl = `${baseUrl}${targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`}`;
    }

    const payload = JSON.stringify({
      title: title.trim(),
      message: message.trim(),
      url: targetUrl,
      type: type || 'general',
      icon: 'https://waka-iii.vercel.app/icon.png',
      timestamp: Date.now(),
    });

    // Target penerima: subscription spesifik atau seluruh subscriber
    const recipients = targetSubscription ? [targetSubscription] : getSubscriptions();

    if (recipients.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        total: 0,
        message: 'Belum ada perangkat yang mendaftar untuk menerima notifikasi.',
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
        // Jika token sudah expired / uninstalled (Status 404 atau 410 Gone), hapus dari store
        if (err.statusCode === 404 || err.statusCode === 410) {
          if (sub?.endpoint) {
            deleteSubscription(sub.endpoint);
          }
        }
        console.warn('[WebPush] Gagal mengirim ke client:', err?.message || err);
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
        error: error.message || 'Gagal mengirim push notification.',
      },
      { status: 500 }
    );
  }
}
