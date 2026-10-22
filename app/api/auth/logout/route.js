import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/serverAuth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesi telah ditutup (Logout berhasil).',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
