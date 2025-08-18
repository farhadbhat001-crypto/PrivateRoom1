import JoinButton from "./JoinButton";
import LiveKitClient from "./LiveKitClient";
import ChatPanel from "./ChatPanel";

export default async function RoomPage({
	params,
}: {
	params: Promise<{ roomId: string }>;
}) {
	const { roomId } = await params;
	return (
		<div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
			<h1 className="text-3xl font-bold">Room {roomId}</h1>
			<JoinButton roomId={roomId} />
			{/* Replace userId with real authenticated user id after auth integration */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<LiveKitClient roomId={roomId} userId="placeholder-user" />
				</div>
				<div className="lg:col-span-1">
					<ChatPanel roomId={roomId} selfUserId="placeholder-user" />
				</div>
			</div>
		</div>
	);
}
