'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { theme } from '@/lib/theme';

interface Purchase {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userEmail: string | null;
  password: string;
  revoked: boolean;
  createdAt: string;
}

export default function RoomManagementPanel() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/creator/purchases');
        if (res.ok) {
          const data = await res.json();
          if (mounted) setPurchases(Array.isArray(data.purchases) ? data.purchases : []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Card style={{ backgroundColor: theme.primary, borderColor: theme.secondary }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#FFFFFF' }}>
          Purchases
        </CardTitle>
        <CardDescription style={{ color: '#FFFFFF' }}>
          View users who purchased access, their passwords, and revoke access when needed
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm" style={{ color: '#FFFFFF' }}>Loading purchases...</p>
        ) : purchases.length === 0 ? (
          <p className="text-sm" style={{ color: '#FFFFFF' }}>No purchases yet.</p>
        ) : (
          <div className="space-y-4">
            {purchases.map((p) => (
              <div key={p.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border rounded-md p-3">
                <div className="space-y-1">
                  <div className="text-sm" style={{ color: '#FFFFFF' }}>
                    Room: <span className="font-medium">{p.roomName}</span>
                  </div>
                  <div className="text-sm" style={{ color: '#FFFFFF' }}>
                    User: <span className="font-medium">{p.userEmail ?? p.userId}</span>
                  </div>
                  <div className="text-sm" style={{ color: '#FFFFFF' }}>
                    Password: <span className="font-mono">{p.password}</span>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.revoked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {p.revoked ? 'Revoked' : 'Active'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    style={{ borderColor: theme.accent, color: theme.accent, backgroundColor: 'transparent' }}
                    disabled={p.revoked}
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/creator/purchases/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ purchaseId: p.id }) });
                        if (res.ok) setPurchases((prev) => prev.map((x) => (x.id === p.id ? { ...x, revoked: true } : x)));
                      } catch {}
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke Password
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
