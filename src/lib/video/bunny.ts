import "server-only";
import { createHash } from "node:crypto";

/**
 * Bunny Stream — adapter do VideoProvider.
 * Docs conferidas em 21/10/2026:
 *  - Create video: POST https://video.bunnycdn.com/library/{libraryId}/videos  (AccessKey)
 *  - TUS upload:   https://video.bunnycdn.com/tusupload  (AuthorizationSignature = sha256(libraryId+apiKey+expire+videoId))
 *  - Embed token:  sha256(tokenKey + videoId + expires) → player.mediadelivery.net/embed/{lib}/{video}?token&expires
 */

const API = "https://video.bunnycdn.com";

export function bunnyConfigured() {
  return Boolean(process.env.BUNNY_LIBRARY_ID && process.env.BUNNY_API_KEY && process.env.BUNNY_TOKEN_KEY);
}

function env() {
  return {
    libraryId: process.env.BUNNY_LIBRARY_ID!,
    apiKey: process.env.BUNNY_API_KEY!,
    tokenKey: process.env.BUNNY_TOKEN_KEY!,
    cdnHost: process.env.BUNNY_CDN_HOST,
  };
}

export type BunnyVideo = {
  guid: string;
  title: string;
  length: number; // segundos
  status: number; // 0 created, 1 uploaded, 2 processing, 3 transcoding, 4 finished, 5 error, 6 upload failed
  encodeProgress: number;
  thumbnailFileName?: string;
};

export async function createVideo(title: string): Promise<{ videoId: string }> {
  const { libraryId, apiKey } = env();
  const r = await fetch(`${API}/library/${libraryId}/videos`, {
    method: "POST",
    headers: { AccessKey: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!r.ok) throw new Error(`Bunny: falha ao criar vídeo (${r.status})`);
  const data = (await r.json()) as BunnyVideo;
  return { videoId: data.guid };
}

export async function getVideo(videoId: string): Promise<BunnyVideo | null> {
  const { libraryId, apiKey } = env();
  const r = await fetch(`${API}/library/${libraryId}/videos/${videoId}`, { headers: { AccessKey: apiKey }, cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Bunny: falha ao consultar vídeo (${r.status})`);
  return (await r.json()) as BunnyVideo;
}

export async function deleteVideo(videoId: string) {
  const { libraryId, apiKey } = env();
  await fetch(`${API}/library/${libraryId}/videos/${videoId}`, { method: "DELETE", headers: { AccessKey: apiKey } });
}

/** Credenciais de upload TUS para o navegador (válidas por 2h). A API key nunca sai do servidor. */
export function tusCredentials(videoId: string) {
  const { libraryId, apiKey } = env();
  const expire = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
  const signature = createHash("sha256").update(`${libraryId}${apiKey}${expire}${videoId}`).digest("hex");
  return { endpoint: `${API}/tusupload`, libraryId, videoId, expire, signature };
}

/** URL assinada do player embutido (padrão: 5 min). */
export function signedEmbedUrl(videoId: string, opts: { ttlSec?: number; autoplay?: boolean; startSec?: number } = {}) {
  const { libraryId, tokenKey } = env();
  const expires = Math.floor(Date.now() / 1000) + (opts.ttlSec ?? 300);
  const token = createHash("sha256").update(`${tokenKey}${videoId}${expires}`).digest("hex");
  const params = new URLSearchParams({ token, expires: String(expires), autoplay: opts.autoplay ? "true" : "false", preload: "true", responsive: "true" });
  if (opts.startSec && opts.startSec > 0) params.set("t", String(Math.floor(opts.startSec)));
  return `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?${params.toString()}`;
}

export function thumbnailUrl(videoId: string) {
  const { cdnHost } = env();
  return cdnHost ? `https://${cdnHost}/${videoId}/thumbnail.jpg` : null;
}

export function mapStatus(s: number): "aguardando" | "processando" | "pronto" | "erro" {
  if (s === 4) return "pronto";
  if (s === 5 || s === 6) return "erro";
  if (s === 0) return "aguardando";
  return "processando";
}
