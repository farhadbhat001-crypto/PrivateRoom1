'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const theme = { primary: '#0A1F44', secondary: '#00AEEF', accent: '#D7263D', dark: '#2E2E2E' };

type RoomMessage = { id: string; user_id: string; content: string; created_at: string };

type DmMessage = { id: string; sender_id: string; receiver_id: string; content: string; created_at: string };

type Tab = 'chat' | 'dm';

export default function ChatPanel({ roomId, selfUserId }: { roomId: string; selfUserId: string }) {
  const [tab, setTab] = useState<Tab>('chat');
  const [chatMessages, setChatMessages] = useState<RoomMessage[]>([]);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [peerId, setPeerId] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        if (tab === 'chat') {
          const res = await fetch(`/api/chat/room?roomId=${encodeURIComponent(roomId)}`);
          const data = await res.json();
          if (active && res.ok) setChatMessages(data.messages || []);
        } else {
          if (!peerId) return;
          const res = await fetch(`/api/chat/dm?roomId=${encodeURIComponent(roomId)}&peerId=${encodeURIComponent(peerId)}`);
          const data = await res.json();
          if (active && res.ok) setDmMessages(data.messages || []);
        }
      } catch {}
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [tab, roomId, peerId]);

  async function send() {
    const content = input.trim();
    if (!content) return;
    try {
      if (tab === 'chat') {
        const res = await fetch('/api/chat/room', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, content }) });
        const data = await res.json();
        if (res.ok) setChatMessages((prev) => [...prev, data.message]);
      } else if (peerId) {
        const res = await fetch('/api/chat/dm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, peerId, content }) });
        const data = await res.json();
        if (res.ok) setDmMessages((prev) => [...prev, data.message]);
      }
    } finally {
      setInput('');
    }
  }

  return (
    <Card style={{ backgroundColor: theme.primary, borderColor: theme.secondary }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg" style={{ color: '#FFFFFF' }}>Chat</CardTitle>
          <div className="flex gap-2">
            <Button variant={tab === 'chat' ? undefined : 'outline'} onClick={() => setTab('chat')} style={tab === 'chat' ? { backgroundColor: theme.secondary, borderColor: theme.secondary } : {}}>
              Global Chat
            </Button>
            <Button variant={tab === 'dm' ? undefined : 'outline'} onClick={() => setTab('dm')} style={tab === 'dm' ? { backgroundColor: theme.secondary, borderColor: theme.secondary } : {}}>
              Direct Messages
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'dm' && (
          <div className="mb-3">
            <Input placeholder="Enter Peer User ID" value={peerId} onChange={(e) => setPeerId(e.target.value)} />
          </div>
        )}
        <div className="h-64 overflow-y-auto border rounded p-3 mb-3" style={{ borderColor: theme.dark, color: '#FFFFFF' }}>
          {loading ? (
            <div className="text-sm" style={{ color: '#FFFFFF' }}>Loading...</div>
          ) : tab === 'chat' ? (
            chatMessages.length === 0 ? <div className="text-sm" style={{ color: '#FFFFFF' }}>No messages yet.</div> : (
              <ul className="space-y-2">
                {chatMessages.map((m) => (
                  <li key={m.id}><span className="text-xs text-gray-500">{new Date(m.created_at).toLocaleTimeString()} </span>{m.content}</li>
                ))}
              </ul>
            )
          ) : (
            dmMessages.length === 0 ? <div className="text-sm" style={{ color: '#FFFFFF' }}>No messages yet.</div> : (
              <ul className="space-y-2">
                {dmMessages.map((m) => (
                  <li key={m.id}><span className="text-xs text-gray-500">{new Date(m.created_at).toLocaleTimeString()} </span>{m.content}</li>
                ))}
              </ul>
            )
          )}
        </div>
        <div className="flex gap-2">
          <Input placeholder={tab === 'chat' ? 'Message the room...' : 'Message your peer...'} value={input} onChange={(e) => setInput(e.target.value)} />
          <Button onClick={send} style={{ backgroundColor: theme.secondary, borderColor: theme.secondary }}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}
