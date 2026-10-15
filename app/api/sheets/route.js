import { NextResponse } from 'next/server';
import { DATA_LINKS } from '@/lib/dataLinks';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const type = searchParams.get('type');

    let fetchUrl = targetUrl;
    if (!fetchUrl && type && DATA_LINKS[type]) {
      fetchUrl = DATA_LINKS[type].csvUrl;
    }

    if (!fetchUrl) {
      return NextResponse.json({ error: 'Parameter url atau type diperlukan' }, { status: 400 });
    }

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
    console.error('API /api/sheets error:', err);
    return NextResponse.json(
      { error: `Gagal mengambil CSV: ${err.message}` },
      { status: 500 }
    );
  }
}
