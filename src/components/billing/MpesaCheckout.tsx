import { useEffect, useRef, useState } from "react";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "idle" | "pending" | "timeout" | "simulated" | "failed";

/**
 * M-Pesa STK UI. No STK Push JSON API is documented, so this runs a development
 * simulation only: it never reports a real successful payment.
 */
export function MpesaCheckout({ amount, reference, onClose }: { amount: number; reference: string; onClose?: () => void }) {
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [secs, setSecs] = useState(0);
  const t = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (t.current) clearInterval(t.current); }, []);
  const start = () => {
    if (!/^(?:254|0)?7\d{8}$|^(?:254|0)?1\d{8}$/.test(phone.replace(/\s/g, ""))) { setErr("Enter a Safaricom number, e.g. 0712 345 678"); return; }
    setErr(""); setStatus("pending"); setSecs(0);
    t.current = setInterval(() => setSecs((s) => {
      if (s >= 5) { if (t.current) clearInterval(t.current); setStatus("simulated"); return s; }
      return s + 1;
    }), 1000);
  };
  return (
    <div className="space-y-4">
      <p className="rounded-md bg-lemon/30 p-3 text-xs"><b>Development integration:</b> M-Pesa STK Push is not yet available from the clinic system. No prompt is sent and no money moves.</p>
      <p className="text-sm">Pay <b>KSh {amount.toLocaleString()}</b> for <b>{reference}</b></p>
      {status === "idle" || status === "failed" || status === "timeout" ? (
        <>
          <div className="space-y-1.5"><Label htmlFor="mp">M-Pesa phone number</Label><Input id="mp" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!err} />{err && <p className="text-xs text-destructive">{err}</p>}</div>
          <div className="flex gap-2"><Button onClick={start}><Smartphone className="mr-1 h-4 w-4" />{status === "idle" ? "Send STK prompt" : "Retry"}</Button>{onClose && <Button variant="outline" onClick={onClose}>Cancel</Button>}</div>
        </>
      ) : status === "pending" ? (
        <div role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Waiting for confirmation on {phone}… ({secs}s) <Button size="sm" variant="ghost" onClick={() => { if (t.current) clearInterval(t.current); setStatus("idle"); }}>Cancel</Button></div>
      ) : (
        <div role="status" className="space-y-2 text-sm">
          <p><b>Simulation finished — payment NOT recorded.</b> Reference: SIM-{reference}</p>
          <p className="text-muted-foreground">When the clinic system exposes STK Push and status endpoints, this screen will show the real result (pending, paid, failed, cancelled or timed out).</p>
          {onClose && <Button variant="outline" onClick={onClose}>Close</Button>}
        </div>
      )}
    </div>
  );
}
