import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseTicketListSearchParams, ticketWhere } from "@/lib/tickets-query";

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = Object.fromEntries(request.nextUrl.searchParams.entries());
  const { status, q } = parseTicketListSearchParams(entries);
  const where = ticketWhere(status, q);

  const rows = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      createdBy: { select: { email: true } },
      assignedTo: { select: { email: true } },
    },
  });

  const header = ["id", "title", "description", "status", "createdAt", "updatedAt", "createdBy", "assignedTo"];
  const lines = [header.join(",")];

  for (const t of rows) {
    lines.push(
      [
        csvCell(t.id),
        csvCell(t.title),
        csvCell(t.description),
        t.status,
        t.createdAt.toISOString(),
        t.updatedAt.toISOString(),
        csvCell(t.createdBy.email),
        t.assignedTo ? csvCell(t.assignedTo.email) : "",
      ].join(","),
    );
  }

  const body = `\uFEFF${lines.join("\n")}`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tickets.csv"',
    },
  });
}
