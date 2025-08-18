'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, DollarSign, Calendar, User, Settings, Trash2 } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import RoomManagementPanel from '@/components/rooms/RoomManagementPanel';

// Theme colors
const theme = {
  primary: '#0A1F44',
  secondary: '#00AEEF', 
  accent: '#D7263D',
  dark: '#2E2E2E'
};

// Placeholder room type
interface Room {
  id: string;
  name: string;
  price: number;
  createdAt: string;
  creatorName: string;
  isActive: boolean;
}

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  });

  // Purchases management
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
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState<boolean>(true);

  // Placeholder data for demonstration
  const placeholderRooms: Room[] = [
    {
      id: '1',
      name: 'VIP Lounge',
      price: 99.99,
      createdAt: '2024-01-15T10:30:00Z',
      creatorName: 'John Doe',
      isActive: true
    },
    {
      id: '2', 
      name: 'Premium Access',
      price: 49.99,
      createdAt: '2024-01-10T14:20:00Z',
      creatorName: 'John Doe',
      isActive: true
    }
  ];

  // Fetch rooms on component mount
  useEffect(() => {
    // Simulate API call with placeholder data
    setTimeout(() => {
      setRooms(placeholderRooms);
      setLoading(false);
    }, 1000);

    // Load purchases (real API)
    void (async () => {
      try {
        const res = await fetch('/api/creator/purchases');
        if (res.ok) {
          const data = await res.json();
          setPurchases(Array.isArray(data.purchases) ? data.purchases : []);
        }
      } catch (err) {
        console.error('Failed to load purchases', err);
      } finally {
        setLoadingPurchases(false);
      }
    })();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    // Simulate API call
    setTimeout(() => {
      const newRoom: Room = {
        id: Date.now().toString(),
        name: formData.name,
        price: parseFloat(formData.price),
        createdAt: new Date().toISOString(),
        creatorName: 'John Doe',
        isActive: true
      };
      
      setRooms([newRoom, ...rooms]);
      setFormData({ name: '', price: '' });
      setShowCreateForm(false);
      setCreating(false);
    }, 1000);
  };

  if (loading) {
    return (
      <DashboardShell title="Creator Dashboard" description="Manage your private rooms and track payments">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 mx-auto" style={{ borderColor: theme.secondary }}></div>
          <p className="mt-4 text-white">Loading dashboard...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Creator Dashboard" description="Manage your private rooms and track payments">

        {/* Create Room Section */}
        <Card className="mb-8" style={{ backgroundColor: theme.primary, borderColor: theme.secondary }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#FFFFFF' }}>
              <Plus className="h-5 w-5" style={{ color: theme.secondary }} />
              Create New Room
            </CardTitle>
            <CardDescription style={{ color: '#FFFFFF' }}>
              Create a new paid room that users can access after payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showCreateForm ? (
              <Button 
                onClick={() => setShowCreateForm(true)}
                style={{ backgroundColor: theme.secondary, borderColor: theme.secondary }}
                className="hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            ) : (
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <Label htmlFor="name" style={{ color: '#FFFFFF' }}>Room Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter room name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="border-0 focus:outline-none"
                  />
                </div>
                <div>
                  <Label htmlFor="price" style={{ color: '#FFFFFF' }}>Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="20.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="border-0 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={creating}
                    style={{ backgroundColor: theme.secondary, borderColor: theme.secondary }}
                    className="hover:opacity-90"
                  >
                    {creating ? 'Creating...' : 'Create Room'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                    style={{ borderColor: theme.accent, color: theme.accent, backgroundColor: 'transparent' }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Rooms List */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-6">Your Rooms</h2>
          
          {rooms.length === 0 ? (
            <Card style={{ backgroundColor: theme.primary, borderColor: theme.secondary }}>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12" style={{ color: theme.secondary }}>
                    <User className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium" style={{ color: '#FFFFFF' }}>No rooms yet</h3>
                  <p className="mt-1 text-sm" style={{ color: '#FFFFFF' }}>
                    Get started by creating your first room.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card key={room.id} style={{ backgroundColor: theme.primary, borderColor: theme.secondary }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" style={{ color: '#FFFFFF' }}>{room.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" style={{ color: theme.secondary }}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" style={{ color: theme.accent }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription style={{ color: '#FFFFFF' }}>
                      Created on {new Date(room.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4" style={{ color: theme.secondary }} />
                        <span className="font-medium" style={{ color: '#FFFFFF' }}>
                          ${room.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#FFFFFF' }}>
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#FFFFFF' }}>
                        <User className="h-4 w-4" />
                        <span>{room.creatorName}</span>
                      </div>
                      <div className="pt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          room.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {room.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Room Management Panel - Purchases */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-white mb-6">Room Management Panel</h2>
          <RoomManagementPanel />
        </div>
      </DashboardShell>
  );
}
