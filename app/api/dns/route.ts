import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns2';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const CACHE_TTL = 3600; // 1 hour

// Use Cloudflare as recursive upstream
const resolver = new dns.UDPClient({
  dns: '1.1.1.1',
  port: 53,
});

export async function GET(req: NextRequest) {
  try {
    const name = req.nextUrl.searchParams.get('name');
    const type = req.nextUrl.searchParams.get('type') || 'A';

    if (!name) {
      return NextResponse.json({ error: 'Missing ?name= parameter' }, { status: 400 });
    }

    const cacheKey = `dns:${name.toLowerCase()}:${type}`;

    // Check Redis cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        status: 'success',
        name,
        type,
        answers: cached,
        timestamp: Date.now(),
      });
    }

    // Recursive DNS lookup
    const result = await resolver.resolve(name, type);

    const answers = result.answers || [];

    // Cache the result
    await redis.set(cacheKey, answers, { ex: CACHE_TTL });

    return NextResponse.json({
      status: 'success',
      name,
      type,
      answers,
      timestamp: Date.now(),
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({
      status: 'error',
      error: err.message || 'DNS query failed'
    }, { status: 500 });
  }
}

// Keep the old POST for compatibility if you want
export async function POST(req: NextRequest) {
  // You can keep your old secret-protected version here if needed
  return NextResponse.json({ error: 'Use GET instead' }, { status: 405 });
}
