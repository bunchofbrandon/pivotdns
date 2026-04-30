import Redis from 'ioredis';
import dns from 'dns/promises';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis(process.env.REDIS_URL!);
const CACHE_TTL = 3600; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-dns-secret');
    if (secret !== process.env.DNS_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, type = 'A' } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Missing domain' }, { status: 400 });
    }

    const cacheKey = `dns:${name.toLowerCase()}:${type}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json({ data: JSON.parse(cached) });
    }

    // Clean DNS lookup
    const result = await dns.resolve(name, type as any);

    // Save to cache
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);

    return NextResponse.json({ data: result });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
