import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { generateLiveKitToken } from "@/lib/livekit";
import { whopSdk } from "@/lib/whop-sdk";

interface CreateRoomRequestBody {
	roomId?: string;
}

interface CreateRoomSuccessResponse {
	success: true;
	roomId: string;
	token: string;
}

interface CreateRoomErrorResponse {
	success: false;
	error: string;
}

type CreateRoomResponse = CreateRoomSuccessResponse | CreateRoomErrorResponse;

export async function POST(request: NextRequest): Promise<NextResponse<CreateRoomResponse>> {
	try {
		// Validate environment variables
		const apiKey = process.env.LIVEKIT_API_KEY;
		const apiSecret = process.env.LIVEKIT_API_SECRET;
		const livekitUrl = process.env.LIVEKIT_URL;

		if (!apiKey || !apiSecret || !livekitUrl) {
			return NextResponse.json(
				{ success: false, error: "LiveKit configuration missing on server" },
				{ status: 500 },
			);
		}

		// Parse and validate request body
		let body: CreateRoomRequestBody;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json(
				{ success: false, error: "Invalid JSON body" },
				{ status: 400 },
			);
		}

		const roomId = typeof body.roomId === "string" ? body.roomId.trim() : "";
		if (!roomId) {
			return NextResponse.json(
				{ success: false, error: "roomId is required" },
				{ status: 400 },
			);
		}

		// Ensure user is authenticated (via Whop)
		const user = await whopSdk.getUser();
		if (!user?.id) {
			return NextResponse.json(
				{ success: false, error: "Authentication required" },
				{ status: 401 },
			);
		}

		// Ensure room exists (idempotent create)
		const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
		try {
			await svc.createRoom({ name: roomId });
		} catch (err: unknown) {
			// If room already exists, ignore; otherwise, bubble up
			const message = (err as Error).message || String(err);
			if (!/already exists/i.test(message)) {
				return NextResponse.json(
					{ success: false, error: "Failed to create LiveKit room" },
					{ status: 502 },
				);
			}
		}

		// Generate participant token
		const token = generateLiveKitToken(roomId, user.id);

		return NextResponse.json(
			{ success: true, roomId, token },
			{ status: 201 },
		);
	} catch (error) {
		console.error("/api/livekit/create-room error:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function GET(): Promise<NextResponse<CreateRoomResponse>> {
	return NextResponse.json(
		{ success: false, error: "Method not allowed" },
		{ status: 405 },
	);
}


