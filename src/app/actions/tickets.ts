"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, type TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const ticketStatuses = ["OPEN", "IN_PROGRESS", "CLOSED"] as const satisfies readonly TicketStatus[];

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  assignedToId: z.string().trim().optional(),
});

const updateSchema = createSchema.extend({
  id: z.string().min(1),
  status: z.enum(ticketStatuses),
});

function pickSnapshot(ticket: {
  title: string;
  description: string;
  status: TicketStatus;
  assignedToId: string | null;
}) {
  return {
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    assignedToId: ticket.assignedToId,
  };
}

async function requireUser() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function createTicketAction(formData: FormData) {
  const user = await requireUser();
  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    assignedToId: (formData.get("assignedToId") as string) || undefined,
  });
  if (!parsed.success) {
    redirect("/tickets/new?error=validation");
  }

  const assignedToId =
    parsed.data.assignedToId && parsed.data.assignedToId.length > 0
      ? parsed.data.assignedToId
      : null;

  if (assignedToId) {
    const exists = await prisma.user.findUnique({ where: { id: assignedToId }, select: { id: true } });
    if (!exists) {
      redirect("/tickets/new?error=assignee");
    }
  }

  const ticket = await prisma.ticket.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      createdById: user.id,
      assignedToId,
    },
  });

  await writeAuditLog({
    entity: "Ticket",
    entityId: ticket.id,
    action: "CREATE",
    userId: user.id,
    snapshot: { after: pickSnapshot(ticket) },
  });

  revalidatePath("/tickets");
  redirect(`/tickets/${ticket.id}`);
}

export async function updateTicketAction(formData: FormData) {
  const user = await requireUser();
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    status: formData.get("status"),
    assignedToId: (formData.get("assignedToId") as string) || undefined,
  });
  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(id ? `/tickets/${id}?error=validation` : "/tickets");
  }

  const before = await prisma.ticket.findUnique({ where: { id: parsed.data.id } });
  if (!before) {
    redirect("/tickets?error=missing");
  }

  const assignedToId =
    parsed.data.assignedToId && parsed.data.assignedToId.length > 0
      ? parsed.data.assignedToId
      : null;

  if (assignedToId) {
    const exists = await prisma.user.findUnique({ where: { id: assignedToId }, select: { id: true } });
    if (!exists) {
      redirect(`/tickets/${parsed.data.id}?error=assignee`);
    }
  }

  const ticket = await prisma.ticket.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      assignedToId,
    },
  });

  await writeAuditLog({
    entity: "Ticket",
    entityId: ticket.id,
    action: "UPDATE",
    userId: user.id,
    snapshot: { before: pickSnapshot(before), after: pickSnapshot(ticket) },
  });

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticket.id}`);
  redirect(`/tickets/${ticket.id}`);
}

export async function deleteTicketAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) {
    redirect("/tickets?error=forbidden");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/tickets");

  const before = await prisma.ticket.findUnique({ where: { id } });
  if (!before) redirect("/tickets");

  await prisma.ticket.delete({ where: { id } });

  await writeAuditLog({
    entity: "Ticket",
    entityId: id,
    action: "DELETE",
    userId: user.id,
    snapshot: { before: pickSnapshot(before) },
  });

  revalidatePath("/tickets");
  redirect("/tickets");
}
