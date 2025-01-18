import { PrismaClient } from "@prisma/client";
import { UserInfo } from "./wsServer";

const prisma = new PrismaClient();

class ChatService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createOrGetConversation(user1Id: string, user2Id: string) {
    const [smallerId, largerId] = [user1Id, user2Id].sort();

    return this.prisma.conversation.upsert({
      where: {
        user1Id_user2Id: {
          user1Id: smallerId,
          user2Id: largerId,
        },
      },
      update: {},
      create: {
        user1Id: smallerId,
        user2Id: largerId,
      },
    });
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const message = await this.prisma.$transaction(async (tx) => {
      const newMessage = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return newMessage;
    });

    this.sendMessageToUser(message, conversationId);

    return message;
  }

  async getMessages(conversationId: string, limit: number = 50) {
    const whereCondition: any = {
      conversationId,
    };

    return this.prisma.message.findMany({
      where: whereCondition,
      include: {
        reads: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async markMessageAsRead(messageId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.messageRead.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId,
          },
        },
        update: {
          readAt: new Date(),
        },
        create: {
          messageId,
          userId,
        },
      });

      await tx.message.update({
        where: { id: messageId },
        data: { status: "read" },
      });
    });
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            reads: {
              where: { userId },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  private async sendMessageToUser(message: any, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { user1Id: true, user2Id: true },
    });

    if (!conversation) {
      console.error("Conversation not found");
      return;
    }

    const participants = [conversation.user1Id, conversation.user2Id];

    const recipients = participants.filter(
      (userId) => userId !== message.senderId
    );

    const wsClient = UserInfo.get(recipients[0]);

    wsClient?.send(JSON.stringify(message));
  }
}

export default ChatService;
