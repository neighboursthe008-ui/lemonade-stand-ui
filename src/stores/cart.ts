import { useSyncExternalStore } from "react";

export interface CartLine { productId: number; name: string; price: number; qty: number }
let lines: CartLine[] = [];
const subs = new Set<() => void>();
const emit = () => { subs.forEach((s) => s()); try { localStorage.setItem("lemonade-cart", JSON.stringify(lines)); } catch { /* storage unavailable */ } };
let hydrated = false;
const hydrate = () => { if (hydrated || typeof window === "undefined") return; hydrated = true; try { lines = JSON.parse(localStorage.getItem("lemonade-cart") ?? "[]") as CartLine[]; } catch { lines = []; } };

export const cart = {
  add(l: Omit<CartLine, "qty">, qty = 1) { const e = lines.find((x) => x.productId === l.productId); lines = e ? lines.map((x) => (x === e ? { ...x, qty: x.qty + qty } : x)) : [...lines, { ...l, qty }]; emit(); },
  setQty(id: number, qty: number) { lines = qty <= 0 ? lines.filter((x) => x.productId !== id) : lines.map((x) => (x.productId === id ? { ...x, qty } : x)); emit(); },
  clear() { lines = []; emit(); },
};
const EMPTY: CartLine[] = [];
export function useCart() {
  const items = useSyncExternalStore((cb) => { hydrate(); subs.add(cb); cb(); return () => subs.delete(cb); }, () => lines, () => EMPTY);
  return { items, count: items.reduce((a, b) => a + b.qty, 0), total: items.reduce((a, b) => a + b.qty * b.price, 0) };
}
