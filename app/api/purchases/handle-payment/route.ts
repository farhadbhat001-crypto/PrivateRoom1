import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { whopSdk } from '@/lib/whop-sdk';

type HandlePaymentBody = {
  userId?: string;       // Whop user id
  roomId?: string;       // UUID of room (Supabase rooms.id)
  paymentAmount?: number; // Amount in smallest currency unit (e.g., cents)
  currency?: string;     // Optional, default usd
  paymentId?: string;    // Optional idempotency key from Whop
};

type ApiResponse = { success: true } | { success: false; error: string };

function calculateFees(amount: number) {
  const platformFee = Math.round(amount * 0.2);
  const creatorShare = amount - platformFee;
  return { platformFee, creatorShare };
}

async function ensureAppUserId(whopUserId: string, email?: string | null) {
  // Find or create user in Supabase users table
  let { data: userRow, error: findErr } = await supabase
    .from('users')
    .select('id')
    .eq('whop_user_id', whopUserId)
    .single();

  if (findErr && (findErr as any).code !== 'PGRST116') {
    throw new Error('Failed to look up app user');
  }

  if (!userRow) {
    const { data: created, error: createErr } = await supabase
      .from('users')
      .insert({ whop_user_id: whopUserId, email: email ?? null })
      .select('id')
      .single();
    if (createErr) throw new Error('Failed to create app user');
    userRow = created;
  }

  return userRow.id as string;
}

async function creditPlatformFeeViaWhop(amount: number, currency: string) {
  // Use Whop API/SDK to credit the platform fee to the app's Whop account.
  // This uses a defensive call via any to accommodate SDK method naming differences across versions.
  // Replace with the official endpoint/method per your Whop account setup.
  const paymentsAny: any = (whopSdk as unknown as any).payments;

  if (!paymentsAny) {
    throw new Error('Whop payments API is not available in the current SDK');
  }

  // Try common method names; adjust to your environment if needed.
  if (typeof paymentsAny.createPayout === 'function') {
    // Example signature: createPayout({ amount, currency, destination: 'app' })
    await paymentsAny.createPayout({ amount, currency, destination: 'app' });
    return;
  }
  if (typeof paymentsAny.createTransfer === 'function') {
    // Example signature: createTransfer({ amount, currency, to: 'platform' })
    await paymentsAny.createTransfer({ amount, currency, to: 'platform' });
    return;
  }

  throw new Error('No supported payout method found on Whop SDK');
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    let body: HandlePaymentBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const whopUserId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const roomId = typeof body.roomId === 'string' ? body.roomId.trim() : '';
    const paymentAmount = typeof body.paymentAmount === 'number' ? body.paymentAmount : NaN;
    const currency = (typeof body.currency === 'string' && body.currency.trim()) || 'usd';
    const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : undefined;

    if (!whopUserId || !roomId || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ success: false, error: 'userId, roomId and positive paymentAmount are required' }, { status: 400 });
    }

    // Idempotency check (optional): if a paymentId is provided, check if already processed
    if (paymentId) {
      const { data: existing, error: existErr } = await supabase
        .from('purchases')
        .select('id, status')
        .eq('room_id', roomId)
        .eq('payment_id', paymentId)
        .maybeSingle();
      if (!existErr && existing && existing.status === 'completed') {
        return NextResponse.json({ success: true }, { status: 200 });
      }
    }

    // Ensure app user exists (maps Whop user -> internal user id)
    // Attempt to fetch the user’s email via Whop (non-fatal if fails)
    let email: string | null = null;
    try {
      const userRes = await whopSdk.users.getUser({ userId: whopUserId });
      email = userRes?.email ?? null;
    } catch {
      // ignore
    }

    const appUserId = await ensureAppUserId(whopUserId, email);

    const { platformFee, creatorShare } = calculateFees(paymentAmount);

    // Create purchase row with processing status
    const { data: createdPurchase, error: insertErr } = await supabase
      .from('purchases')
      .insert({
        user_id: appUserId,
        room_id: roomId,
        payment_amount: paymentAmount,
        platform_fee: platformFee,
        creator_share: creatorShare,
        currency,
        payment_id: paymentId ?? null,
        status: 'processing',
        revoked: false,
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('Insert purchase error', insertErr);
      return NextResponse.json({ success: false, error: 'Failed to create purchase record' }, { status: 500 });
    }

    const purchaseId = createdPurchase?.id as string;

    // Attempt to credit platform fee to Whop account
    try {
      await creditPlatformFeeViaWhop(platformFee, currency);
    } catch (payoutErr) {
      console.error('Whop platform fee credit failed', payoutErr);
      // Mark as failed and exit
      await supabase
        .from('purchases')
        .update({ status: 'failed' })
        .eq('id', purchaseId);
      return NextResponse.json({ success: false, error: 'Platform fee payout failed' }, { status: 502 });
    }

    // Mark purchase as completed
    const { error: updateErr } = await supabase
      .from('purchases')
      .update({ status: 'completed' })
      .eq('id', purchaseId);

    if (updateErr) {
      console.error('Update purchase status error', updateErr);
      return NextResponse.json({ success: false, error: 'Failed to finalize purchase' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('POST /api/purchases/handle-payment error', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

