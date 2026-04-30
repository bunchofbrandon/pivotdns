import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log("✅ /api/ping called successfully");
  return NextResponse.json({ status: "pong", time: Date.now() });
}
