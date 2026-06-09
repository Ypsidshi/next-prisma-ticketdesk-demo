import Link from "next/link";

export default function TicketNotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Заявка не найдена</h1>
      <Link href="/tickets" className="text-sm text-zinc-600 hover:text-zinc-900">
        ← К списку
      </Link>
    </div>
  );
}
