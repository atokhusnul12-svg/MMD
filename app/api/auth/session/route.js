import { NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/serverAuth';

export async function GET(request) {
  const session = verifyServerSession(request);

  if (!session || session.role !== 'admin') {
    return NextResponse.json({
      authenticated: false,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      username: session.username,
      name: session.name || 'Admin WAKA III',
      role: session.role,
    },
  });
}
