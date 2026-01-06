import { AppSocket } from "../../../shared/types/socket";
import { socketService } from "../../../shared/services/socketService";
import { logInfo, logError } from "../../../shared/utils/logger";
import { Message } from "../../../shared/types/socket";

// Registrar handlers de mensajería
export const registerMessageHandlers = (socket: AppSocket) => {
  const user = socket.data.user;

  // Enviar mensaje
  socket.on("message:send", async (data: Omit<Message, "id" | "timestamp">) => {
    try {
      const message: Message = {
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false,
      };

      // Validar que el mensaje tenga contenido
      if (!message.content || message.content.trim().length === 0) {
        socket.emit("error", {
          message: "El mensaje no puede estar vacío",
          code: "INVALID_MESSAGE",
        });
        return;
      }

      // Enviar mensaje
      await socketService.sendMessage(message);

      logInfo("Mensaje enviado", {
        from: user.userId,
        to: message.to,
        type: message.type,
      });
    } catch (error) {
      logError("Error en message:send:", error);
      socket.emit("error", {
        message: "Error enviando mensaje",
        code: "SEND_MESSAGE_ERROR",
      });
    }
  });

  // Marcar mensaje como leído
  socket.on("message:read", async (messageId: string) => {
    try {
      await socketService.markMessageAsRead(messageId, user.userId, user.userId);
    } catch (error) {
      logError("Error en message:read:", error);
      socket.emit("error", {
        message: "Error marcando mensaje como leído",
        code: "READ_MESSAGE_ERROR",
      });
    }
  });

  // Notificar que está escribiendo
  socket.on("message:typing", async (data: { to: string; isTyping: boolean }) => {
    try {
      await socketService.notifyTyping(user.userId, data.to, data.isTyping);
    } catch (error) {
      logError("Error en message:typing:", error);
    }
  });
};

// Registrar handlers de rooms
export const registerRoomHandlers = (socket: AppSocket) => {
  const user = socket.data.user;

  // Unirse a una room
  socket.on("room:join", async (roomId: string) => {
    try {
      await socketService.joinRoom(user.userId, roomId);
      socket.emit("room:joined", {
        roomId,
        user: {
          userId: user.userId,
          socketId: socket.id,
          email: user.email,
          role: user.role,
          connectedAt: user.connectedAt,
        },
      });
    } catch (error) {
      logError("Error en room:join:", error);
      socket.emit("error", {
        message: "Error uniéndose a la room",
        code: "JOIN_ROOM_ERROR",
      });
    }
  });

  // Salir de una room
  socket.on("room:leave", async (roomId: string) => {
    try {
      await socketService.leaveRoom(user.userId, roomId);
      socket.emit("room:left", {
        roomId,
        userId: user.userId,
      });
    } catch (error) {
      logError("Error en room:leave:", error);
      socket.emit("error", {
        message: "Error saliendo de la room",
        code: "LEAVE_ROOM_ERROR",
      });
    }
  });
};

// Registrar handlers de presencia
export const registerPresenceHandlers = (socket: AppSocket) => {
  const user = socket.data.user;

  // Actualizar presencia
  socket.on("presence:update", async (data: { status: "online" | "away" | "offline" }) => {
    try {
      await socketService.updatePresence(user.userId, data.status);
    } catch (error) {
      logError("Error en presence:update:", error);
    }
  });
};

// Registrar todos los handlers
export const registerAllHandlers = (socket: AppSocket) => {
  registerMessageHandlers(socket);
  registerRoomHandlers(socket);
  registerPresenceHandlers(socket);
};

