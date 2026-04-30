import { NextRequest, NextResponse } from 'next/server';
import dns2 from 'dns2';
import Redis from 'ioredis';

const { Packet } = dns2;

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

const CACHE_TTL = 300; // 5 minutes

const resolver = new dns2.UDPClient({
  dns: '1.1.1.1', // Cloudflare
  port: 53,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') || searchParams.get('dns');
  const type = (searchParams.get('type') || 'A').toUpperCase();

  if (!name) {
    return NextResponse.json({ error: 'Missing domain name' }, { status: 400 });
  }

  const cacheKey = `dns:${type}:${name.toLowerCase()}`;

  try {
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // Resolve
    const result = await resolver.resolve(name, type as any);

    const response = {
      status: 'success',
      name,
      type,
      answers: result.answers || [],
      timestamp: Date.now(),
    };

    // Cache result
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('DNS Error:', error);
    return NextResponse.json({ 
      error: 'Resolution failed', 
      message: error.message 
    }, { status: 502 });
  }
}
