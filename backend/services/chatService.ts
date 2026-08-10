// backend/services/chatService.ts
import prisma from '../db/client.ts';

export const getChatHistory = async (roomId: string) => {
  return await prisma.message.findMany({
    where: { roomId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'asc' }
  });
};

export const saveChatMessage = async (roomId: string, userId: string, content: string) => {
  return await prisma.message.create({
    data: {
      roomId,
      userId,
      content
    },
    include: { user: { select: { name: true, email: true } } }
  });
};

export const getOrCreateRoom = async (name: string) => {
  let room = await prisma.chatRoom.findFirst({ where: { name } });
  if (!room) {
    room = await prisma.chatRoom.create({ data: { name } });
  }
  return room;
};
