import { AppSocket } from "../../../shared/types/socket";
import { socketService } from "../../../shared/services/socketService";
import { logInfo, logError } from "../../../shared/utils/logger";
import { Message } from "../../../shared/types/socket";

// Register messaging handlers
export const registerMessageHandlers = (socket: AppSocket) => {
  const user = socket.data.user;

  // Send message
  socket.on("message:send", async (data: Omit<Message, "id" | "timestamp">) => {
    try {
      const message: Message = {
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false,
      };

      // Validate that message has content
      if (!message.content || message.content.trim().length === 0) {
        socket.emit("error", {
          message: "Message cannot be empty",
          code: "INVALID_MESSAGE",
        });
        return;
      }

      // Send message
      await socketService.sendMessage(message);

      logInfo("Message sent", {
        from: user.userId,
        to: message.to,
        type: message.type,
      });
    } catch (error) {
      logError("Error in message:send:", error);
      socket.emit("error", {
        message: "Error sending message",
        code: "SEND_MESSAGE_ERROR",
      });
    }
  });

  // Mark message as read
  socket.on("message:read", async (messageId: string) => {
    try {
      await socketService.markMessageAsRead(messageId, user.userId, user.userId);
    } catch (error) {
      logError("Error in message:read:", error);
      socket.emit("error", {
        message: "Error marking message as read",
        code: "READ_MESSAGE_ERROR",
      });
    }
  });

  // Notify that user is typing
  socket.on("message:typing", async (data: { to: string; isTyping: boolean }) => {
    try {
      await socketService.notifyTyping(user.userId, data.to, data.isTyping);
    } catch (error) {
      logError("Error in message:typing:", error);
    }
  });
};

// Register room handlers
export const registerRoomHandlers = (socket: AppSocket) => {
  const user = socket.data.user;

  // Join a room
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
      logError("Error in room:join:", error);
      socket.emit("error", {
        message: "Error joining room",
        code: "JOIN_ROOM_ERROR",
      });
    }
  });

  // Leave a room
  socket.on("room:leave", async (roomId: string) => {
    try {
      await socketService.leaveRoom(user.userId, roomId);
      socket.emit("room:left", {
        roomId,
        userId: user.userId,
      });
    } catch (error) {
      logError("Error in room:leave:", error);
      socket.emit("error", {
        message: "Error leaving room",
        code: "LEAVE_ROOM_ERROR",
      });
    }
  });
};

// Register presence handlers
export const registerPresenceHandlers = (socket: AppSocket) => {
  const user = socket.data.user;

  // Update presence
  socket.on("presence:update", async (data: { status: "online" | "away" | "offline" }) => {
    try {
      await socketService.updatePresence(user.userId, data.status);
    } catch (error) {
      logError("Error in presence:update:", error);
    }
  });
};

// Register all handlers
export const registerAllHandlers = (socket: AppSocket) => {
  registerMessageHandlers(socket);
  registerRoomHandlers(socket);
  registerPresenceHandlers(socket);
};

