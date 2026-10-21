"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Star } from "lucide-react";
import { toggleLessonCompleted, rateLesson } from "@/modules/content/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/ui/cn";

export function LessonControls({ lessonId, completed, initialScore, initialComment, nextHref }: { lessonId: string; completed: boolean; initialScore: number; initialComment: string; nextHref: string | null }) {
  const router = useRouter();
  const [done, setDone] = useState(completed);
  const [score, setScore] = useState(initialScore);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [undo, setUndo] = useState(false);

  function toggle() {
    const next = !done;
    setDone(next);
    setUndo(next);
    start(async () => {
      const r = await toggleLessonCompleted(lessonId, next);
      if (r && "error" in r) {
        setDone(!next);
        setSaved(r.error ?? null);
      }
      router.refresh();
    });
    if (next) setTimeout(() => setUndo(false), 6000);
  }

  function rate(s: number) {
    setScore(s);
    start(async () => {
      const r = await rateLesson(lessonId, s, comment);
      setSaved(r && "error" in r ? (r.error ?? null) : "Avaliação salva. Obrigado!");
      setTimeout(() => setSaved(null), 3000);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={toggle} loading={pending && !saved} variant={done ? "secondary" : "primary"} icon={<Check className="size-4" strokeWidth={2.4} />} className="flex-1 md:flex-none">
          {done ? "Concluída" : "Marcar como concluída"}
        </Button>
        {done && undo && (
          <button onClick={toggle} className="t-body-sm text-brand-text underline-offset-2 hover:underline">
            Desfazer
          </button>
        )}
        {done && nextHref && (
          <Button variant="ghost" onClick={() => router.push(nextHref)}>
            Ir para a próxima →
          </Button>
        )}
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="t-h3">Como foi esta aula?</h2>
        <div className="flex gap-0.5" role="radiogroup" aria-label="Nota de 1 a 5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={score === s}
              aria-label={`${s} estrela${s > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => rate(s)}
              className="grid size-11 place-items-center rounded-[6px]"
            >
              <Star className={cn("size-7 transition-colors duration-150", (hover || score) >= s ? "fill-accent text-accent" : "text-border-strong")} />
            </button>
          ))}
        </div>
        <Field label="Comentário (opcional)" htmlFor="coment">
          <Input id="coment" value={comment} onChange={(e) => setComment(e.target.value)} onBlur={() => score && rate(score)} placeholder="Ex.: o exemplo da clínica ajudou muito" />
        </Field>
        {saved && (
          <p className={cn("t-body-sm", saved.includes("salva") ? "text-accent-text" : "text-danger")} role="status">
            {saved}
          </p>
        )}
      </Card>
    </div>
  );
}
