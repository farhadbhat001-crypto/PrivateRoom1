import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { whopSdk } from '@/lib/whop-sdk';

interface Body { purchaseId?: string }

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await whopSdk.getUser();
    if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    let body: Body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const purchaseId = typeof body.purchaseId === 'string' ? body.purchaseId.trim() : '';
    if (!purchaseId) return NextResponse.json({ error: 'purchaseId is required' }, { status: 400 });

    // Resolve creator app user id
    const { data: creatorRow, error: creatorErr } = await supabase
      .from('users')
      .select('id')
      .eq('whop_user_id', user.id)
      .single();

    if (creatorErr || !creatorRow) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    // Ensure purchase belongs to a room owned by the creator
    const { data: purchase, error: purchaseErr } = await supabase
      .from('purchases')
      .select('id, room_id, revoked')
      .eq('id', purchaseId)
      .single();

    if (purchaseErr || !purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('id, creator_id')
      .eq('id', purchase.room_id)
      .single();

    if (roomErr || !room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    if (room.creator_id !== creatorRow.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Revoke
    const { error: updateErr } = await supabase
      .from('purchases')
      .update({ revoked: true })
      .eq('id', purchaseId);

    if (updateErr) return NextResponse.json({ error: 'Failed to revoke' }, { status: 500 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('POST /api/creator/purchases/revoke error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

