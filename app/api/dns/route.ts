import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-dns-secret');
  if (secret !== process.env.DNS_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log("✅ Minimal test function called from residential IP");

  // Hardcoded test response (no Redis, no dns.resolve)
  return NextResponse.json({
    data: ["142.250.190.78", "142.250.190.14"] 
  });
}
