"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DayTotal = { date: string; total: number };

function shortLabel(iso: string, range: "semana" | "mes") {
  const [, m, d] = iso.split("-");
  if (range === "semana") {
    const [y, mm, dd] = iso.split("-").map(Number);
    const wd = new Date(y, mm - 1, dd).toLocaleDateString("pt-PT", { weekday: "short" });
    return wd.replace(".", "");
  }
  return `${d}/${m}`;
}

export function WaterChart({ days, goalMl }: { days: DayTotal[]; goalMl: number }) {
  const [range, setRange] = useState<"semana" | "mes">("semana");
  const data = (range === "semana" ? days.slice(-7) : days.slice(-30)).map((d) => ({
    ...d,
    label: shortLabel(d.date, range),
  }));

  const avg = data.length ? Math.round(data.reduce((s, d) => s + d.total, 0) / data.length) : 0;
  const hit = data.filter((d) => d.total >= goalMl).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">
          Média <strong className="text-foreground">{avg} ml</strong> · meta atingida em{" "}
          <strong className="text-foreground">
            {hit}/{data.length}
          </strong>{" "}
          dias
        </div>
        <div className="flex gap-1 text-sm">
          {(["semana", "mes"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1 ${range === r ? "bg-water-soft font-medium text-water" : "hover:bg-water-soft"}`}
            >
              {r === "semana" ? "7 dias" : "30 dias"}
            </button>
          ))}
        </div>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} interval={range === "mes" ? 4 : 0} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
            <Tooltip
              formatter={(v) => [`${v} ml`, "Água"]}
              labelFormatter={(_, p) => (p?.[0]?.payload as DayTotal | undefined)?.date ?? ""}
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
            />
            <ReferenceLine y={goalMl} stroke="var(--accent)" strokeDasharray="4 4" label={{ value: "meta", fontSize: 11, fill: "var(--accent)" }} />
            <Bar dataKey="total" fill="var(--water)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
