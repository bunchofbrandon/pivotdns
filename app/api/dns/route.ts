import { NextRequest, NextResponse } from 'next/server';
import dns2 from 'dns2';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

const CACHE_TTL = 300; // 5 minutes

// Cloudflare for normal recursive DNS
const publicResolver = dns2.UDPClient({
  dns: '1.1.1.1',
  port: 53,
});

// === TUNNEL FORWARDING (only these domains) ===
const TUNNEL_SUFFIX = '.shoppingsystemoftheyearmonthday.autos';
const VPS_IP = "89.167.66.221";   // ←←← REPLACE WITH YOUR REAL SERVER IP

export async function GET(req: NextRequest) {
  try {
    const name = req.nextUrl.searchParams.get('name');
    const type = (req.nextUrl.searchParams.get('type') || 'A').toUpperCase();

    if (!name) {
      return NextResponse.json({ error: 'Missing ?name= parameter' }, { status: 400 });
    }

    // ─────────────────────────────────────────────────────────────
    // TUNNEL PAYLOADS → forward directly to your real VPS
    // This is the clean "touch Vercel then hand off" layer
    // ─────────────────────────────────────────────────────────────
    if (name.toLowerCase().endsWith(TUNNEL_SUFFIX)) {
      console.log(`🚀 TUNNEL PAYLOAD TOUCHED VERCEL → forwarding to VPS: ${name} (${type})`);

      const realResolver = dns2.UDPClient({
        dns: VPS_IP,
        port: 53,
      });

      const result = await realResolver(name, type as any);

      const response = {
        status: 'success',
        name,
        type,
        answers: result.answers || [],
        timestamp: Date.now(),
        note: 'tunnel-payload-forwarded-to-real-VPS',
      };

      return NextResponse.json(response);
    }
    // ─────────────────────────────────────────────────────────────

    const cacheKey = `dns:${type}:${name.toLowerCase()}`;

    // Check cache (normal domains only)
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // Normal recursive resolution
    const result = await publicResolver(name, type as any);

    const response = {
      status: 'success',
      name,
      type,
      answers: result.answers || [],
      timestamp: Date.now(),
    };

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
