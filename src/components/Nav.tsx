"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const links = [
  { href: "/app", label: "Hoje" },
  { href: "/app/agua", label: "Água" },
  { href: "/app/chat", label: "Chat" },
  { href: "/app/perfil", label: "Perfil" },
] as const;

export function Nav({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/app" className="text-lg font-semibold tracking-tight">
          NutriGLP
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => {
            const active = l.href === "/app" ? pathname === "/app" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 transition ${
                  active ? "bg-accent-soft font-medium text-accent" : "hover:bg-accent-soft"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <form action={logout} className="flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">{displayName}</span>
          <button type="submit" className="btn-secondary px-3 py-1">
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
