import { getIO, emitToUser, emitToUsers, emitToRoom, broadcast } from "../config/socket";
import { Message, ChatRoom } from "../types/socket";
import { logInfo, logError } from "../utils/logger";
import { User } from "../../domain/users/models/userModel";

export class SocketService {
  // Send message to a user
  async sendMessage(message: Message): Promise<void> {
    try {
      const io = getIO();

      // Emit to recipient
      emitToUser(message.to, "message:received", message);

      // Confirm to sender
      if (message.from) {
        emitToUser(message.from, "message:sent", message);
      }

      logInfo("Message sent via Socket.io", {
        from: message.from,
        to: message.to,
        type: message.type,
      });
    } catch (error) {
      logError("Error sending message via Socket.io:", error);
      throw error;
    }
  }

  // Send message to multiple users
  async sendMessageToMany(userIds: string[], message: Omit<Message, "to">): Promise<void> {
    try {
      userIds.forEach((userId) => {
        emitToUser(userId, "message:received", {
          ...message,
          to: userId,
        } as Message);
      });

      logInfo("Message sent to multiple users via Socket.io", {
        from: message.from,
        recipients: userIds.length,
        type: message.type,
      });
    } catch (error) {
      logError("Error sending message to multiple users:", error);
      throw error;
    }
  }

  // Send message to a room
  async sendMessageToRoom(roomId: string, message: Omit<Message, "to">): Promise<void> {
    try {
      emitToRoom(roomId, "message:received", {
        ...message,
        to: roomId,
      } as Message);

      logInfo("Message sent to room via Socket.io", {
        from: message.from,
        roomId,
        type: message.type,
      });
    } catch (error) {
      logError("Error sending message to room:", error);
      throw error;
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId: string, readBy: string, recipientId: string): Promise<void> {
    try {
      emitToUser(recipientId, "message:read", {
        messageId,
        readBy,
      });

      logInfo("Message marked as read", {
        messageId,
        readBy,
        recipientId,
      });
    } catch (error) {
      logError("Error marking message as read:", error);
      throw error;
    }
  }

  // Notify that a user is typing
  async notifyTyping(from: string, to: string, isTyping: boolean): Promise<void> {
    try {
      emitToUser(to, "message:typing", {
        from,
        isTyping,
      });
    } catch (error) {
      logError("Error notifying typing:", error);
    }
  }

  // Update user presence
  async updatePresence(userId: string, status: "online" | "away" | "offline"): Promise<void> {
    try {
      broadcast("presence:update", {
        userId,
        status,
      });

      logInfo("Presence updated", {
        userId,
        status,
      });
    } catch (error) {
      logError("Error updating presence:", error);
    }
  }

  // Send notification
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

      logInfo("Notification sent via Socket.io", {
        userId,
        type,
      });
    } catch (error) {
      logError("Error sending notification:", error);
      throw error;
    }
  }

  // Send notification to multiple users
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

      logInfo("Notification sent to multiple users", {
        recipients: userIds.length,
        type,
      });
    } catch (error) {
      logError("Error sending notification to multiple users:", error);
      throw error;
    }
  }

  // Join user to a room
  async joinRoom(userId: string, roomId: string): Promise<void> {
    try {
      const io = getIO();
      const user = await User.findById(userId).select("email role");

      if (!user) {
        throw new Error("User not found");
      }

      // Get all user sockets
      const sockets = await io.in(`user:${userId}`).fetchSockets();

      sockets.forEach((socket) => {
        socket.join(roomId);
      });

      // Notify the room
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

      logInfo("User joined room", {
        userId,
        roomId,
      });
    } catch (error) {
      logError("Error joining user to room:", error);
      throw error;
    }
  }

  // Remove user from a room
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

      logInfo("User left room", {
        userId,
        roomId,
      });
    } catch (error) {
      logError("Error removing user from room:", error);
      throw error;
    }
  }

  // Get connected users in a room
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
      logError("Error getting room users:", error);
      return [];
    }
  }
}

// Singleton instance
export const socketService = new SocketService();

