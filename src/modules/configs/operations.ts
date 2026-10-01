import { Boxes, Tags, Truck, ArrowLeftRight, ShoppingCart, SlidersHorizontal, ShoppingBag, Bell } from "lucide-react";
import { endpoints } from "@/api/registry";
import type { ModuleConfig } from "../types";
import { at, code, day, money, patientAt, pick } from "../seedKit";

const PRODUCTS = ["Lidocaine 2% cartridges", "Nitrile gloves (M)", "Composite resin A2", "Prophy paste", "Dental floss", "Fluoride toothpaste", "Face masks", "Impression alginate", "Gutta percha points", "Toothbrush (soft)"];
const NOTIF_TYPES = ["appointment", "payment", "queue", "clinical", "inventory", "order", "system"] as const;

export const operationsModules: ModuleConfig[] = [
  {
    key: "inventory", title: "Products & Stock", singular: "Product", section: "Inventory", icon: Boxes,
    description: "Stock levels, reorder points and expiry.", permission: "view_inventory", managePermission: "view_inventory",
    columns: [
      { key: "name", label: "Product" }, { key: "sku", label: "SKU", hideOnMobile: true }, { key: "stock", label: "In stock" },
      { key: "minimum_stock", label: "Reorder at", hideOnMobile: true }, { key: "selling_price", label: "Price", format: "money", hideOnMobile: true }, { key: "expiry_date", label: "Expiry", format: "date", hideOnMobile: true },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true }, { name: "sku", label: "SKU", type: "text" },
      { name: "unit", label: "Unit", type: "text", required: true }, { name: "cost_price", label: "Cost price (KSh)", type: "money", required: true, min: 0 },
      { name: "selling_price", label: "Selling price (KSh)", type: "money", min: 0 }, { name: "minimum_stock", label: "Minimum stock", type: "number", required: true, min: 0 },
      { name: "batch_number", label: "Batch number", type: "text" }, { name: "expiry_date", label: "Expiry date", type: "date" },
    ],
    actions: [{ key: "adjust", label: "Adjust stock", fields: [{ name: "stock", label: "New stock count", type: "number", required: true, min: 0 }, { name: "adjust_reason", label: "Reason", type: "text", required: true }], mockOnly: "Stock adjustments have no JSON API yet — development data only." }],
    canCreate: true, canEdit: true, canDelete: true,
    laravel: { list: endpoints.inventory.products, detail: endpoints.inventory.product, create: true, update: true, remove: true },
    seedCount: 40,
    seed: (i) => ({ name: `${pick(PRODUCTS, i)}${i >= PRODUCTS.length ? ` (${Math.floor(i / PRODUCTS.length) + 1})` : ""}`, sku: code("SKU", i, 5), unit: pick(["box", "pack", "tube", "piece"], i), cost_price: money(i, 200, 90), selling_price: money(i, 350, 120), minimum_stock: 10 + (i % 5) * 5, stock: (i * 17) % 80, batch_number: code("B26", i), expiry_date: day(30 + (i * 23) % 500), is_active: true }),
  },
  {
    key: "categories", title: "Categories", singular: "Category", section: "Inventory", icon: Tags,
    description: "Product categories.", permission: "view_inventory", managePermission: "view_inventory",
    columns: [{ key: "name", label: "Category" }, { key: "description", label: "Description", hideOnMobile: true }],
    fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "description", label: "Description", type: "textarea", wide: true }],
    canCreate: true, canEdit: true, canDelete: true, laravel: { list: endpoints.inventory.categories }, seedCount: 6,
    seed: (i) => ({ name: pick(["Anaesthetics", "PPE", "Restorative", "Hygiene", "Endodontic", "Retail"], i), description: null }),
  },
  {
    key: "suppliers", title: "Suppliers", singular: "Supplier", section: "Inventory", icon: Truck,
    description: "Supplier contacts.", permission: "view_inventory", managePermission: "view_inventory",
    columns: [{ key: "name", label: "Supplier" }, { key: "contact_person", label: "Contact", hideOnMobile: true }, { key: "phone", label: "Phone" }, { key: "email", label: "Email", hideOnMobile: true }],
    fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "contact_person", label: "Contact person", type: "text" }, { name: "phone", label: "Phone", type: "tel", required: true }, { name: "email", label: "Email", type: "email" }],
    canCreate: true, canEdit: true, canDelete: true, laravel: { list: endpoints.inventory.suppliers }, seedCount: 6,
    seed: (i) => ({ name: `${pick(["Dentamed", "Kiri Medical", "Nairobi Dental Supplies", "Afya Traders", "SmileCare", "Ortho East"], i)} (dev)`, contact_person: "Sales desk", phone: `07${20000000 + i * 1111}`, email: `sales${i}@supplier.example` }),
  },
  {
    key: "purchase-orders", title: "Purchasing", singular: "Purchase order", section: "Inventory", icon: ShoppingCart,
    description: "Purchase orders and goods receiving.", permission: "view_inventory", managePermission: "view_inventory", backendNote: "No purchasing API yet.",
    columns: [{ key: "po_number", label: "PO" }, { key: "supplier", label: "Supplier" }, { key: "total", label: "Total", format: "money" }, { key: "expected_on", label: "Expected", format: "date", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [{ name: "supplier", label: "Supplier", type: "text", required: true }, { name: "items", label: "Items", type: "textarea", required: true, wide: true }, { name: "total", label: "Total (KSh)", type: "money", required: true, min: 1 }, { name: "expected_on", label: "Expected delivery", type: "date" }],
    filters: [{ key: "status", label: "Status", options: ["draft", "ordered", "received", "cancelled"] }],
    actions: [
      { key: "order", label: "Send to supplier", to: "ordered", when: (r) => r["status"] === "draft" },
      { key: "receive", label: "Receive goods", to: "received", confirm: "Mark all items as received into stock?", when: (r) => r["status"] === "ordered" },
      { key: "cancel", label: "Cancel", to: "cancelled", danger: true, when: (r) => ["draft", "ordered"].includes(String(r["status"])) },
    ],
    canCreate: true, canEdit: (r) => r["status"] === "draft", seedCount: 12,
    seed: (i) => ({ po_number: code("PO-2026", i), supplier: `${pick(["Dentamed", "Kiri Medical", "Afya Traders"], i)} (dev)`, items: pick(PRODUCTS, i), total: money(i, 8000, 2500), expected_on: day(7 - i), status: pick(["draft", "ordered", "received", "received"], i) }),
  },
  {
    key: "stock-movements", title: "Stock Movements", singular: "Movement", section: "Inventory", icon: ArrowLeftRight,
    description: "Receipts, issues, transfers and adjustments.", permission: "view_inventory", managePermission: "view_inventory", backendNote: "No stock movement API yet.",
    columns: [{ key: "date", label: "Date", format: "date" }, { key: "product", label: "Product" }, { key: "type", label: "Type", format: "status" }, { key: "quantity", label: "Qty" }, { key: "reference", label: "Ref", hideOnMobile: true }],
    fields: [{ name: "product", label: "Product", type: "select", options: PRODUCTS, required: true }, { name: "type", label: "Type", type: "select", options: ["receipt", "issue", "transfer", "adjustment"], required: true }, { name: "quantity", label: "Quantity", type: "number", required: true, min: 1 }, { name: "reference", label: "Reference", type: "text" }],
    filters: [{ key: "type", label: "Type", options: ["receipt", "issue", "transfer", "adjustment"] }],
    canCreate: true, canEdit: false, canDelete: false, seedCount: 60,
    seed: (i) => ({ date: day(-(i % 45)), product: pick(PRODUCTS, i), type: pick(["issue", "receipt", "issue", "adjustment", "transfer"], i), quantity: 1 + (i % 12), reference: code("MV", i) }),
  },
  {
    key: "stock-transfers", title: "Transfers", singular: "Transfer", section: "Inventory", icon: SlidersHorizontal,
    description: "Move stock between branches.", permission: "view_inventory", managePermission: "view_inventory", backendNote: "No transfer API yet.",
    columns: [{ key: "number", label: "Transfer" }, { key: "product", label: "Product" }, { key: "quantity", label: "Qty" }, { key: "to_branch", label: "To branch", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [{ name: "product", label: "Product", type: "select", options: PRODUCTS, required: true }, { name: "quantity", label: "Quantity", type: "number", required: true, min: 1 }, { name: "to_branch", label: "To branch", type: "select", options: ["Westlands (dev)", "Kilimani (dev)"], required: true }],
    actions: [{ key: "dispatch", label: "Dispatch", to: "in_transit", when: (r) => r["status"] === "requested" }, { key: "receive", label: "Receive", to: "received", when: (r) => r["status"] === "in_transit" }],
    canCreate: true, canEdit: false, seedCount: 6,
    seed: (i) => ({ number: code("TR", i), product: pick(PRODUCTS, i), quantity: 5 + i, to_branch: pick(["Westlands (dev)", "Kilimani (dev)"], i), status: pick(["requested", "in_transit", "received"], i) }),
  },
  {
    key: "orders", title: "Pharmacy Orders", singular: "Order", section: "Inventory", icon: ShoppingBag,
    description: "Pharmacy and supply orders, fulfilment and tracking.", permission: "view_inventory", managePermission: "view_inventory", backendNote: "No shop order JSON API yet.",
    columns: [{ key: "order_number", label: "Order" }, { key: "patient_name", label: "Customer" }, { key: "items", label: "Items", hideOnMobile: true }, { key: "total", label: "Total", format: "money" }, { key: "payment_status", label: "Payment", format: "status", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [{ name: "patient_id", label: "Customer (patient)", type: "patient", required: true }, { name: "items", label: "Items", type: "textarea", required: true, wide: true }, { name: "total", label: "Total (KSh)", type: "money", required: true, min: 1 }],
    filters: [{ key: "status", label: "Status", options: ["pending", "processing", "shipped", "delivered", "cancelled"] }],
    actions: [
      { key: "process", label: "Start processing", to: "processing", when: (r) => r["status"] === "pending" },
      { key: "ship", label: "Mark shipped", to: "shipped", fields: [{ name: "tracking_number", label: "Tracking number", type: "text", required: true }], when: (r) => r["status"] === "processing" },
      { key: "deliver", label: "Mark delivered", to: "delivered", when: (r) => r["status"] === "shipped" },
      { key: "cancel", label: "Cancel order", to: "cancelled", danger: true, confirm: "Cancel this order and release stock?", when: (r) => ["pending", "processing"].includes(String(r["status"])) },
    ],
    canCreate: true, canEdit: false, seedCount: 30,
    seed: (i) => ({ ...patientAt(i), order_number: code("ORD-2026", i), items: `${1 + (i % 3)}× ${pick(PRODUCTS.slice(4), i)}`, total: money(i, 450, 150), payment_status: i % 4 === 0 ? "awaiting_payment" : "paid", tracking_number: null, status: pick(["pending", "processing", "shipped", "delivered", "delivered"], i) }),
  },
  {
    key: "notifications", title: "Notifications", singular: "Notification", section: "Communication", icon: Bell,
    description: "Alerts for appointments, payments, queue, clinical, stock and system.", permission: "view_notifications",
    columns: [{ key: "created_at", label: "When", format: "datetime" }, { key: "title", label: "Title" }, { key: "type", label: "Type", format: "status", hideOnMobile: true }, { key: "read", label: "Read", format: "bool" }],
    fields: [{ name: "title", label: "Title", type: "text", required: true }, { name: "type", label: "Type", type: "select", options: NOTIF_TYPES, required: true }, { name: "message", label: "Message", type: "textarea", required: true, wide: true }],
    filters: [{ key: "type", label: "Type", options: NOTIF_TYPES }],
    actions: [{ key: "markRead", label: "Mark as read", when: (r) => !r["read"], mock: () => ({ read: true }), mockOnly: "Marking read has no JSON API yet — development data only." }],
    pageActions: [{ key: "markAllRead", label: "Mark all as read", mockOnly: "(development data)", mock: (rows) => ({ rows: rows.map((r) => ({ ...r, read: true })), message: "All notifications marked as read." }) }],
    canCreate: true, canEdit: false, canDelete: true,
    laravel: { list: endpoints.notifications.list, detail: endpoints.notifications.detail },
    seedCount: 24,
    seed: (i) => ({ created_at: at(0, 9, -i * 23), title: pick(["Appointment booked", "Payment received", "Patient waiting > 15 min", "Lab result ready", "Low stock: Nitrile gloves", "New shop order", "Backup completed"], i), type: pick(NOTIF_TYPES, i), message: `Development notification #${i + 1}.`, read: i > 2 }),
  },
];
