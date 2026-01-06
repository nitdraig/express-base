import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { ENV } from "./env";
import { verifyJWT } from "../utils/jwtUtils";
import { logInfo, logError } from "../utils/logger";
import { User } from "../../domain/users/models/userModel";
import { AppSocket, SocketUser } from "../types/socket";
import { registerAllHandlers } from "../../domain/messaging/handlers/socketHandlers";

let io: SocketIOServer | null = null;

// Inicializar Socket.io
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

  // Middleware de autenticación
  io.use(async (socket: AppSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verificar JWT
      const decoded = verifyJWT(token);

      // Buscar usuario en la base de datos
      const user = await User.findById(decoded.id).select("-password");

      if (!user || !user.isActive) {
        return next(new Error("Authentication error: User not found or inactive"));
      }

      // Agregar información del usuario al socket
      socket.data.user = {
        userId: user._id.toString(),
        socketId: socket.id,
        email: user.email,
        role: user.role,
        connectedAt: new Date(),
      };

      logInfo("Usuario autenticado en Socket.io", {
        userId: user._id.toString(),
        email: user.email,
        socketId: socket.id,
      });

      next();
    } catch (error) {
      logError("Error autenticando socket:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Manejar conexiones
  io.on("connection", (socket: AppSocket) => {
    const user = socket.data.user;

    logInfo("Cliente conectado a Socket.io", {
      userId: user.userId,
      socketId: socket.id,
    });

    // Unir al usuario a su room personal
    socket.join(`user:${user.userId}`);

    // Registrar todos los handlers
    registerAllHandlers(socket);

    // Notificar a otros usuarios que este usuario está online
    socket.broadcast.emit("user:connected", {
      userId: user.userId,
      socketId: socket.id,
      email: user.email,
      role: user.role,
      connectedAt: user.connectedAt,
    });

    // Manejar desconexión
    socket.on("disconnect", (reason) => {
      logInfo("Cliente desconectado de Socket.io", {
        userId: user.userId,
        socketId: socket.id,
        reason,
      });

      // Notificar a otros usuarios que este usuario está offline
      socket.broadcast.emit("user:disconnected", user.userId);
    });

    // Manejar errores
    socket.on("error", (error) => {
      logError("Error en socket:", error);
      socket.emit("error", {
        message: "An error occurred",
        code: "SOCKET_ERROR",
      });
    });
  });

  return io;
};

// Obtener instancia de Socket.io
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io no ha sido inicializado. Llama a initializeSocket primero.");
  }
  return io;
};

// Helper para emitir a un usuario específico
export const emitToUser = (userId: string, event: string, data: any) => {
  const socketIO = getIO();
  socketIO.to(`user:${userId}`).emit(event, data);
};

// Helper para emitir a múltiples usuarios
export const emitToUsers = (userIds: string[], event: string, data: any) => {
  const socketIO = getIO();
  userIds.forEach((userId) => {
    socketIO.to(`user:${userId}`).emit(event, data);
  });
};

// Helper para emitir a una room
export const emitToRoom = (roomId: string, event: string, data: any) => {
  const socketIO = getIO();
  socketIO.to(roomId).emit(event, data);
};

// Helper para emitir a todos excepto al emisor
export const broadcast = (event: string, data: any, excludeSocketId?: string) => {
  const socketIO = getIO();
  if (excludeSocketId) {
    socketIO.except(excludeSocketId).emit(event, data);
  } else {
    socketIO.emit(event, data);
  }
};

