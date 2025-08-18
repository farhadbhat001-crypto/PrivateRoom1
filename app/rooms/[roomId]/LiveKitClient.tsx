'use client';

import { useEffect, useMemo, useState } from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer, ControlBar, useTracks, TrackReferenceOrPlaceholder, ParticipantTile } from '@livekit/components-react';
import '@livekit/components-styles';
import { Button } from '@/components/ui/button';

const theme = {
  primary: '#0A1F44',
  secondary: '#00AEEF',
  accent: '#D7263D',
  dark: '#2E2E2E',
};

export default function LiveKitClient({ roomId, userId }: { roomId: string; userId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, password: 'validated-server-side-placeholder', userId }),
        });
        const data = await res.json();
        if (mounted && res.ok && data?.token) setToken(data.token);
      } catch (err) {
        console.error('Failed to get token', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [roomId, userId]);

  if (!serverUrl) {
    return <div className="text-white">LIVEKIT URL not configured</div>;
  }

  if (loading) {
    return <div className="text-white">Connecting...</div>;
  }

  if (!token) {
    return <div className="text-white">Unable to get token</div>;
  }

  return (
    <div style={{ backgroundColor: theme.primary }} className="rounded-md overflow-hidden">
      <LiveKitRoom
        video
        audio
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        style={{ height: '80vh' }}
      >
        {/* Prebuilt conference UI */}
        <VideoConference />
        <RoomAudioRenderer />
        <div className="p-2 border-t" style={{ borderColor: theme.dark }}>
          <ControlBar variation="minimal" />
        </div>
      </LiveKitRoom>
    </div>
  );
}

