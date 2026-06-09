import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createTicketAction } from "@/app/actions/tickets";

export default async function NewTicketPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: { id: true, email: true, role: true },
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/tickets" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← К списку
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Новая заявка</h1>
      </div>

      <form action={createTicketAction} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
        <div className="space-y-1">
          <label htmlFor="title" className="text-sm font-medium text-zinc-800">
            Заголовок
          </label>
          <input
            required
            id="title"
            name="title"
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
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="assignedToId" className="text-sm font-medium text-zinc-800">
            Исполнитель (необязательно)
          </label>
          <select
            id="assignedToId"
            name="assignedToId"
            defaultValue=""
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
          Создать
        </button>
      </form>
    </div>
  );
}
