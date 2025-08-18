import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { supabase } from "@/lib/supabase";

const validateWebhook = makeWebhookValidator({
	webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

export async function POST(request: NextRequest): Promise<Response> {
	// Validate the webhook to ensure it's from Whop
	const webhookData = await validateWebhook(request);

	// Handle the webhook event
	if (webhookData.action === "payment.succeeded") {
		const { id, final_amount, amount_after_fees, currency, user_id, metadata } =
			webhookData.data as {
				id: string;
				final_amount: number;
				amount_after_fees: number | null | undefined;
				currency: string;
				user_id: string | null | undefined;
				metadata?: Record<string, unknown> | null;
			};

		// final_amount is the amount the user paid
		// amount_after_fees is the amount that is received by you, after card fees and processing fees are taken out

		console.log(
			`Payment ${id} succeeded for ${user_id} with amount ${final_amount} ${currency}`,
		);

		// if you need to do work that takes a long time, use waitUntil to run it in the background
		waitUntil(
			potentiallyLongRunningHandler({
				userId: user_id ?? undefined,
				amount: final_amount,
				currency,
				amountAfterFees: amount_after_fees ?? undefined,
				metadata: metadata ?? undefined,
			}),
		);
	}

	// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
	return new Response("OK", { status: 200 });
}
type LongTaskArgs = {
	userId?: string;
	amount: number;
	currency: string;
	amountAfterFees?: number;
	metadata?: Record<string, unknown>;
};

async function potentiallyLongRunningHandler(args: LongTaskArgs) {
	try {
		const { userId, metadata } = args;
		if (!userId) return;

		// Expect the room id to be forwarded as metadata when creating checkout
		const roomId = typeof metadata?.room_id === "string" ? metadata!.room_id : undefined;
		if (!roomId) {
			// No room context; nothing to persist
			return;
		}

		// Ensure user exists in Supabase users table
		let { data: dbUser, error: findErr } = await supabase
			.from("users")
			.select("id")
			.eq("whop_user_id", userId)
			.single();

		if (findErr && findErr.code !== "PGRST116") {
			console.error("webhook: find user error", findErr);
			return;
		}

		if (!dbUser) {
			const { data: created, error: createErr } = await supabase
				.from("users")
				.insert({ whop_user_id: userId })
				.select("id")
				.single();
			if (createErr) {
				console.error("webhook: create user error", createErr);
				return;
			}
			dbUser = created;
		}

		// Generate unique password and unique access token, then upsert purchase
		const password = crypto.randomBytes(4).toString("hex").toUpperCase();
		const accessToken = crypto.randomBytes(16).toString("hex");
		const { error: upsertErr } = await supabase
			.from("purchases")
			.upsert(
				[
					{
						user_id: dbUser.id,
						room_id: roomId,
						password,
						access_token: accessToken,
						revoked: false,
					},
				],
				{ onConflict: "user_id,room_id" },
			);
		if (upsertErr) {
			console.error("webhook: upsert purchase error", upsertErr);
		}
	} catch (err) {
		console.error("webhook long task error", err);
	}
}
