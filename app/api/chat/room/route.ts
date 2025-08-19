import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const roomId = req.nextUrl.searchParams.get('roomId')?.trim() || '';
    if (!roomId) return NextResponse.json({ error: 'roomId is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('room_messages')
      .select('id, room_id, user_id, content, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
    return NextResponse.json({ messages: data ?? [] }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await whopSdk.getUser();
    if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const roomId = typeof body.roomId === 'string' ? body.roomId.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!roomId || !content) return NextResponse.json({ error: 'roomId and content are required' }, { status: 400 });

    // Ensure app user exists
    let { data: dbUser, error: findErr } = await supabase.from('users').select('id').eq('whop_user_id', user.id).single();
    if (findErr && (findErr as any).code !== 'PGRST116') return NextResponse.json({ error: 'User lookup failed' }, { status: 500 });
    if (!dbUser) {
      const { data: created, error: createErr } = await supabase.from('users').insert({ whop_user_id: user.id, email: user.email ?? null }).select('id').single();
      if (createErr) return NextResponse.json({ error: 'User create failed' }, { status: 500 });
      dbUser = created;
    }

    const { data: ins, error: insErr } = await supabase
      .from('room_messages')
      .insert({ room_id: roomId, user_id: dbUser.id, content })
      .select()
      .single();

    if (insErr) return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    return NextResponse.json({ message: ins }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




