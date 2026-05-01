import { NextRequest, NextResponse } from 'next/server';
import dns2 from 'dns2';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

const CACHE_TTL = 300; // 5 minutes

// Correct dns2 resolver (this is the working pattern)
const resolver = dns2.UDPClient({
  dns: '1.1.1.1',
  port: 53,
});

// === TUNNEL PASSTHROUGH (touch Vercel only) ===
const TUNNEL_SUFFIX = '.shoppingsystemoftheyearmonthday.autos';

export async function GET(req: NextRequest) {
  try {
    const name = req.nextUrl.searchParams.get('name');
    const type = (req.nextUrl.searchParams.get('type') || 'A').toUpperCase();

    if (!name) {
      return NextResponse.json({ error: 'Missing ?name= parameter' }, { status: 400 });
    }

    // ─────────────────────────────────────────────────────────────
    // SPECIAL HANDLING FOR TUNNEL PAYLOADS
    // (DNSTT / NoizDNS / Slipstream / VayDNS etc.)
    // This makes the encoded payload actually reach Vercel server
    // without touching Cloudflare recursion.
    // Normal domains continue working exactly as before.
    // ─────────────────────────────────────────────────────────────
    if (name.toLowerCase().endsWith(TUNNEL_SUFFIX)) {
      console.log(`🚀 TUNNEL PAYLOAD TOUCHED VERCEL → ${name} (${type})`);

      const response = {
        status: 'success',
        name,
        type,
        answers: [
          {
            name,
            type: 'TXT',
            TTL: 60,
            data: `pivotdns-vercel-touched:${name}`,
          },
        ],
        timestamp: Date.now(),
        note: 'tunnel-payload-reached-vercel (no Cloudflare recursion)',
      };

      return NextResponse.json(response);
    }
    // ─────────────────────────────────────────────────────────────

    const cacheKey = `dns:${type}:${name.toLowerCase()}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // Do recursive DNS query (normal domains only)
    const result = await resolver(name, type as any);

    const response = {
      status: 'success',
      name,
      type,
      answers: result.answers || [],
      timestamp: Date.now(),
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('DNS Error:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message || 'DNS query failed'
    }, { status: 500 });
  }
}
