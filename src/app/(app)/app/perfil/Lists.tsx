"use client";

import { useActionState, useTransition } from "react";
import type { Glp1Titration, Medication } from "@/lib/database.types";
import {
  addMedication,
  addTitration,
  deleteMedication,
  deleteTitration,
  toggleMedication,
  type ActionState,
} from "./actions";

export function TitrationList({ items }: { items: Glp1Titration[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addTitration, {});
  const [, startTransition] = useTransition();

  return (
    <section className="card flex flex-col gap-4">
      <h2 className="font-semibold">Histórico de titulação GLP-1</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Sem registos.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {items.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <strong>{t.dose}</strong> · {t.substance}{" "}
                <span className="text-muted">desde {t.started_on}</span>
                {t.notes && <span className="block text-xs text-muted">{t.notes}</span>}
              </span>
              <button type="button" onClick={() => startTransition(() => deleteTitration(t.id))} className="text-xs text-muted hover:text-red-600">
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
      <form action={action} className="grid gap-2 sm:grid-cols-5">
        <input name="started_on" type="date" required className="input" aria-label="Data" />
        <input name="substance" placeholder="Substância" required className="input" />
        <input name="dose" placeholder="Dose (ex: 5 mg)" required className="input" />
        <input name="notes" placeholder="Notas (opcional)" className="input" />
        <button type="submit" disabled={pending} className="btn-secondary">
          Adicionar
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </section>
  );
}

export function MedicationList({ items }: { items: Medication[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addMedication, {});
  const [, startTransition] = useTransition();

  const groups: { kind: Medication["kind"]; title: string }[] = [
    { kind: "medicacao", title: "Medicação concomitante" },
    { kind: "suplemento", title: "Suplementação" },
  ];

  return (
    <section className="card flex flex-col gap-4">
      {groups.map((g) => {
        const rows = items.filter((m) => m.kind === g.kind);
        return (
          <div key={g.kind}>
            <h2 className="font-semibold">{g.title}</h2>
            {rows.length === 0 ? (
              <p className="text-sm text-muted">Sem registos.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {rows.map((m) => (
                  <li key={m.id} className={`flex items-center justify-between gap-3 py-2 ${m.active ? "" : "opacity-50"}`}>
                    <span>
                      <strong>{m.name}</strong>
                      {m.dose && ` · ${m.dose}`}
                      {m.frequency && <span className="text-muted"> · {m.frequency}</span>}
                    </span>
                    <span className="flex gap-3 text-xs">
                      <button type="button" onClick={() => startTransition(() => toggleMedication(m.id, !m.active))} className="text-muted hover:text-accent">
                        {m.active ? "suspender" : "reativar"}
                      </button>
                      <button type="button" onClick={() => startTransition(() => deleteMedication(m.id))} className="text-muted hover:text-red-600">
                        remover
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <form action={action} className="grid gap-2 sm:grid-cols-5">
        <select name="kind" className="input" aria-label="Tipo">
          <option value="medicacao">Medicação</option>
          <option value="suplemento">Suplemento</option>
        </select>
        <input name="name" placeholder="Nome" required className="input" />
        <input name="dose" placeholder="Dose" className="input" />
        <input name="frequency" placeholder="Frequência" className="input" />
        <button type="submit" disabled={pending} className="btn-secondary">
          Adicionar
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </section>
  );
}
