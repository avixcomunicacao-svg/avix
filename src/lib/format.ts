const TZ = "America/Sao_Paulo";

export function fmtDate(d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d.length === 10 ? d + "T12:00:00-03:00" : d) : d;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", ...opts }).format(date);
}

export function fmtTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(date);
}

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return `${fmtDate(d)} · ${fmtTime(d)}`;
}

export function fmtWeekdayLong(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const s = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "2-digit", month: "2-digit" }).format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtRelative(d: Date | string | null | undefined) {
  if (!d) return "nunca";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const dd = Math.round(h / 24);
  if (dd === 1) return "ontem";
  if (dd < 30) return `há ${dd} dias`;
  return fmtDate(date);
}

export function fmtDuration(sec: number | null | undefined) {
  if (!sec) return "—";
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function fmtTimestamp(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${String(h).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function greeting(date = new Date()) {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "numeric", hour12: false }).format(date));
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** +55 27 99974-9624 → +5527999749624 */
export function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") && digits.length >= 12 ? digits : "55" + digits;
  if (withCountry.length < 12 || withCountry.length > 13) return null;
  return "+" + withCountry;
}

export function fmtPhone(e164: string) {
  const m = e164.match(/^\+55(\d{2})(\d{4,5})(\d{4})$/);
  if (!m) return e164;
  return `(${m[1]}) ${m[2]}-${m[3]}`;
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
