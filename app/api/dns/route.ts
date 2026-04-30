export const runtime = 'edge';

const CLOUDFLARE_DOH = 'https://cloudflare-dns.com/dns-query';

export async function GET(req) {
  return proxyDoH(req);
}

export async function POST(req) {
  return proxyDoH(req);
}

async function proxyDoH(req) {
  try {
    const headers = new Headers(req.headers);
    headers.set('Host', 'cloudflare-dns.com');
    headers.delete('host'); // Vercel adds its own

    const response = await fetch(CLOUDFLARE_DOH, {
      method: req.method,
      headers: headers,
      body: req.body,
      duplex: 'half',
      redirect: 'manual',
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/dns-message',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('DoH error:', err);
    return new Response('DoH relay failed', { status: 502 });
  }
}
