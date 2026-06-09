import { PrismaClient, Role, TicketStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo12345", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.local" },
    update: { passwordHash, role: Role.ADMIN },
    create: {
      email: "admin@demo.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.local" },
    update: { passwordHash, role: Role.MANAGER },
    create: {
      email: "manager@demo.local",
      passwordHash,
      role: Role.MANAGER,
    },
  });

  const existing = await prisma.ticket.count();
  if (existing === 0) {
    const t1 = await prisma.ticket.create({
      data: {
        title: "Пример заявки: доступ к отчётам",
        description: "Нужен read-only доступ к дашборду за прошлый квартал.",
        status: TicketStatus.OPEN,
        createdById: manager.id,
        assignedToId: admin.id,
      },
    });

    await prisma.auditLog.createMany({
      data: [
        {
          entity: "Ticket",
          entityId: t1.id,
          action: "CREATE",
          userId: manager.id,
          snapshot: {
            after: {
              title: t1.title,
              status: t1.status,
              assignedToId: t1.assignedToId,
            },
          },
        },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
