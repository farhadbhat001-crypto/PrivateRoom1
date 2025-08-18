import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
	// Throw synchronously so misconfiguration is obvious during boot
	throw new Error(
		"Missing LiveKit configuration. Please set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in your environment.",
	);
}

/**
 * Generates a JWT for a user to join a specific LiveKit room.
 * The token grants join, publish and subscribe permissions for that room.
 */
export function generateLiveKitToken(roomId: string, userId: string): string {
	if (!roomId || !userId) {
		throw new Error("roomId and userId are required to generate a LiveKit token");
	}

	const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
		identity: userId,
	});

	at.addGrant({
		room: roomId,
		roomJoin: true,
		canPublish: true,
		canSubscribe: true,
	});

	return at.toJwt();
}

