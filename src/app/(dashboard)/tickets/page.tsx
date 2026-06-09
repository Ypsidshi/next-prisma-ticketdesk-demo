import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { PAGE_SIZE, parseTicketListSearchParams, ticketWhere } from "@/lib/tickets-query";

function buildListHref(params: { page?: number; status?: string; q?: string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/tickets?${qs}` : "/tickets";
}

function buildExportHref(params: { status?: string; q?: string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  const qs = sp.toString();
  return qs ? `/api/tickets/export?${qs}` : "/api/tickets/export";
}

const statusLabels: Record<string, string> = {
  OPEN: "Открыта",
  IN_PROGRESS: "В работе",
  CLOSED: "Закрыта",
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSession();
  if (!user) {
    return null;
  }

  const raw = await searchParams;
  const { page, status, q } = parseTicketListSearchParams(raw);
  const where = ticketWhere(status, q);

  const [total, tickets] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        createdBy: { select: { email: true } },
        assignedTo: { select: { email: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Заявки</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Фильтры, пагинация и экспорт CSV. Удаление заявок — только у роли «Админ».
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tickets/new"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Новая заявка
          </Link>
          <a
            href={buildExportHref({ status, q })}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Скачать CSV
          </a>
        </div>
      </div>

      <form
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-end"
        action="/tickets"
        method="get"
      >
        <div className="flex-1 space-y-1">
          <label htmlFor="q" className="text-xs font-medium text-zinc-600">
            Поиск по заголовку
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Например, доступ"
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </div>
        <div className="w-full space-y-1 sm:w-48">
          <label htmlFor="status" className="text-xs font-medium text-zinc-600">
            Статус
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            <option value="">Все</option>
            <option value="OPEN">Открыта</option>
            <option value="IN_PROGRESS">В работе</option>
            <option value="CLOSED">Закрыта</option>
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex h-[42px] items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Применить
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Заголовок</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Автор</th>
              <th className="px-4 py-3">Исполнитель</th>
              <th className="px-4 py-3">Создана</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {tickets.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-500" colSpan={5}>
                  Ничего не найдено. Создайте первую заявку.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${t.id}`} className="font-medium text-zinc-900 hover:underline">
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{statusLabels[t.status] ?? t.status}</td>
                  <td className="px-4 py-3 text-zinc-600">{t.createdBy.email}</td>
                  <td className="px-4 py-3 text-zinc-600">{t.assignedTo?.email ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {t.createdAt.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-600">
        <span>
          Страница {page} из {totalPages} · всего {total}
        </span>
        <div className="flex gap-2">
          <Link
            className={`rounded-md border px-3 py-1 ${page <= 1 ? "pointer-events-none opacity-40" : "border-zinc-200 bg-white hover:bg-zinc-50"}`}
            href={buildListHref({ page: page - 1, status, q })}
          >
            Назад
          </Link>
          <Link
            className={`rounded-md border px-3 py-1 ${page >= totalPages ? "pointer-events-none opacity-40" : "border-zinc-200 bg-white hover:bg-zinc-50"}`}
            href={buildListHref({ page: page + 1, status, q })}
          >
            Вперёд
          </Link>
        </div>
      </div>

      {user.role === Role.ADMIN ? null : (
        <p className="text-xs text-zinc-500">
          Вы вошли как менеджер: удаление заявок недоступно (только у администратора).
        </p>
      )}
    </div>
  );
}
