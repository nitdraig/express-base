import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { ENV } from "./env";
import { verifyJWT } from "../utils/jwtUtils";
import { logInfo, logError } from "../utils/logger";
import { User } from "../../domain/users/models/userModel";
import { AppSocket, SocketUser } from "../types/socket";
import { registerAllHandlers } from "../../domain/messaging/handlers/socketHandlers";

let io: SocketIOServer | null = null;

// Initialize Socket.io
export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ENV.FRONTEND_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket: AppSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT
      const decoded = verifyJWT(token);

      // Find user in database
      const user = await User.findById(decoded.id).select("-password");

      if (!user || !user.isActive) {
        return next(new Error("Authentication error: User not found or inactive"));
      }

      // Add user information to socket
      socket.data.user = {
        userId: user._id.toString(),
        socketId: socket.id,
        email: user.email,
        role: user.role,
        connectedAt: new Date(),
      };

      logInfo("User authenticated in Socket.io", {
        userId: user._id.toString(),
        email: user.email,
        socketId: socket.id,
      });

      next();
    } catch (error) {
      logError("Error authenticating socket:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Handle connections
  io.on("connection", (socket: AppSocket) => {
    const user = socket.data.user;

    logInfo("Client connected to Socket.io", {
      userId: user.userId,
      socketId: socket.id,
    });

    // Join user to their personal room
    socket.join(`user:${user.userId}`);

    // Register all handlers
    registerAllHandlers(socket);

    // Notify other users that this user is online
    socket.broadcast.emit("user:connected", {
      userId: user.userId,
      socketId: socket.id,
      email: user.email,
      role: user.role,
      connectedAt: user.connectedAt,
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logInfo("Client disconnected from Socket.io", {
        userId: user.userId,
        socketId: socket.id,
        reason,
      });

      // Notify other users that this user is offline
      socket.broadcast.emit("user:disconnected", user.userId);
    });

    // Handle errors
    socket.on("error", (error) => {
      logError("Error in socket:", error);
      socket.emit("error", {
        message: "An error occurred",
        code: "SOCKET_ERROR",
      });
    });
  });

  return io;
};

// Get Socket.io instance
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io has not been initialized. Call initializeSocket first.");
  }
  return io;
};

// Helper to emit to a specific user
export const emitToUser = (userId: string, event: string, data: any) => {
  const socketIO = getIO();
  socketIO.to(`user:${userId}`).emit(event, data);
};

// Helper to emit to multiple users
export const emitToUsers = (userIds: string[], event: string, data: any) => {
  const socketIO = getIO();
  userIds.forEach((userId) => {
    socketIO.to(`user:${userId}`).emit(event, data);
  });
};

// Helper to emit to a room
export const emitToRoom = (roomId: string, event: string, data: any) => {
  const socketIO = getIO();
  socketIO.to(roomId).emit(event, data);
};

// Helper to broadcast to all except sender
export const broadcast = (event: string, data: any, excludeSocketId?: string) => {
  const socketIO = getIO();
  if (excludeSocketId) {
    socketIO.except(excludeSocketId).emit(event, data);
  } else {
    socketIO.emit(event, data);
  }
};

