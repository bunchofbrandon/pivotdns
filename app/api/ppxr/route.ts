import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u');
  if (!u) return new NextResponse(null, { status: 400 });
  try {
    const url = new URL(u);
    const h = new Headers();
    h.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    h.set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
    h.set('accept-language', 'en-US,en;q=0.9');
    h.set('accept-encoding', 'gzip, deflate, br');
    h.set('sec-fetch-mode', 'navigate');
    h.set('sec-fetch-site', 'none');
    h.set('sec-fetch-dest', 'document');
    h.set('upgrade-insecure-requests', '1');
    h.set('host', url.host);

    const r = await fetch(url.toString(), {
      method: req.method,
      headers: h,
      body: req.body ? await req.arrayBuffer() : undefined,
      redirect: 'follow',
    });

    const rh = new Headers(r.headers);
    rh.delete('content-encoding');
    rh.delete('transfer-encoding');
    rh.delete('content-length');

    return new NextResponse(await r.arrayBuffer(), {
      status: r.status,
      headers: rh,
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
