import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const roomId = req.nextUrl.searchParams.get('roomId')?.trim() || '';
    const peerId = req.nextUrl.searchParams.get('peerId')?.trim() || '';
    const user = await whopSdk.getUser();
    if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!roomId || !peerId) return NextResponse.json({ error: 'roomId and peerId are required' }, { status: 400 });

    const { data: self, error: selfErr } = await supabase.from('users').select('id').eq('whop_user_id', user.id).single();
    if (selfErr) return NextResponse.json({ error: 'User lookup failed' }, { status: 500 });

    const { data, error } = await supabase
      .from('dm_messages')
      .select('id, room_id, sender_id, receiver_id, content, created_at')
      .eq('room_id', roomId)
      .or(`and(sender_id.eq.${self.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${self.id})`)
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
    const peerId = typeof body.peerId === 'string' ? body.peerId.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!roomId || !peerId || !content) return NextResponse.json({ error: 'roomId, peerId and content are required' }, { status: 400 });

    const { data: self, error: selfErr } = await supabase.from('users').select('id').eq('whop_user_id', user.id).single();
    if (selfErr) return NextResponse.json({ error: 'User lookup failed' }, { status: 500 });

    const { data: ins, error: insErr } = await supabase
      .from('dm_messages')
      .insert({ room_id: roomId, sender_id: self.id, receiver_id: peerId, content })
      .select()
      .single();

    if (insErr) return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    return NextResponse.json({ message: ins }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

