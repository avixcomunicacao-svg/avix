"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { saveProgress } from "@/modules/content/actions";

declare global {
  interface Window {
    playerjs?: { Player: new (el: HTMLIFrameElement | string) => PlayerJs };
  }
}
type PlayerJs = {
  on: (ev: string, cb: (d?: { seconds: number; duration: number }) => void) => void;
  setCurrentTime: (s: number) => void;
  play: () => void;
};

/**
 * Player embutido do Bunny com retomada de onde parou e gravação de progresso a cada 10 s.
 * Legendas: o player do Bunny mostra as faixas de legenda enviadas à biblioteca (fase 3, a partir da transcrição).
 */
export function LessonPlayer({ embedUrl, lessonId, startSec, onEnded }: { embedUrl: string; lessonId: string; startSec: number; onEnded?: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSaved = useRef(0);

  useEffect(() => {
    let tries = 0;
    let player: PlayerJs | undefined;
    const init = () => {
      if (!iframeRef.current || !window.playerjs) {
        if (tries++ < 50) setTimeout(init, 200);
        return;
      }
      player = new window.playerjs.Player(iframeRef.current);
      player.on("ready", () => {
        if (startSec > 5) player?.setCurrentTime(startSec);
        player?.on("timeupdate", (d) => {
          if (!d) return;
          const now = Date.now();
          if (now - lastSaved.current > 10000) {
            lastSaved.current = now;
            void saveProgress(lessonId, d.seconds);
          }
        });
        player?.on("ended", () => onEnded?.());
      });
    };
    init();
    return () => {
      player = undefined;
    };
  }, [embedUrl, lessonId, startSec, onEnded]);

  return (
    <>
      <Script src="https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js" strategy="afterInteractive" />
      <div className="relative aspect-video w-full overflow-hidden rounded-[20px] bg-gradient-ink">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="Vídeo da aula"
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      </div>
    </>
  );
}
