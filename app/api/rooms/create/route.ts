import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { whopSdk } from '@/lib/whop-sdk';

// Type definitions
interface CreateRoomRequest {
  roomName: string;
  price: number;
}

interface CreateRoomResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    price: number;
    creator_id: string;
    created_at: string;
    updated_at: string;
  };
  error?: string;
}

// Validation function
function validateCreateRoomRequest(body: any): { isValid: boolean; error?: string } {
  // Check if body exists
  if (!body) {
    return { isValid: false, error: 'Request body is required' };
  }

  // Check if roomName exists and is a string
  if (!body.roomName) {
    return { isValid: false, error: 'roomName is required' };
  }

  if (typeof body.roomName !== 'string') {
    return { isValid: false, error: 'roomName must be a string' };
  }

  // Check if roomName is not empty
  if (body.roomName.trim().length === 0) {
    return { isValid: false, error: 'roomName cannot be empty' };
  }

  // Check if roomName is not too long
  if (body.roomName.length > 255) {
    return { isValid: false, error: 'roomName must be less than 255 characters' };
  }

  // Check if price exists and is a number
  if (body.price === undefined || body.price === null) {
    return { isValid: false, error: 'price is required' };
  }

  if (typeof body.price !== 'number') {
    return { isValid: false, error: 'price must be a number' };
  }

  // Check if price is positive
  if (body.price <= 0) {
    return { isValid: false, error: 'price must be greater than 0' };
  }

  // Check if price is not too high (optional validation)
  if (body.price > 999999.99) {
    return { isValid: false, error: 'price must be less than 1,000,000' };
  }

  return { isValid: true };
}

// POST handler for creating a room
export async function POST(request: NextRequest): Promise<NextResponse<CreateRoomResponse>> {
  try {
    // Check if request method is POST
    if (request.method !== 'POST') {
      return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = validateCreateRoomRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Type assertion after validation
    const createRoomData: CreateRoomRequest = {
      roomName: body.roomName.trim(),
      price: body.price
    };

    // Get authenticated user from Whop
    const whopUser = await whopSdk.getUser();
    if (!whopUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      // Get or create user in Supabase
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('whop_user_id', whopUser.id)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user:', userError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch user data' },
          { status: 500 }
        );
      }

      // Create user if doesn't exist
      if (!user) {
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            whop_user_id: whopUser.id,
            email: whopUser.email
          })
          .select('id')
          .single();

        if (createUserError) {
          console.error('Error creating user:', createUserError);
          return NextResponse.json(
            { success: false, error: 'Failed to create user' },
            { status: 500 }
          );
        }

        user = newUser;
      }

      // Create room in Supabase
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: createRoomData.roomName,
          price: createRoomData.price,
          creator_id: user.id
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating room:', roomError);
        return NextResponse.json(
          { success: false, error: 'Failed to create room' },
          { status: 500 }
        );
      }

      // Return success response with created room data
      return NextResponse.json(
        {
          success: true,
          data: room
        },
        { status: 201 }
      );

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database operation failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in /api/rooms/create:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET(): Promise<NextResponse<CreateRoomResponse>> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse<CreateRoomResponse>> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse<CreateRoomResponse>> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
