import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const token = req.nextUrl.searchParams.get('token')?.trim() || '';
    if (!token) return NextResponse.json({ error: 'token is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('purchases')
      .select('room_id, password, revoked')
      .eq('access_token', token)
      .maybeSingle();

    if (error) return NextResponse.json({ error: 'Server error' }, { status: 500 });
    if (!data || data.revoked) return NextResponse.json({ error: 'Invalid or revoked token' }, { status: 404 });

    return NextResponse.json({ roomId: data.room_id, password: data.password }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




