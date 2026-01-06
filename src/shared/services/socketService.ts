import { getIO, emitToUser, emitToUsers, emitToRoom, broadcast } from "../config/socket";
import { Message, ChatRoom } from "../types/socket";
import { logInfo, logError } from "../utils/logger";
import { User } from "../../domain/users/models/userModel";

export class SocketService {
  // Enviar mensaje a un usuario
  async sendMessage(message: Message): Promise<void> {
    try {
      const io = getIO();

      // Emitir al destinatario
      emitToUser(message.to, "message:received", message);

      // Confirmar al remitente
      if (message.from) {
        emitToUser(message.from, "message:sent", message);
      }

      logInfo("Mensaje enviado via Socket.io", {
        from: message.from,
        to: message.to,
        type: message.type,
      });
    } catch (error) {
      logError("Error enviando mensaje via Socket.io:", error);
      throw error;
    }
  }

  // Enviar mensaje a múltiples usuarios
  async sendMessageToMany(userIds: string[], message: Omit<Message, "to">): Promise<void> {
    try {
      userIds.forEach((userId) => {
        emitToUser(userId, "message:received", {
          ...message,
          to: userId,
        } as Message);
      });

      logInfo("Mensaje enviado a múltiples usuarios via Socket.io", {
        from: message.from,
        recipients: userIds.length,
        type: message.type,
      });
    } catch (error) {
      logError("Error enviando mensaje a múltiples usuarios:", error);
      throw error;
    }
  }

  // Enviar mensaje a una room
  async sendMessageToRoom(roomId: string, message: Omit<Message, "to">): Promise<void> {
    try {
      emitToRoom(roomId, "message:received", {
        ...message,
        to: roomId,
      } as Message);

      logInfo("Mensaje enviado a room via Socket.io", {
        from: message.from,
        roomId,
        type: message.type,
      });
    } catch (error) {
      logError("Error enviando mensaje a room:", error);
      throw error;
    }
  }

  // Marcar mensaje como leído
  async markMessageAsRead(messageId: string, readBy: string, recipientId: string): Promise<void> {
    try {
      emitToUser(recipientId, "message:read", {
        messageId,
        readBy,
      });

      logInfo("Mensaje marcado como leído", {
        messageId,
        readBy,
        recipientId,
      });
    } catch (error) {
      logError("Error marcando mensaje como leído:", error);
      throw error;
    }
  }

  // Notificar que un usuario está escribiendo
  async notifyTyping(from: string, to: string, isTyping: boolean): Promise<void> {
    try {
      emitToUser(to, "message:typing", {
        from,
        isTyping,
      });
    } catch (error) {
      logError("Error notificando typing:", error);
    }
  }

  // Actualizar presencia de usuario
  async updatePresence(userId: string, status: "online" | "away" | "offline"): Promise<void> {
    try {
      broadcast("presence:update", {
        userId,
        status,
      });

      logInfo("Presencia actualizada", {
        userId,
        status,
      });
    } catch (error) {
      logError("Error actualizando presencia:", error);
    }
  }

  // Enviar notificación
  async sendNotification(
    userId: string,
    type: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      emitToUser(userId, "notification", {
        type,
        message,
        data,
      });

      logInfo("Notificación enviada via Socket.io", {
        userId,
        type,
      });
    } catch (error) {
      logError("Error enviando notificación:", error);
      throw error;
    }
  }

  // Enviar notificación a múltiples usuarios
  async sendNotificationToMany(
    userIds: string[],
    type: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      emitToUsers(userIds, "notification", {
        type,
        message,
        data,
      });

      logInfo("Notificación enviada a múltiples usuarios", {
        recipients: userIds.length,
        type,
      });
    } catch (error) {
      logError("Error enviando notificación a múltiples usuarios:", error);
      throw error;
    }
  }

  // Unir usuario a una room
  async joinRoom(userId: string, roomId: string): Promise<void> {
    try {
      const io = getIO();
      const user = await User.findById(userId).select("email role");

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      // Obtener todos los sockets del usuario
      const sockets = await io.in(`user:${userId}`).fetchSockets();

      sockets.forEach((socket) => {
        socket.join(roomId);
      });

      // Notificar a la room
      emitToRoom(roomId, "room:joined", {
        roomId,
        user: {
          userId: user._id.toString(),
          socketId: "",
          email: user.email,
          role: user.role,
          connectedAt: new Date(),
        },
      });

      logInfo("Usuario unido a room", {
        userId,
        roomId,
      });
    } catch (error) {
      logError("Error uniendo usuario a room:", error);
      throw error;
    }
  }

  // Sacar usuario de una room
  async leaveRoom(userId: string, roomId: string): Promise<void> {
    try {
      const io = getIO();
      const sockets = await io.in(`user:${userId}`).fetchSockets();

      sockets.forEach((socket) => {
        socket.leave(roomId);
      });

      emitToRoom(roomId, "room:left", {
        roomId,
        userId,
      });

      logInfo("Usuario salió de room", {
        userId,
        roomId,
      });
    } catch (error) {
      logError("Error sacando usuario de room:", error);
      throw error;
    }
  }

  // Obtener usuarios conectados en una room
  async getRoomUsers(roomId: string): Promise<string[]> {
    try {
      const io = getIO();
      const sockets = await io.in(roomId).fetchSockets();
      const userIds = new Set<string>();

      sockets.forEach((socket) => {
        const user = (socket as any).data?.user;
        if (user?.userId) {
          userIds.add(user.userId);
        }
      });

      return Array.from(userIds);
    } catch (error) {
      logError("Error obteniendo usuarios de room:", error);
      return [];
    }
  }
}

// Instancia singleton
export const socketService = new SocketService();

