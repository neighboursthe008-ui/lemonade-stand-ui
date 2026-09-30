import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Plus, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { endpoints } from "@/api/registry";
import { request } from "@/api/client/http";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/app/assistant")({
  head: () => ({ meta: [
    { title: "AI Assistant — Lemonade Staff" }, { name: "description", content: "Ask the clinic assistant and jump to common tasks." },
    { property: "og:title", content: "AI Assistant — Lemonade Staff" }, { property: "og:description", content: "Clinic assistant for staff." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant" | "error"; text: string };

function AssistantPage() {
  const { user, isDevSession } = useAuth();
  const nav = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const last = useRef("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [msgs]);
  const m = useMutation({
    mutationFn: async (message: string) => (await request<{ answer?: string; reply?: string; message?: string }>(endpoints.assistant.chat, { method: "POST", body: { message } })).data,
    onSuccess: (d) => setMsgs((x) => [...x, { role: "assistant", text: d?.answer ?? d?.reply ?? d?.message ?? "No answer was returned." }]),
    onError: () => setMsgs((x) => [...x, { role: "error", text: isDevSession ? "The assistant needs the clinic server — it isn't reachable from a development profile." : "The assistant is unavailable right now." }]),
  });
  const send = (t: string) => { const s = t.trim(); if (!s || m.isPending) return; last.current = s; setMsgs((x) => [...x, { role: "user", text: s }]); setInput(""); m.mutate(s); };
  const quick = user?.is_super_admin
    ? [["System overview", "/app/system-health"], ["Campaigns", "/app/campaigns"], ["Global search", "/app/search"], ["Notifications", "/app/notifications"], ["Reports", "/app/reports"]]
    : [["Find patient", "/app/patients"], ["Today's appointments", "/app/appointments"], ["Waiting list", "/app/queue"], ["Search", "/app/search"], ["Notifications", "/app/notifications"]];

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="flex items-center gap-2 font-display text-lg font-bold text-primary"><Bot className="h-5 w-5" />Clinic assistant</h1>
        <Button variant="outline" size="sm" onClick={() => setMsgs([])}><Plus className="mr-1 h-4 w-4" />New chat</Button>
      </div>
      <div className="flex flex-wrap gap-2 border-b p-3">
        {quick.map(([l, to]) => <Button key={l} variant="secondary" size="sm" onClick={() => nav({ to: to! })}>{l}</Button>)}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {!msgs.length && <p className="text-sm text-muted-foreground">Ask about clinic procedures, fees, or how to do something in the system.</p>}
        {msgs.map((x, i) => (
          <div key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${x.role === "user" ? "ml-auto bg-primary text-primary-foreground" : x.role === "error" ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>
            {x.text}
            {x.role === "error" && <button className="ml-2 inline-flex items-center gap-1 underline" onClick={() => { setMsgs((y) => y.slice(0, -1)); m.mutate(last.current); }}><RotateCcw className="h-3 w-3" />Retry</button>}
          </div>
        ))}
        {m.isPending && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Thinking…</p>}
        <div ref={end} />
      </div>
      <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a question…" aria-label="Message" maxLength={1000} />
        <Button type="submit" disabled={m.isPending || !input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
