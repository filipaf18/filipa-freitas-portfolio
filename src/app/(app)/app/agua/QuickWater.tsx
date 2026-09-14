"use client";

import { useState, useTransition } from "react";
import { addWater } from "./actions";

const PRESETS = [150, 250, 330, 500];

export function QuickWater({ date }: { date: string }) {
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add(ml: number) {
    setError(null);
    startTransition(async () => {
      const res = await addWater(ml, date);
      if (res.error) setError(res.error);
      else setCustom("");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((ml) => (
          <button key={ml} type="button" disabled={pending} onClick={() => add(ml)} className="btn-water">
            +{ml} ml
          </button>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(custom);
            if (n > 0) add(n);
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={5000}
            placeholder="outro (ml)"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="input w-32"
          />
          <button type="submit" disabled={pending || !custom} className="btn-secondary">
            Adicionar
          </button>
        </form>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
