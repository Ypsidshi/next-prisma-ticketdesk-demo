import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  entity: string;
  entityId: string;
  action: AuditAction;
  userId: string | null;
  snapshot?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      entity: input.entity,
      entityId: input.entityId,
      action: input.action,
      userId: input.userId,
      snapshot: input.snapshot ?? undefined,
    },
  });
}
