"use client";

import { useState, useTransition } from "react";
import { Mail, Pause, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendInvite, setMemberStatus } from "@/modules/members/actions";

export function MemberActions({ id, status, inviteSent }: { id: string; status: "ativo" | "pausado" | "expirado"; inviteSent: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Mail className="size-4" />}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await resendInvite(id);
              setMsg(r.ok ? { ok: true, text: "Convite enviado." } : { ok: false, text: r.error ?? "Falha ao enviar." });
            })
          }
        >
          {inviteSent ? "Reenviar convite" : "Enviar convite"}
        </Button>
        {status === "ativo" ? (
          <Button variant="secondary" size="sm" icon={<Pause className="size-4" />} disabled={pending} onClick={() => start(() => setMemberStatus(id, "pausado"))}>
            Pausar
          </Button>
        ) : (
          <Button variant="secondary" size="sm" icon={<Play className="size-4" />} disabled={pending} onClick={() => start(() => setMemberStatus(id, "ativo"))}>
            Reativar
          </Button>
        )}
        {status !== "expirado" && (
          <Button variant="danger" size="sm" icon={<XCircle className="size-4" />} disabled={pending} onClick={() => start(() => setMemberStatus(id, "expirado"))}>
            Expirar
          </Button>
        )}
      </div>
      {msg && <span className={`t-body-sm ${msg.ok ? "text-accent-text" : "text-danger"}`}>{msg.text}</span>}
    </div>
  );
}
