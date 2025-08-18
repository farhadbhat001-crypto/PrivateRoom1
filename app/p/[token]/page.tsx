'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PurchaseLinkPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) return;
      try {
        const res = await fetch(`/api/purchases/resolve?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Invalid link');
        if (!active) return;
        // Redirect to access page with prefill query
        router.replace(`/rooms/access?roomId=${encodeURIComponent(data.roomId)}&password=${encodeURIComponent(data.password)}`);
      } catch (err: any) {
        if (active) setError(err?.message || 'Something went wrong');
      }
    })();
    return () => { active = false; };
  }, [token, router]);

  if (error) return <div className="p-6">{error}</div>;
  return <div className="p-6">Loading...</div>;
}



