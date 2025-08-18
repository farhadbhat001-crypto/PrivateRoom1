import { NextRequest, NextResponse } from "next/server";
import { whopSdk } from "@/lib/whop-sdk";
import { supabase } from "@/lib/supabase";

interface StartCheckoutBody {
	roomId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	try {
		let body: StartCheckoutBody;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
		}

		const roomId = typeof body.roomId === "string" ? body.roomId.trim() : "";
		if (!roomId) {
			return NextResponse.json({ error: "roomId is required" }, { status: 400 });
		}

		// Ensure authenticated Whop user
		const user = await whopSdk.getUser();
		if (!user?.id) {
			return NextResponse.json({ error: "Authentication required" }, { status: 401 });
		}

		// Fetch room for price display/meta
		const { data: room, error } = await supabase
			.from("rooms")
			.select("id,name,price")
			.eq("id", roomId)
			.single();
		if (error || !room) {
			return NextResponse.json({ error: "Room not found" }, { status: 404 });
		}

		// TODO: Create a Whop checkout session here and pass metadata { room_id: roomId }
		// Placeholder URL until Whop checkout session creation is wired up
		const checkoutUrl = `https://whop.com/checkout`;

		return NextResponse.json(
			{
				checkoutUrl,
				room: { id: room.id, name: room.name, price: room.price },
			},
			{ status: 200 },
		);
	} catch (err) {
		console.error("/api/whop/checkout/start error", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}


