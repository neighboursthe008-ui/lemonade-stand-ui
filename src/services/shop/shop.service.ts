import { moduleByKey } from "@/modules/registry";
import { mockRows } from "@/modules/service";
import type { Row } from "@/modules/types";
import type { CartLine } from "@/stores/cart";

/** Public shop. Laravel shop/checkout is Blade-only (no JSON API) — mock implementation only. */
export interface ShopProduct { id: number; name: string; price: number; inStock: boolean; unit: string }
export interface PlacedOrder { order_number: string; total: number; development: true }
export interface ShopService {
  products(q?: string): Promise<ShopProduct[]>;
  product(id: number): Promise<ShopProduct | null>;
  checkout(input: { name: string; phone: string; lines: CartLine[] }): Promise<PlacedOrder>;
}

const toProduct = (r: Row): ShopProduct => ({ id: r.id, name: String(r["name"]), price: Number(r["selling_price"] ?? 0), inStock: Number(r["stock"]) > 0, unit: String(r["unit"] ?? "") });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const MockShopService: ShopService = {
  async products(q) { await wait(150); const s = (q ?? "").toLowerCase(); return mockRows(moduleByKey("inventory")!).filter((r) => r["is_active"] !== false && Number(r["selling_price"]) > 0).map(toProduct).filter((p) => !s || p.name.toLowerCase().includes(s)); },
  async product(id) { await wait(100); const r = mockRows(moduleByKey("inventory")!).find((x) => x.id === id); return r ? toProduct(r) : null; },
  async checkout({ name, phone, lines }) {
    await wait(600);
    if (!lines.length) throw new Error("Your cart is empty");
    const rows = mockRows(moduleByKey("orders")!);
    const id = Math.max(0, ...rows.map((r) => r.id)) + 1;
    const total = lines.reduce((a, b) => a + b.qty * b.price, 0);
    const order_number = `ORD-DEV-${String(id).padStart(4, "0")}`;
    rows.unshift({ id, order_number, patient_name: `${name} (${phone})`, items: lines.map((l) => `${l.qty}× ${l.name}`).join(", "), total, payment_status: "awaiting_payment", status: "pending", tracking_number: null } as Row);
    return { order_number, total, development: true };
  },
};
export const getShopService = (): ShopService => MockShopService;
