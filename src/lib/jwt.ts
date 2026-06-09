import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

function getSecret() {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 16) {
    throw new Error("JWT_SECRET must be set and at least 16 characters");
  }
  return new TextEncoder().encode(raw);
}

export async function createSessionToken(user: { id: string; role: Role }) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export type VerifiedJwt = { userId: string; role: Role };

export async function verifySessionToken(token: string): Promise<VerifiedJwt> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
  const userId = typeof payload.sub === "string" ? payload.sub : "";
  const role = payload.role as Role | undefined;
  if (!userId || !role) {
    throw new Error("Invalid token payload");
  }
  return { userId, role };
}
