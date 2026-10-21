"use client";

import { useEffect, useRef, useState } from "react";
import { Upload as UploadIcon, RefreshCw, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import * as tus from "tus-js-client";
import { beginVideoUpload, markVideoUploaded, syncVideoStatus, removeVideo } from "@/modules/content/actions";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/primitives";
import { fmtDuration } from "@/lib/format";

type Props = { lessonId: string; videoId: string | null; videoStatus: "aguardando" | "processando" | "pronto" | "erro"; durationSec: number | null; configured: boolean };

export function VideoUploader({ lessonId, videoId, videoStatus, durationSec, configured }: Props) {
  const [status, setStatus] = useState(videoStatus);
  const [duration, setDuration] = useState(durationSec);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [encodePct, setEncodePct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Enquanto processa, consulta o Bunny a cada 8 s.
  useEffect(() => {
    if (status !== "processando") return;
    const t = setInterval(async () => {
      const r = await syncVideoStatus(lessonId);
      if ("progress" in r && typeof r.progress === "number") setEncodePct(r.progress);
      if (r.status !== "processando") {
        setStatus(r.status);
        if ("durationSec" in r && r.durationSec) setDuration(r.durationSec);
        setEncodePct(null);
      }
    }, 8000);
    return () => clearInterval(t);
  }, [status, lessonId]);

  async function onFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const r = await beginVideoUpload(lessonId, file.name);
      if ("error" in r) {
        setError(r.error ?? "Erro desconhecido.");
        return;
      }
      const c = r.creds;
      setUploadPct(0);
      await new Promise<void>((resolve, reject) => {
        const up = new tus.Upload(file, {
          endpoint: c.endpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: 50 * 1024 * 1024,
          headers: { AuthorizationSignature: c.signature, AuthorizationExpire: String(c.expire), VideoId: c.videoId, LibraryId: c.libraryId },
          metadata: { filetype: file.type || "video/mp4", title: file.name },
          onError: reject,
          onProgress: (sent, total) => setUploadPct(Math.round((sent / total) * 100)),
          onSuccess: () => resolve(),
        });
        up.findPreviousUploads().then((prev) => {
          if (prev.length) up.resumeFromPreviousUpload(prev[0]!);
          up.start();
        });
      });
      await markVideoUploaded(lessonId);
      setUploadPct(null);
      setStatus("processando");
    } catch (e) {
      setError(`Falha no upload: ${e instanceof Error ? e.message : "erro desconhecido"}. Você pode tentar de novo — o envio retoma de onde parou.`);
      setUploadPct(null);
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-[14px] border border-dashed border-border-strong p-5 text-center">
        <p className="t-body font-semibold">Provedor de vídeo não configurado</p>
        <p className="mt-1 t-body-sm text-ink-muted">Preencha BUNNY_LIBRARY_ID, BUNNY_API_KEY e BUNNY_TOKEN_KEY nas variáveis de ambiente e reinicie. Você pode salvar a aula como rascunho enquanto isso.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {status === "pronto" && videoId && (
        <div className="flex items-center gap-3 rounded-[14px] bg-accent-soft p-4 text-accent-text">
          <CheckCircle2 className="size-5 shrink-0" />
          <span className="t-body">
            Vídeo pronto · {fmtDuration(duration)}
          </span>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="ghost" size="sm" icon={<RefreshCw className="size-4" />} onClick={() => fileRef.current?.click()}>
              Trocar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={<Trash2 className="size-4" />}
              onClick={async () => {
                if (confirm("Remover o vídeo desta aula?")) {
                  await removeVideo(lessonId);
                  setStatus("aguardando");
                  setDuration(null);
                }
              }}
            >
              Remover
            </Button>
          </div>
        </div>
      )}

      {status === "processando" && (
        <div className="rounded-[14px] border border-border p-4">
          <ProgressBar label="Processando no servidor de vídeo" value={encodePct ?? 10} caption="Pode levar alguns minutos. Você pode salvar a aula e voltar depois." />
        </div>
      )}

      {status === "erro" && (
        <div className="flex items-start gap-3 rounded-[14px] bg-danger-soft p-4 text-danger">
          <AlertTriangle className="size-5 shrink-0" />
          <span className="t-body-sm">O provedor não conseguiu processar este arquivo. Envie novamente, de preferência em MP4 (H.264).</span>
        </div>
      )}

      {uploadPct !== null && (
        <div className="rounded-[14px] border border-border p-4">
          <ProgressBar label="Enviando" value={uploadPct} caption="Não feche esta aba. Se cair a conexão, o envio retoma de onde parou." />
        </div>
      )}

      {(status === "aguardando" || status === "erro") && uploadPct === null && (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[14px] border border-dashed border-border-strong p-6 text-center transition-colors hover:bg-surface-100">
          <span className="grid size-12 place-items-center rounded-[10px] bg-brand-soft text-brand-text">
            <UploadIcon className="size-6" />
          </span>
          <span className="t-body font-semibold">{busy ? "Preparando…" : "Enviar vídeo"}</span>
          <span className="t-body-sm text-ink-muted">MP4, MOV ou WebM · até 20 GB · upload retomável</span>
          <input ref={fileRef} type="file" accept="video/*" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      )}
      {status === "pronto" && <input ref={fileRef} type="file" accept="video/*" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />}

      {error && (
        <p className="t-body-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
