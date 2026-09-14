"use client";

import { useTransition } from "react";
import { deleteWater } from "./actions";
import type { WaterLog } from "@/lib/database.types";

export function TodayLog({ logs }: { logs: WaterLog[] }) {
  const [pending, startTransition] = useTransition();

  if (logs.length === 0) return <p className="text-sm text-muted">Ainda não registaste água hoje.</p>;

  return (
    <ul className="divide-y divide-border text-sm">
      {logs.map((l) => (
        <li key={l.id} className="flex items-center justify-between py-2">
          <span>
            <strong>{l.amount_ml} ml</strong>{" "}
            <span className="text-muted">
              às {new Date(l.logged_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => { await deleteWater(l.id); })}
            className="text-xs text-muted hover:text-red-600"
          >
            remover
          </button>
        </li>
      ))}
    </ul>
  );
}
