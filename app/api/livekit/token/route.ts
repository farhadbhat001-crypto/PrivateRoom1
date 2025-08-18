import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const roomId = typeof body.roomId === 'string' ? body.roomId.trim() : '';
    const password = typeof body.password === 'string' ? body.password.trim() : '';
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';

    if (!roomId || !password || !userId) {
      return NextResponse.json({ error: 'roomId, password, and userId are required' }, { status: 400 });
    }

    // Validate password
    const { data: match, error: matchErr } = await supabase
      .from('purchases')
      .select('id')
      .eq('room_id', roomId)
      .eq('password', password)
      .eq('revoked', false)
      .maybeSingle();

    if (matchErr) {
      console.error('token validate query error', matchErr);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Ensure room exists
    const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
    try {
      await svc.createRoom({ name: roomId });
    } catch (err: unknown) {
      const message = (err as Error).message || String(err);
      if (!/already exists/i.test(message)) {
        return NextResponse.json({ error: 'Failed to ensure room' }, { status: 502 });
      }
    }

    // Generate token
    const at = new AccessToken(apiKey, apiSecret, { identity: userId });
    at.addGrant({ room: roomId, roomJoin: true, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();

    return NextResponse.json({ token }, { status: 200 });
  } catch (err) {
    console.error('POST /api/livekit/token error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



