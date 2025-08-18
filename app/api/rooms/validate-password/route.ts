import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Body { roomId?: string; password?: string }

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: Body;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }); }

    const roomId = typeof body.roomId === 'string' ? body.roomId.trim() : '';
    const password = typeof body.password === 'string' ? body.password.trim() : '';

    if (!roomId || !password) {
      return NextResponse.json({ success: false, error: 'roomId and password are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('purchases')
      .select('id')
      .eq('room_id', roomId)
      .eq('password', password)
      .eq('revoked', false)
      .maybeSingle();

    if (error) {
      console.error('validate-password query error', error);
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('validate-password error', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

