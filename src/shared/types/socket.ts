import { Socket } from "socket.io";

// Types for messages
export interface Message {
  id?: string;
  from: string; // User ID
  to: string; // User ID o room ID
  content: string;
  type: "text" | "image" | "file" | "system";
  timestamp?: Date;
  read?: boolean;
  metadata?: Record<string, any>;
}

export interface ChatRoom {
  id: string;
  name?: string;
  participants: string[]; // User IDs
  type: "direct" | "group" | "channel";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SocketUser {
  userId: string;
  socketId: string;
  email: string;
  role: string;
  connectedAt: Date;
}

// Eventos del cliente al servidor
export interface ClientToServerEvents {
  // Mensajería
  "message:send": (data: Omit<Message, "id" | "timestamp">) => void;
  "message:read": (messageId: string) => void;
  "message:typing": (data: { to: string; isTyping: boolean }) => void;

  // Rooms
  "room:join": (roomId: string) => void;
  "room:leave": (roomId: string) => void;
  "room:create": (data: Omit<ChatRoom, "id" | "createdAt" | "updatedAt">) => void;

  // Presencia
  "presence:update": (data: { status: "online" | "away" | "offline" }) => void;

  // Custom events
  [key: string]: (...args: any[]) => void;
}

// Eventos del servidor al cliente
export interface ServerToClientEvents {
  // Mensajería
  "message:received": (message: Message) => void;
  "message:sent": (message: Message) => void;
  "message:read": (data: { messageId: string; readBy: string }) => void;
  "message:typing": (data: { from: string; isTyping: boolean }) => void;

  // Rooms
  "room:joined": (data: { roomId: string; user: SocketUser }) => void;
  "room:left": (data: { roomId: string; userId: string }) => void;
  "room:created": (room: ChatRoom) => void;
  "room:updated": (room: ChatRoom) => void;

  // Presencia
  "presence:update": (data: { userId: string; status: "online" | "away" | "offline" }) => void;
  "user:connected": (user: SocketUser) => void;
  "user:disconnected": (userId: string) => void;

  // Notificaciones
  "notification": (data: { type: string; message: string; data?: any }) => void;

  // Errores
  "error": (error: { message: string; code?: string }) => void;

  // Custom events
  [key: string]: (...args: any[]) => void;
}

// Datos del socket (interceptores)
export interface SocketData {
  user: SocketUser;
}

// Tipo de Socket con nuestros eventos
export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  any,
  SocketData
>;

