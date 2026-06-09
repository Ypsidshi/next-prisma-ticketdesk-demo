import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { deleteTicketAction, updateTicketAction } from "@/app/actions/tickets";

const statusLabels: Record<string, string> = {
  OPEN: "Открыта",
  IN_PROGRESS: "В работе",
  CLOSED: "Закрыта",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      createdBy: { select: { email: true } },
      assignedTo: { select: { email: true } },
    },
  });

  if (!ticket) {
    notFound();
  }

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: { id: true, email: true, role: true },
  });

  const audit = await prisma.auditLog.findMany({
    where: { entity: "Ticket", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { email: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/tickets" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← К списку
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Заявка</h1>
        <p className="mt-1 text-sm text-zinc-600">ID: {ticket.id}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <form action={updateTicketAction} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
          <input type="hidden" name="id" value={ticket.id} />
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-medium text-zinc-800">
              Заголовок
            </label>
            <input
              required
              id="title"
              name="title"
              defaultValue={ticket.title}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium text-zinc-800">
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={ticket.description}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="status" className="text-sm font-medium text-zinc-800">
              Статус
            </label>
            <select
              id="status"
              name="status"
              defaultValue={ticket.status}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="OPEN">{statusLabels.OPEN}</option>
              <option value="IN_PROGRESS">{statusLabels.IN_PROGRESS}</option>
              <option value="CLOSED">{statusLabels.CLOSED}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="assignedToId" className="text-sm font-medium text-zinc-800">
              Исполнитель
            </label>
            <select
              id="assignedToId"
              name="assignedToId"
              defaultValue={ticket.assignedToId ?? ""}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="">Не назначен</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email} ({u.role === "ADMIN" ? "админ" : "менеджер"})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Сохранить
          </button>
          <p className="text-xs text-zinc-500">
            Автор: {ticket.createdBy.email} · создана{" "}
            {ticket.createdAt.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
          </p>
        </form>

        <div className="space-y-4">
          {user.role === Role.ADMIN ? (
            <form action={deleteTicketAction} className="rounded-lg border border-red-200 bg-red-50 p-4">
              <input type="hidden" name="id" value={ticket.id} />
              <p className="text-sm font-medium text-red-900">Удаление заявки</p>
              <p className="mt-1 text-xs text-red-800">
                Действие необратимо. Запись попадёт в журнал аудита.
              </p>
              <button
                type="submit"
                className="mt-3 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
              >
                Удалить
              </button>
            </form>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
              Удаление доступно только администратору.
            </div>
          )}

          <div className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
              Журнал изменений
            </div>
            <ul className="divide-y divide-zinc-100 text-sm">
              {audit.length === 0 ? (
                <li className="px-4 py-4 text-zinc-500">Пока нет записей.</li>
              ) : (
                audit.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-zinc-900">{a.action}</span>
                      <span className="text-xs text-zinc-500">
                        {a.createdAt.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      {a.user?.email ?? "система"} · сущность {a.entity}
                    </div>
                    {a.snapshot ? (
                      <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-zinc-50 p-2 text-[11px] text-zinc-700">
                        {JSON.stringify(a.snapshot, null, 2)}
                      </pre>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
