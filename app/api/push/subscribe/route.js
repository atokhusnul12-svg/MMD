import { NextResponse } from 'next/server';
import {
  saveSubscription,
  deleteSubscription,
  countSubscriptions,
  isValidSubscription,
} from '@/lib/subscriptionStore';
import { validateSameOrigin } from '@/lib/serverAuth';

export async function POST(request) {
  try {
    // 1. Proteksi CSRF / Same-Origin
    if (!validateSameOrigin(request)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Permintaan lintas asal tidak diizinkan.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subscription, action } = body || {};

    if (!subscription || !isValidSubscription(subscription)) {
      return NextResponse.json(
        { success: false, error: 'Format objek subscription tidak valid atau tidak lengkap.' },
        { status: 400 }
      );
    }

    if (action === 'unsubscribe') {
      deleteSubscription(subscription.endpoint);
      return NextResponse.json({
        success: true,
        message: 'Perangkat berhasil di-unsubscribe.',
        count: countSubscriptions(),
      });
    }

    const saved = saveSubscription(subscription);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan subscription.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Perangkat berhasil didaftarkan untuk menerima notifikasi.',
      count: countSubscriptions(),
    });
  } catch (error) {
    console.error('[API /api/push/subscribe error]', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memproses subscription.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Hanya kembalikan jumlah subscriber (tanpa membocorkan endpoint atau private key)
  return NextResponse.json({
    count: countSubscriptions(),
  });
}
