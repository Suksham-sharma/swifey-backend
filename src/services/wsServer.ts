import WebSocket from "ws";
import http from "http";
import ChatService from "./chatservice";

class WebSocketServer {
  private wss: WebSocket.Server;
  private chatService: ChatService;

  constructor(server: http.Server) {
    this.wss = new WebSocket.Server({ server });
    this.chatService = new ChatService(this.wss);
    this.initializeWebSocketHandlers();
  }

  private initializeWebSocketHandlers() {
    this.wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
      // Extract user ID from authentication mechanism
      // This is a placeholder - replace with your actual auth logic
      const userId = this.extractUserIdFromRequest(req);

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

  private extractUserIdFromRequest(req: http.IncomingMessage): string {
    // TODO: Implement proper authentication
    // This is a placeholder - you'd typically:
    // 1. Check for authentication token in query params or headers
    // 2. Validate the token
    // 3. Extract user ID from the token
    return (req.headers["x-user-id"] as string) || "";
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