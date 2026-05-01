import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u');
  if (!u) return new NextResponse(null, { status: 400 });
  try {
    const url = new URL(u);
    const h = new Headers();
    req.headers.forEach((v, k) => {
      if (!['host','connection','content-length'].includes(k.toLowerCase())) h.set(k, v);
    });
    h.set('host', url.host);

    const r = await fetch(url.toString(), {
      method: req.method,
      headers: h,
      body: req.body ? await req.arrayBuffer() : undefined,
      redirect: 'follow',
    });

    const rh = new Headers();
    r.headers.forEach((v, k) => {
      if (!['content-encoding','transfer-encoding','content-length'].includes(k.toLowerCase())) rh.set(k, v);
    });

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
