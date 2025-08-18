import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { whopSdk } from '@/lib/whop-sdk';

interface PurchaseDTO {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userEmail: string | null;
  password: string;
  revoked: boolean;
  createdAt: string;
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    // Auth via Whop (creator)
    const user = await whopSdk.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Resolve app user id in Supabase
    const { data: creatorRow, error: creatorErr } = await supabase
      .from('users')
      .select('id, email')
      .eq('whop_user_id', user.id)
      .single();

    if (creatorErr) {
      // If no row, there's nothing to list
      if ((creatorErr as any).code === 'PGRST116') {
        return NextResponse.json({ purchases: [] }, { status: 200 });
      }
      console.error('creator lookup error', creatorErr);
      return NextResponse.json({ error: 'Failed to resolve creator' }, { status: 500 });
    }

    // Fetch rooms owned by creator
    const { data: rooms, error: roomsErr } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('creator_id', creatorRow.id);

    if (roomsErr) {
      console.error('rooms query error', roomsErr);
      return NextResponse.json({ error: 'Failed to load rooms' }, { status: 500 });
    }

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ purchases: [] }, { status: 200 });
    }

    const roomIdToName = new Map<string, string>(rooms.map(r => [r.id, r.name as string]));
    const roomIds = rooms.map(r => r.id);

    // Fetch purchases for these rooms
    const { data: purchases, error: purchasesErr } = await supabase
      .from('purchases')
      .select('id, user_id, room_id, password, revoked, created_at')
      .in('room_id', roomIds)
      .order('created_at', { ascending: false });

    if (purchasesErr) {
      console.error('purchases query error', purchasesErr);
      return NextResponse.json({ error: 'Failed to load purchases' }, { status: 500 });
    }

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({ purchases: [] }, { status: 200 });
    }

    // Fetch distinct users for email lookup
    const userIds = Array.from(new Set(purchases.map(p => p.user_id)));
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    if (usersErr) {
      console.error('users query error', usersErr);
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }

    const userIdToEmail = new Map<string, string | null>((users || []).map(u => [u.id, u.email ?? null]));

    const result: PurchaseDTO[] = purchases.map(p => ({
      id: p.id as string,
      roomId: p.room_id as string,
      roomName: roomIdToName.get(p.room_id as string) || 'Unknown',
      userId: p.user_id as string,
      userEmail: userIdToEmail.get(p.user_id as string) ?? null,
      password: p.password as string,
      revoked: Boolean(p.revoked),
      createdAt: p.created_at as string,
    }));

    return NextResponse.json({ purchases: result }, { status: 200 });
  } catch (err) {
    console.error('GET /api/creator/purchases error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



