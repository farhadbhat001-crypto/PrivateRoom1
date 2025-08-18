'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AccessRoomPage() {
	const router = useRouter();
	const [roomId, setRoomId] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			const res = await fetch('/api/rooms/validate-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roomId: roomId.trim(), password: password.trim() }),
			});
			const data = await res.json();
			if (!res.ok || !data?.success) {
				setError(data?.error || 'Incorrect room ID or password');
				return;
			}
			router.push(`/rooms/${roomId.trim()}`);
		} catch (err) {
			setError('Something went wrong. Please try again.');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-a12">
			<div className="max-w-md mx-auto">
				<Card>
					<CardHeader>
						<CardTitle>Enter Room Password</CardTitle>
						<CardDescription>Enter your Room ID and password to join.</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={onSubmit} className="space-y-4">
							<div>
								<Label htmlFor="roomId">Room ID</Label>
								<Input id="roomId" value={roomId} onChange={(e) => setRoomId(e.target.value)} required />
							</div>
							<div>
								<Label htmlFor="password">Password</Label>
								<Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
							</div>
							{error ? (
								<p className="text-red-600 text-sm">{error}</p>
							) : null}
							<Button type="submit" disabled={submitting}>
								{submitting ? 'Checking...' : 'Join Room'}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

