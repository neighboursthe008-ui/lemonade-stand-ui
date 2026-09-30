import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Minus, Plus, Trash2 } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/states/States";
import { MpesaCheckout } from "@/components/billing/MpesaCheckout";
import { seo } from "@/lib/seo";
import { getShopService, type PlacedOrder } from "@/services/shop/shop.service";
import { cart, useCart } from "@/stores/cart";

export const Route = createFileRoute("/cart")({
  head: () => seo("Cart & checkout", "Review your dental care products and check out."),
  component: CartPage,
});

const schema = z.object({ name: z.string().trim().min(2, "Enter your name").max(100), phone: z.string().trim().regex(/^\+?[0-9\s]{9,15}$/, "Enter a valid phone number") });

function CartPage() {
  const { items, total } = useCart();
  const [v, setV] = useState({ name: "", phone: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(v);
    if (!r.success) { setErr(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErr({}); setBusy(true);
    try { setOrder(await getShopService().checkout({ ...r.data, lines: items })); cart.clear(); } catch (x) { setErr({ name: x instanceof Error ? x.message : "Checkout failed" }); } finally { setBusy(false); }
  };
  return (
    <PublicShell>
      <PageHeader eyebrow="Shop" title={order ? "Order placed" : "Your cart"} />
      <Container className="grid gap-8 lg:grid-cols-3">
        {order ? (
          <div className="space-y-4 rounded-lg border bg-card p-6 lg:col-span-2">
            <p className="text-lg font-semibold">Order {order.order_number} — KSh {order.total.toLocaleString()}</p>
            <p className="rounded-md bg-lemon/30 p-3 text-sm"><b>Development order:</b> saved in development data only. It has not been sent to the clinic system.</p>
            <MpesaCheckout amount={order.total} reference={order.order_number} />
            <Button asChild variant="outline"><Link to="/shop">Continue shopping</Link></Button>
          </div>
        ) : !items.length ? <div className="lg:col-span-3"><EmptyState title="Your cart is empty"><Button asChild className="mt-3"><Link to="/shop">Browse the shop</Link></Button></EmptyState></div> : (
          <>
            <ul className="divide-y rounded-lg border bg-card lg:col-span-2">
              {items.map((l) => (
                <li key={l.productId} className="flex flex-wrap items-center gap-3 p-4">
                  <span className="flex-1 font-medium">{l.name}</span>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" aria-label={`Decrease ${l.name}`} onClick={() => cart.setQty(l.productId, l.qty - 1)}><Minus className="h-4 w-4" /></Button>
                    <span className="w-8 text-center" aria-live="polite">{l.qty}</span>
                    <Button size="icon" variant="outline" aria-label={`Increase ${l.name}`} onClick={() => cart.setQty(l.productId, l.qty + 1)}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <span className="w-28 text-right">KSh {(l.qty * l.price).toLocaleString()}</span>
                  <Button size="icon" variant="ghost" aria-label={`Remove ${l.name}`} onClick={() => cart.setQty(l.productId, 0)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
            <form noValidate onSubmit={checkout} className="h-fit space-y-4 rounded-lg border bg-card p-5">
              <p className="text-lg font-semibold">Total: KSh {total.toLocaleString()}</p>
              {(["name", "phone"] as const).map((k) => (
                <div key={k} className="space-y-1.5"><Label htmlFor={k}>{k === "name" ? "Full name" : "Phone"} *</Label><Input id={k} value={v[k]} aria-invalid={!!err[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />{err[k] && <p className="text-xs text-destructive">{err[k]}</p>}</div>
              ))}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Placing order…" : "Place order"}</Button>
            </form>
          </>
        )}
      </Container>
    </PublicShell>
  );
}
