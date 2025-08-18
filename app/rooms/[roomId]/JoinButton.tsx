'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function JoinButton({ roomId }: { roomId: string }) {
	const [isLoading, setIsLoading] = useState(false);

	async function onJoin() {
		setIsLoading(true);
		try {
			const res = await fetch('/api/whop/checkout/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roomId }),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data?.error || 'Failed to start checkout');
			}
			if (data?.checkoutUrl) {
				window.open(data.checkoutUrl, '_blank', 'noopener');
			}
		} catch (err) {
			console.error(err);
			alert('Could not start checkout');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Button onClick={onJoin} disabled={isLoading}>
			{isLoading ? 'Opening...' : 'Join Room'}
		</Button>
	);
}


