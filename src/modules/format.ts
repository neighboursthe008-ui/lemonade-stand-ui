import type { ColumnFormat, Row } from "./types";

/** Reads "a|b.c" — first non-empty alternative, dotted paths supported (Laravel nested resources vs flat mock rows). */
export function getValue(row: Row, key: string): unknown {
  for (const alt of key.split("|")) {
    const v = alt.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), row);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

export const humanize = (s: string) => s.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function formatValue(v: unknown, f: ColumnFormat = "text"): string {
  if (v === null || v === undefined || v === "") return "—";
  if (f === "money") return `KSh ${Number(v).toLocaleString("en-KE")}`;
  if (f === "date") { const d = new Date(String(v)); return isNaN(+d) ? String(v) : d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }); }
  if (f === "datetime") { const d = new Date(String(v)); return isNaN(+d) ? String(v) : d.toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
  if (f === "bool") return v ? "Yes" : "No";
  if (f === "status") return humanize(String(v));
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

const GOOD = ["completed", "confirmed", "paid", "dispensed", "published", "approved", "active", "posted", "received", "delivered", "verified", "operational", "connected", "matched", "balanced", "applied", "open"];
const WARN = ["pending", "scheduled", "waiting", "partial", "draft", "requested", "processing", "sample_collected", "in_transit", "invited", "proposed", "unmatched", "awaiting_payment", "emergency"];
const INFO = ["checked_in", "called", "in_progress", "in_consultation", "sent", "shipped", "ordered", "accepted", "mpesa"];
const BAD = ["cancelled", "no_show", "overdue", "refunded", "rejected", "failed", "declined", "disabled", "skipped", "reversed", "archived", "not_configured", "closed"];

export function statusClass(v: unknown) {
  const s = String(v ?? "").toLowerCase();
  if (GOOD.includes(s)) return "bg-success/15 text-success";
  if (WARN.includes(s)) return "bg-lemon/40 text-lemon-foreground";
  if (INFO.includes(s)) return "bg-aqua/20 text-primary";
  if (BAD.includes(s)) return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}
