import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;
function resend() {
  if (!process.env.RESEND_API_KEY) return null;
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

type Mail = { to: string; subject: string; html: string; text?: string };

/** Envia e-mail transacional. Sem configuração, registra no log e segue (nada de mock em produção). */
export async function sendEmail(mail: Mail): Promise<{ ok: boolean; id?: string; error?: string }> {
  const r = resend();
  if (!r) {
    console.warn("[email] RESEND_API_KEY ausente — e-mail não enviado:", mail.subject, "→", mail.to);
    return { ok: false, error: "E-mail não configurado" };
  }
  const { data, error } = await r.emails.send({ from: process.env.EMAIL_FROM!, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text });
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}

/** Layout simples, compatível com clientes de e-mail. */
export function emailLayout(opts: { brand: string; title: string; intro: string; cta?: { label: string; url: string }; footer?: string }) {
  const btn = opts.cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0"><tr><td style="border-radius:10px;background:#63c8c3"><a href="${opts.cta.url}" style="display:inline-block;padding:14px 24px;font:600 15px/20px 'IBM Plex Sans',Segoe UI,Arial,sans-serif;color:#0a001c;text-decoration:none">${opts.cta.label}</a></td></tr></table>`
    : "";
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#fffbf2;font-family:'IBM Plex Sans',Segoe UI,Arial,sans-serif;color:#0a001c">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px" cellspacing="0" cellpadding="0">
<tr><td style="padding:0 0 20px;font:700 22px/28px Sora,Segoe UI,Arial,sans-serif;color:#4c238d">${opts.brand}</td></tr>
<tr><td style="background:#ffffff;border:1px solid #e6e1d8;border-radius:14px;padding:28px">
<h1 style="margin:0 0 12px;font:700 24px/30px Sora,Segoe UI,Arial,sans-serif">${opts.title}</h1>
<p style="margin:0;font-size:15px;line-height:22px;color:#473e54">${opts.intro}</p>
${btn}
${opts.footer ? `<p style="margin:16px 0 0;font-size:13px;line-height:18px;color:#6b6478">${opts.footer}</p>` : ""}
</td></tr>
<tr><td style="padding:16px 0 0;font-size:12px;line-height:16px;color:#6b6478">Você recebeu este e-mail porque tem uma conta na ${opts.brand}.</td></tr>
</table></td></tr></table></body></html>`;
}
