"use client";

import { useState } from "react";
import { cn } from "@/lib/ui/cn";

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export function WeekdayPicker({ name = "weekdays", defaultValue = [1, 2, 3, 4, 5] }: { name?: string; defaultValue?: number[] }) {
  const [sel, setSel] = useState<Set<number>>(new Set(defaultValue));
  return (
    <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Dias da semana">
      {DAYS.map((d, i) => {
        const on = sel.has(i);
        return (
          <label key={i} className="contents">
            <input
              type="checkbox"
              name={name}
              value={i}
              checked={on}
              onChange={() => setSel((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
              className="sr-only"
            />
            <span
              aria-hidden
              title={NAMES[i]}
              className={cn(
                "grid h-11 cursor-pointer place-items-center rounded-[6px] t-label transition-colors duration-150 select-none",
                on ? "bg-gradient-accent text-on-accent" : "bg-surface-300 text-ink-faint hover:bg-surface-100",
              )}
            >
              {d}
            </span>
          </label>
        );
      })}
    </div>
  );
}
