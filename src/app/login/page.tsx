import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/tickets");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Вход в Ticketdesk</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Демо: <span className="font-mono text-xs">admin@demo.local</span> /{" "}
            <span className="font-mono text-xs">manager@demo.local</span> — пароль{" "}
            <span className="font-mono text-xs">demo12345</span>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
