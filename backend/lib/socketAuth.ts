/**
 * Socket authentication + authorization — closes the CRITICAL open-door hole.
 *
 * Before: any client could `join-project` any room with no token and no
 * membership check, reading and injecting markers/status/chat at will.
 *
 * Now: the connection handshake must carry a valid JWT (identity comes from
 * the verified token, never from client-sent fields), and every join-project
 * verifies the user owns the project before the room join happens.
 */
import jwt from "jsonwebtoken";
import type { Server, Socket } from "socket.io";
import prisma from "../db/client.ts";
import { config } from "../config.ts";

export interface AuthedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

export function installSocketAuth(io: Server) {
  // 1. Handshake: no valid token → no connection.
  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || !token) {
      return next(new Error("UNAUTHENTICATED: connection requires auth token"));
    }
    try {
      const decoded = jwt.verify(token, config().jwtSecret) as { id: string; email: string };
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      next();
    } catch {
      next(new Error("UNAUTHENTICATED: invalid or expired token"));
    }
  });
}

/** Owner check before any room join. Extend with a collaborators table later. */
export async function canJoinProject(userId: string, projectId: string): Promise<boolean> {
  if (!userId || !projectId) return false;
  const project = await prisma.project.findUnique({
    where: { id: String(projectId) },
    select: { userId: true },
  });
  return project?.userId === userId;
}
