import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { MockDataBanner } from "@/components/states/MockDataBanner";
import { seo } from "@/lib/seo";
import { getShopService } from "@/services/shop/shop.service";
import { cart, useCart } from "@/stores/cart";

export const Route = createFileRoute("/shop/")({
  head: () => seo("Dental care shop", "Toothbrushes, floss, mouthwash and dental care products from Munab Nursing Home."),
  component: Shop,
});

function Shop() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  useEffect(() => { const t = setTimeout(() => setDq(q), 300); return () => clearTimeout(t); }, [q]);
  const svc = getShopService();
  const res = useQuery({ queryKey: ["shop", dq], queryFn: () => svc.products(dq) });
  const { count } = useCart();
  return (
    <PublicShell>
      <PageHeader eyebrow="Shop" title="Dental care, delivered." />
      <Container className="space-y-6">
        <MockDataBanner reason="Shop catalogue and checkout have no clinic-system API yet" />
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Search products" className="pl-9" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Button asChild variant="outline"><Link to="/cart"><ShoppingCart className="mr-1 h-4 w-4" />Cart ({count})</Link></Button>
        </div>
        {res.isLoading ? <LoadingState /> : res.isError ? <ErrorState error={res.error} onRetry={() => res.refetch()} /> : !res.data?.length ? <EmptyState title="No products found" /> : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {res.data.map((p) => (
              <li key={p.id} className="flex flex-col rounded-lg border bg-card p-4">
                <Link to="/shop/$id" params={{ id: String(p.id) }} className="font-semibold hover:underline">{p.name}</Link>
                <p className="text-xs text-muted-foreground">per {p.unit}</p>
                <p className="mt-auto pt-3 text-lg font-bold">KSh {p.price.toLocaleString()}</p>
                <Button size="sm" className="mt-2" disabled={!p.inStock} onClick={() => { cart.add({ productId: p.id, name: p.name, price: p.price }); toast.success(`${p.name} added to cart`); }}>{p.inStock ? "Add to cart" : "Out of stock"}</Button>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </PublicShell>
  );
}
