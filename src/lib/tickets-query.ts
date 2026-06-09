import type { Prisma, TicketStatus } from "@prisma/client";

const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "CLOSED"];

export function parseTicketListSearchParams(
  raw: Record<string, string | string[] | undefined>,
): { page: number; status?: TicketStatus; q: string } {
  const pageRaw = Array.isArray(raw.page) ? raw.page[0] : raw.page;
  const page = Math.max(1, Number(pageRaw) || 1);

  const statusRaw = Array.isArray(raw.status) ? raw.status[0] : raw.status;
  const status = STATUSES.includes(statusRaw as TicketStatus) ? (statusRaw as TicketStatus) : undefined;

  const qRaw = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  const q = String(qRaw ?? "").trim();

  return { page, status, q };
}

export function ticketWhere(status?: TicketStatus, q?: string): Prisma.TicketWhereInput {
  return {
    ...(status ? { status } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };
}

export const PAGE_SIZE = 10;
