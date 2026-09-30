import { FileText, CreditCard, Receipt, Undo2, FileMinus, Calculator, BookOpen, NotebookPen, CalendarRange, Landmark, BarChart3 } from "lucide-react";
import { endpoints, PAYMENT_METHODS, PAYMENT_PURPOSES } from "@/api/registry";
import type { ModuleConfig, Row } from "../types";
import { at, code, day, money, patientAt, pick } from "../seedKit";

const INV_STATUS = ["draft", "sent", "partial", "paid", "overdue", "cancelled", "refunded"] as const;
const ACCT = "The clinic system has no accounting API yet — this runs on development data.";
const ACCOUNTS = ["1000 Cash", "1010 M-Pesa Till", "1020 Bank — Equity", "1100 Accounts Receivable", "2000 Accounts Payable", "4000 Consultation Revenue", "4010 Treatment Revenue", "4020 Shop Sales", "5000 Dental Supplies", "5100 Rent", "5200 Utilities"] as const;

export const financeModules: ModuleConfig[] = [
  {
    key: "invoices", title: "Invoices", singular: "Invoice", section: "Finance", icon: FileText,
    description: "Patient invoices, balances and status.", permission: "view_invoices", managePermission: "create_invoices",
    columns: [
      { key: "invoice_number", label: "Invoice" }, { key: "patient_name|patient.full_name", label: "Patient" },
      { key: "invoice_date", label: "Date", format: "date", hideOnMobile: true }, { key: "total", label: "Total", format: "money" },
      { key: "balance", label: "Balance", format: "money", hideOnMobile: true }, { key: "status", label: "Status", format: "status" },
    ],
    fields: [
      { name: "patient_id", label: "Patient", type: "patient", required: true }, { name: "invoice_date", label: "Invoice date", type: "date", required: true },
      { name: "due_date", label: "Due date", type: "date" }, { name: "subtotal", label: "Subtotal (KSh)", type: "money", required: true, min: 0 },
      { name: "discount_amount", label: "Discount (KSh)", type: "money", min: 0 }, { name: "tax_amount", label: "Tax (KSh)", type: "money", min: 0 },
      { name: "status", label: "Status", type: "select", options: INV_STATUS, required: true }, { name: "notes", label: "Notes", type: "textarea", wide: true },
    ],
    filters: [{ key: "status", label: "Status", options: INV_STATUS }],
    actions: [
      { key: "send", label: "Mark as sent", to: "sent", when: (r) => r["status"] === "draft" },
      { key: "void", label: "Cancel invoice", to: "cancelled", danger: true, confirm: "Cancel this invoice? Payments already recorded are not affected.", when: (r) => ["draft", "sent", "overdue"].includes(String(r["status"])) },
    ],
    canCreate: true, canEdit: (r) => !["paid", "cancelled", "refunded"].includes(String(r["status"])),
    laravel: { list: endpoints.invoices.list, detail: endpoints.invoices.detail, create: true, update: true },
    seedCount: 110,
    seed: (i) => {
      const total = money(i, 1500, 850); const paid = i % 4 === 0 ? 0 : i % 4 === 1 ? Math.round(total / 2) : total;
      return { ...patientAt(i), invoice_number: code("INV-2026", i), invoice_date: day(-(i % 90)), due_date: day(-(i % 90) + 14), subtotal: total, discount_amount: 0, tax_amount: 0, total, paid_amount: paid, balance: total - paid, status: paid === total ? "paid" : paid ? "partial" : i % 8 === 0 ? "overdue" : "sent", notes: null };
    },
  },
  {
    key: "payments", title: "Payments", singular: "Payment", section: "Finance", icon: CreditCard,
    description: "Append-only payment ledger. Corrections use refunds.", permission: "view_payments", managePermission: "create_payments",
    appendOnly: true,
    columns: [
      { key: "payment_number", label: "Payment" }, { key: "patient_name|patient.full_name", label: "Patient" },
      { key: "payment_reason", label: "Purpose", hideOnMobile: true }, { key: "payment_method", label: "Method", format: "status" },
      { key: "amount", label: "Amount", format: "money" }, { key: "status", label: "Status", format: "status" },
    ],
    fields: [
      { name: "patient_id", label: "Patient", type: "patient", required: true },
      { name: "payment_reason", label: "Purpose", type: "select", options: PAYMENT_PURPOSES, required: true },
      { name: "other_reason", label: "Describe the purpose", type: "text", required: true, showIf: (v) => v["payment_reason"] === "Other" },
      { name: "payment_method", label: "Method", type: "select", options: PAYMENT_METHODS, required: true },
      { name: "phone", label: "M-Pesa phone number", type: "tel", required: true, showIf: (v) => v["payment_method"] === "mpesa", help: "STK Push is not connected — record the M-Pesa reference after the patient pays." },
      { name: "transaction_reference", label: "Transaction reference", type: "text", required: true, showIf: (v) => ["mpesa", "card", "bank"].includes(String(v["payment_method"])) },
      { name: "amount", label: "Amount (KSh)", type: "money", required: true, min: 1 },
    ],
    filters: [{ key: "payment_method", label: "Method", options: PAYMENT_METHODS }, { key: "status", label: "Status", options: ["completed", "pending", "refunded"] }],
    actions: [
      { key: "receipt", label: "View receipt", view: true },
      { key: "refund", label: "Refund", danger: true, when: (r) => r["status"] === "completed", mockOnly: "Refunds have no JSON API yet — recorded in development data only.",
        fields: [{ name: "refund_amount", label: "Refund amount (KSh)", type: "money", required: true, min: 1 }, { name: "refund_reason", label: "Reason", type: "textarea", required: true }], to: "refunded" },
    ],
    canCreate: true, canEdit: false, canDelete: false,
    laravel: { list: endpoints.payments.list, detail: endpoints.payments.detail, create: true },
    seedCount: 130,
    seed: (i) => ({ ...patientAt(i), payment_number: code("PAY-2026", i), payment_reason: pick(PAYMENT_PURPOSES.slice(0, 10), i), payment_method: pick(["mpesa", "cash", "mpesa", "card", "insurance"], i), transaction_reference: i % 5 === 1 ? null : `QK${(837461 + i * 97).toString(36).toUpperCase()}`, amount: money(i, 500, 500), status: i % 23 === 0 ? "refunded" : "completed", paid_at: at(-(i % 60), 9 + (i % 8)) }),
  },
  {
    key: "receipts", title: "Receipts", singular: "Receipt", section: "Finance", icon: Receipt,
    description: "Printable receipts for completed payments.", permission: "view_payments", backendNote: "Receipts are generated from payments; no separate receipt API.",
    columns: [{ key: "receipt_number", label: "Receipt" }, { key: "patient_name", label: "Patient" }, { key: "issued_at", label: "Issued", format: "datetime", hideOnMobile: true }, { key: "amount", label: "Amount", format: "money" }],
    fields: [], actions: [{ key: "print", label: "View / print", view: true }], canCreate: false, canEdit: false, canDelete: false, seedCount: 60,
    seed: (i) => ({ ...patientAt(i), receipt_number: code("RCT-2026", i), payment_number: code("PAY-2026", i), issued_at: at(-(i % 60), 10), amount: money(i, 500, 500) }),
  },
  {
    key: "refunds", title: "Refunds", singular: "Refund", section: "Finance", icon: Undo2,
    description: "Refund requests and approvals.", permission: "view_payments", managePermission: "create_payments", backendNote: "No refund JSON API in the clinic system yet.",
    columns: [{ key: "refund_number", label: "Refund" }, { key: "patient_name", label: "Patient" }, { key: "amount", label: "Amount", format: "money" }, { key: "reason", label: "Reason", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [{ name: "patient_id", label: "Patient", type: "patient", required: true }, { name: "payment_number", label: "Original payment no.", type: "text", required: true }, { name: "amount", label: "Amount (KSh)", type: "money", required: true, min: 1 }, { name: "reason", label: "Reason", type: "textarea", required: true, wide: true }],
    filters: [{ key: "status", label: "Status", options: ["requested", "approved", "paid", "rejected"] }],
    actions: [
      { key: "approve", label: "Approve", to: "approved", when: (r) => r["status"] === "requested" },
      { key: "pay", label: "Mark paid out", to: "paid", confirm: "Confirm the refund has been paid to the patient?", when: (r) => r["status"] === "approved" },
      { key: "reject", label: "Reject", to: "rejected", danger: true, when: (r) => r["status"] === "requested" },
    ],
    canCreate: true, canEdit: false, seedCount: 8,
    seed: (i) => ({ ...patientAt(i), refund_number: code("RF-2026", i), payment_number: code("PAY-2026", i * 23), amount: money(i, 500), reason: "Service not rendered", status: pick(["requested", "approved", "paid", "rejected"], i) }),
  },
  {
    key: "credit-notes", title: "Credit Notes", singular: "Credit note", section: "Finance", icon: FileMinus,
    description: "Credits against invoices.", permission: "view_invoices", managePermission: "create_invoices", backendNote: "No credit note API yet.",
    columns: [{ key: "number", label: "Credit note" }, { key: "patient_name", label: "Patient" }, { key: "invoice_number", label: "Invoice", hideOnMobile: true }, { key: "amount", label: "Amount", format: "money" }, { key: "status", label: "Status", format: "status" }],
    fields: [{ name: "patient_id", label: "Patient", type: "patient", required: true }, { name: "invoice_number", label: "Invoice no.", type: "text", required: true }, { name: "amount", label: "Amount (KSh)", type: "money", required: true, min: 1 }, { name: "reason", label: "Reason", type: "textarea", required: true, wide: true }],
    actions: [{ key: "apply", label: "Apply to invoice", to: "applied", when: (r) => r["status"] === "issued" }],
    canCreate: true, canEdit: false, canDelete: false, seedCount: 6,
    seed: (i) => ({ ...patientAt(i), number: code("CN-2026", i), invoice_number: code("INV-2026", i * 5), amount: money(i, 300), reason: "Overcharge correction", status: i % 2 ? "applied" : "issued" }),
  },
  {
    key: "pos", title: "POS Sales", singular: "Sale", section: "Finance", icon: Calculator,
    description: "Counter sales of products and services.", permission: "view_payments", managePermission: "create_payments", backendNote: "No POS API yet.",
    columns: [{ key: "sale_number", label: "Sale" }, { key: "item", label: "Item" }, { key: "quantity", label: "Qty" }, { key: "total", label: "Total", format: "money" }, { key: "payment_method", label: "Method", format: "status", hideOnMobile: true }],
    fields: [
      { name: "item", label: "Item", type: "select", options: ["Toothbrush (soft)", "Fluoride toothpaste", "Dental floss", "Mouthwash 250ml", "Interdental brushes"], required: true },
      { name: "quantity", label: "Quantity", type: "number", required: true, min: 1 }, { name: "total", label: "Total (KSh)", type: "money", required: true, min: 1 },
      { name: "payment_method", label: "Method", type: "select", options: PAYMENT_METHODS, required: true },
    ],
    canCreate: true, canEdit: false, canDelete: false, seedCount: 25,
    seed: (i) => ({ sale_number: code("POS", i), item: pick(["Toothbrush (soft)", "Fluoride toothpaste", "Dental floss", "Mouthwash 250ml"], i), quantity: 1 + (i % 3), total: 250 * (1 + (i % 3)), payment_method: pick(["cash", "mpesa"], i) }),
  },
  {
    key: "accounts", title: "Chart of Accounts", singular: "Account", section: "Accounting", icon: BookOpen,
    description: "Ledger accounts by type.", permission: "view_accounting", managePermission: "view_accounting", backendNote: ACCT,
    columns: [{ key: "code", label: "Code" }, { key: "name", label: "Account" }, { key: "type", label: "Type", format: "status" }, { key: "balance", label: "Balance", format: "money" }],
    fields: [{ name: "code", label: "Code", type: "text", required: true }, { name: "name", label: "Name", type: "text", required: true }, { name: "type", label: "Type", type: "select", options: ["asset", "liability", "equity", "revenue", "expense"], required: true }],
    filters: [{ key: "type", label: "Type", options: ["asset", "liability", "equity", "revenue", "expense"] }],
    canCreate: true, canEdit: true, canDelete: true, seedCount: ACCOUNTS.length,
    seed: (i) => { const a = ACCOUNTS[ACCOUNTS.length - 1 - i]!; const c = a.slice(0, 4); return { code: c, name: a.slice(5), type: c < "2000" ? "asset" : c < "3000" ? "liability" : c < "5000" ? "revenue" : "expense", balance: 20000 + (i * 13337) % 400000 }; },
  },
  {
    key: "journal-entries", title: "Journal Entries", singular: "Journal entry", section: "Accounting", icon: NotebookPen,
    description: "Double-entry postings. Debit and credit always balance.", permission: "view_accounting", managePermission: "view_accounting", backendNote: ACCT,
    columns: [{ key: "entry_number", label: "Entry" }, { key: "date", label: "Date", format: "date" }, { key: "description", label: "Description", hideOnMobile: true }, { key: "debit_account", label: "Debit" }, { key: "credit_account", label: "Credit", hideOnMobile: true }, { key: "amount", label: "Amount", format: "money" }, { key: "status", label: "Status", format: "status" }],
    fields: [
      { name: "date", label: "Date", type: "date", required: true }, { name: "description", label: "Description", type: "text", required: true },
      { name: "debit_account", label: "Debit account", type: "select", options: ACCOUNTS, required: true },
      { name: "credit_account", label: "Credit account", type: "select", options: ACCOUNTS, required: true },
      { name: "amount", label: "Amount (KSh) — posted to both sides", type: "money", required: true, min: 1 },
    ],
    filters: [{ key: "status", label: "Status", options: ["draft", "posted", "reversed"] }],
    actions: [
      { key: "post", label: "Post entry", to: "posted", confirm: "Post this entry? Posted entries cannot be edited.", when: (r) => r["status"] === "draft" },
      { key: "reverse", label: "Reverse", to: "reversed", danger: true, confirm: "Create a reversal for this entry?", when: (r) => r["status"] === "posted" },
    ],
    validate: (v) => (v["debit_account"] && v["debit_account"] === v["credit_account"] ? { credit_account: "Debit and credit accounts must differ" } : {}),
    canCreate: true, canEdit: (r: Row) => r["status"] === "draft", canDelete: false, seedCount: 40,
    seed: (i) => ({ entry_number: code("JE-2026", i), date: day(-(i % 60)), description: pick(["Daily cash takings", "M-Pesa settlement", "Supplies purchase", "Rent — September"], i), debit_account: pick(["1000 Cash", "1010 M-Pesa Till", "5000 Dental Supplies", "5100 Rent"], i), credit_account: pick(["4000 Consultation Revenue", "4010 Treatment Revenue", "2000 Accounts Payable", "1020 Bank — Equity"], i), amount: money(i, 5000, 1500), status: i < 3 ? "draft" : "posted" }),
  },
  {
    key: "accounting-periods", title: "Accounting Periods", singular: "Period", section: "Accounting", icon: CalendarRange,
    description: "Open and close monthly periods.", permission: "view_accounting", managePermission: "view_accounting", backendNote: ACCT,
    columns: [{ key: "name", label: "Period" }, { key: "starts_on", label: "Starts", format: "date" }, { key: "ends_on", label: "Ends", format: "date" }, { key: "status", label: "Status", format: "status" }],
    fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "starts_on", label: "Start", type: "date", required: true }, { name: "ends_on", label: "End", type: "date", required: true }],
    actions: [{ key: "close", label: "Close period", to: "closed", confirm: "Close this period? No more postings will be allowed.", when: (r) => r["status"] === "open" }, { key: "reopen", label: "Reopen", to: "open", when: (r) => r["status"] === "closed" }],
    canCreate: true, canEdit: false, seedCount: 9,
    seed: (i) => { const m = 9 - i; return { name: `2026-${String(m).padStart(2, "0")}`, starts_on: `2026-${String(m).padStart(2, "0")}-01`, ends_on: `2026-${String(m).padStart(2, "0")}-28`, status: i === 0 ? "open" : "closed" }; },
  },
  {
    key: "bank-reconciliation", title: "Bank Reconciliation", singular: "Statement line", section: "Accounting", icon: Landmark,
    description: "Match bank statement lines to ledger entries.", permission: "view_accounting", managePermission: "view_accounting", backendNote: ACCT,
    columns: [{ key: "date", label: "Date", format: "date" }, { key: "description", label: "Description" }, { key: "amount", label: "Amount", format: "money" }, { key: "status", label: "Status", format: "status" }],
    fields: [{ name: "date", label: "Date", type: "date", required: true }, { name: "description", label: "Description", type: "text", required: true }, { name: "amount", label: "Amount (KSh)", type: "money", required: true }],
    actions: [{ key: "match", label: "Mark matched", to: "matched", when: (r) => r["status"] === "unmatched" }, { key: "unmatch", label: "Unmatch", to: "unmatched", when: (r) => r["status"] === "matched" }],
    canCreate: true, canEdit: false, seedCount: 20,
    seed: (i) => ({ date: day(-i), description: pick(["M-Pesa settlement", "Card settlement", "Supplier payment", "Bank charges"], i), amount: money(i, 3000, 900), status: i < 6 ? "unmatched" : "matched" }),
  },
  {
    key: "accounting-reports", title: "Financial Statements", singular: "Statement", section: "Accounting", icon: BarChart3,
    description: "Trial balance, P&L, receivables and payables.", permission: "view_accounting", backendNote: ACCT,
    columns: [{ key: "name", label: "Statement" }, { key: "period", label: "Period" }, { key: "total", label: "Total", format: "money" }, { key: "status", label: "Status", format: "status" }],
    fields: [], actions: [{ key: "view", label: "View statement", view: true }], canCreate: false, canEdit: false, canDelete: false, seedCount: 6,
    seed: (i) => ({ name: pick(["Trial Balance", "Profit & Loss", "Balance Sheet", "General Ledger", "Accounts Receivable ageing", "Accounts Payable ageing"], i), period: "2026-09", total: 180000 + i * 42500, status: "balanced" }),
  },
];
