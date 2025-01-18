import WebSocket from "ws";
import http from "http";
import ChatService from "./chatservice";
import jwt from "jsonwebtoken";
import { verifyAuthToken } from "../utils/helpers";

export const UserInfo = new Map<string, WebSocket>();
class WebSocketServer {
  private wss: WebSocket.Server;
  private chatService: ChatService;

  constructor(server: http.Server) {
    this.wss = new WebSocket.Server({ server });
    this.chatService = new ChatService();
    this.initializeWebSocketHandlers();
  }

  private initializeWebSocketHandlers() {
    this.wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
      const userId = this.extractUserIdFromRequest(req, ws);

      if (!userId) {
        ws.close();
        return;
      }

      UserInfo.set(userId, ws);

      ws.on("message", async (message: string) => {
        try {
          const parsedMessage = JSON.parse(message);

          switch (parsedMessage.type) {
            case "send_message":
              await this.handleSendMessage(parsedMessage, userId);
              break;
            case "mark_read":
              await this.handleMarkMessageRead(parsedMessage, userId);
              break;
            case "get_messages":
              await this.handleGetMessages(parsedMessage, ws);
              break;
            default:
              console.log("Unknown message type:", parsedMessage.type);
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
            })
          );
        }
      });

      ws.send(
        JSON.stringify({ type: "connected", message: "WebSocket connected" })
      );
    });
  }

  private extractUserIdFromRequest(req: http.IncomingMessage, ws: WebSocket) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Access token required",
        })
      );
      ws.close();
      return;
    }

    const userInfo = verifyAuthToken(token);

    if (!userInfo.id) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid token",
        })
      );
      ws.close();
      return;
    }

    return userInfo.id;
  }

  private async handleSendMessage(parsedMessage: any, senderId: string) {
    // Validate required fields
    if (!parsedMessage.conversationId || !parsedMessage.content) {
      throw new Error("Invalid message format");
    }

    await this.chatService.sendMessage(
      parsedMessage.conversationId,
      senderId,
      parsedMessage.content
    );
  }

  private async handleMarkMessageRead(parsedMessage: any, userId: string) {
    if (!parsedMessage.messageId) {
      throw new Error("Message ID is required");
    }

    await this.chatService.markMessageAsRead(parsedMessage.messageId, userId);
  }

  private async handleGetMessages(parsedMessage: any, ws: WebSocket) {
    if (!parsedMessage.conversationId) {
      throw new Error("Conversation ID is required");
    }

    const messages = await this.chatService.getMessages(
      parsedMessage.conversationId,
      parsedMessage.limit
    );

    ws.send(
      JSON.stringify({
        type: "messages",
        data: messages,
      })
    );
  }
}

export default WebSocketServer;
