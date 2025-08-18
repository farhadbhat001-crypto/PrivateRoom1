import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';
import { Room, CreateRoomRequest } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const DATA_FILE = path.join(process.cwd(), 'data', 'rooms.json');

// Helper function to read rooms data
async function readRoomsData(): Promise<{ rooms: Room[] }> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { rooms: [] };
  }
}

// Helper function to write rooms data
async function writeRoomsData(data: { rooms: Room[] }) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Generate a random password
function generatePassword(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// GET /api/rooms - Get all rooms for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get user from Whop session
    const user = await whopSdk.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rooms } = await readRoomsData();
    const userRooms = rooms.filter(room => room.creatorId === user.id);

    return NextResponse.json({ rooms: userRooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    // Get user from Whop session
    const user = await whopSdk.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateRoomRequest = await request.json();
    const { name, price } = body;

    if (!name || !price || price <= 0) {
      return NextResponse.json({ error: 'Invalid room data' }, { status: 400 });
    }

    const password = generatePassword();
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name,
      price,
      creatorId: user.id,
      creatorName: user.username || user.email || 'Unknown',
      createdAt: new Date().toISOString(),
      password,
      isActive: true,
    };

    const { rooms } = await readRoomsData();
    rooms.push(newRoom);
    await writeRoomsData({ rooms });

    return NextResponse.json({ 
      room: newRoom, 
      password 
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
