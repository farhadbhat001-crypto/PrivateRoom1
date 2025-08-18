export interface Room {
  id: string;
  name: string;
  price: number;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  password?: string;
  isActive: boolean;
}

export interface CreateRoomRequest {
  name: string;
  price: number;
}

export interface CreateRoomResponse {
  room: Room;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
}
