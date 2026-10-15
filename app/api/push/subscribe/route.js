import { NextResponse } from 'next/server';
import {
  saveSubscription,
  deleteSubscription,
  countSubscriptions,
} from '@/lib/subscriptionStore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { subscription, action } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, error: 'Objek subscription tidak valid' },
        { status: 400 }
      );
    }

    if (action === 'unsubscribe') {
      deleteSubscription(subscription.endpoint);
      return NextResponse.json({
        success: true,
        message: 'Perangkat berhasil di-unsubscribe',
        count: countSubscriptions(),
      });
    }

    saveSubscription(subscription);

    return NextResponse.json({
      success: true,
      message: 'Perangkat berhasil didaftarkan untuk menerima notifikasi',
      count: countSubscriptions(),
    });
  } catch (error) {
    console.error('[API /api/push/subscribe error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses subscription' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    count: countSubscriptions(),
  });
}
