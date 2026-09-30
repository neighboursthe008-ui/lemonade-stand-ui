import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container } from "@/components/public/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/states/States";
import { seo } from "@/lib/seo";
import { getShopService } from "@/services/shop/shop.service";
import { cart } from "@/stores/cart";

export const Route = createFileRoute("/shop/$id")({
  head: () => seo("Product — Lemonade Dental shop", "Dental care product details, price and availability."),
  component: Product,
});

function Product() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["shop-product", id], queryFn: () => getShopService().product(Number(id)) });
  const [qty, setQty] = useState(1);
  return (
    <PublicShell>
      <Container className="py-10">
        <Link to="/shop" className="text-sm text-muted-foreground hover:underline">← Back to shop</Link>
        {q.isLoading ? <LoadingState /> : !q.data ? <EmptyState title="Product not found" /> : (
          <div className="mt-6 max-w-xl space-y-4 rounded-lg border bg-card p-6">
            <h1 className="font-display text-3xl font-bold">{q.data.name}</h1>
            <p className="text-2xl font-bold">KSh {q.data.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">per {q.data.unit}</span></p>
            <p className="text-sm">{q.data.inStock ? "In stock" : "Out of stock"}</p>
            <div className="flex items-end gap-3">
              <label className="text-sm">Quantity<Input type="number" min={1} max={20} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="mt-1 w-24" /></label>
              <Button disabled={!q.data.inStock} onClick={() => { cart.add({ productId: q.data!.id, name: q.data!.name, price: q.data!.price }, qty); toast.success("Added to cart"); }}>Add to cart</Button>
              <Button asChild variant="outline"><Link to="/cart">View cart</Link></Button>
            </div>
          </div>
        )}
      </Container>
    </PublicShell>
  );
}
