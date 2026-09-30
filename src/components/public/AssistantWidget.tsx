import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Bot, Loader2, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { endpoints } from "@/api/registry";
import { request } from "@/api/client/http";

type Msg = { role: "user" | "assistant" | "error"; text: string };

const quick = [
  { label: "Explore services", to: "/services" },
  { label: "Book appointment", to: "/appointments" },
  { label: "Clinic info", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

const ask = async (message: string) =>
  (await request<{ answer?: string; reply?: string; message?: string }>(endpoints.assistant.chat, { method: "POST", body: { message }, auth: false })).data;

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const lastQ = useRef("");
  const endRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const m = useMutation({
    mutationFn: ask,
    onSuccess: (d) => setMsgs((x) => [...x, { role: "assistant", text: d?.answer ?? d?.reply ?? d?.message ?? "No answer was returned." }]),
    onError: (e: Error) => setMsgs((x) => [...x, { role: "error", text: e.message }]),
  });
  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [msgs, m.isPending]);

  const send = (q: string) => {
    const t = q.trim().slice(0, 500);
    if (!t || m.isPending) return;
    lastQ.current = t;
    setMsgs((x) => [...x, { role: "user", text: t }]);
    setInput("");
    m.mutate(t);
  };

  if (!open)
    return (
      <button onClick={() => setOpen(true)} aria-label="Open clinic assistant" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg ring-4 ring-lemon/40 hover:bg-brand/90">
        <MessageCircle className="h-6 w-6" />
      </button>
    );

  return (
    <div role="dialog" aria-label="Clinic assistant" className="fixed inset-x-3 bottom-3 z-40 flex max-h-[80vh] flex-col overflow-hidden rounded-xl border bg-card shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96">
      <div className="flex items-center justify-between bg-brand px-4 py-3 text-brand-foreground">
        <p className="flex items-center gap-2 font-medium"><Bot className="h-4 w-4 text-lemon" />Clinic assistant</p>
        <div className="flex gap-1">
          <button aria-label="New conversation" onClick={() => { setMsgs([]); m.reset(); }} className="rounded p-1 hover:bg-brand-foreground/10"><RotateCcw className="h-4 w-4" /></button>
          <button aria-label="Close assistant" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-brand-foreground/10"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
        {!msgs.length && (
          <>
            <p className="text-muted-foreground">Ask about our services, visits or the clinic. For medical emergencies, call the clinic directly.</p>
            <div className="flex flex-wrap gap-2">
              {quick.map((q) => <button key={q.to} onClick={() => { setOpen(false); navigate({ to: q.to }); }} className="rounded-full border px-3 py-1 text-xs hover:bg-muted">{q.label}</button>)}
            </div>
          </>
        )}
        {msgs.map((x, i) => (
          <div key={i} className={x.role === "user" ? "ml-8 rounded-lg bg-brand px-3 py-2 text-brand-foreground" : x.role === "error" ? "mr-8 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-destructive" : "mr-8 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2"}>
            {x.text}
            {x.role === "error" && i === msgs.length - 1 && <button onClick={() => { setMsgs((y) => y.slice(0, -1)); m.mutate(lastQ.current); }} className="mt-1 block text-xs underline">Retry</button>}
          </div>
        ))}
        {m.isPending && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Typing…</p>}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t p-3">
        <label htmlFor="assistant-input" className="sr-only">Your question</label>
        <input id="assistant-input" value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} placeholder="Type your question…" className="flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
        <Button type="submit" size="icon" aria-label="Send" disabled={!input.trim() || m.isPending}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
