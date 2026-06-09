import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/jwt";

export const SESSION_COOKIE = "td_session";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
};

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { userId } = await verifySessionToken(token);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
    return user;
  } catch {
    return null;
  }
}
