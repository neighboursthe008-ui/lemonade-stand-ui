import type { LucideIcon } from "lucide-react";

export type Row = Record<string, unknown> & { id: number };
export type FieldType = "text" | "email" | "tel" | "number" | "money" | "date" | "datetime" | "textarea" | "select" | "checkbox" | "patient" | "dentist";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly string[];
  /** Only shown (and only required) when this returns true. */
  showIf?: (values: Record<string, unknown>) => boolean;
  min?: number;
  help?: string;
  wide?: boolean;
}

export type ColumnFormat = "text" | "money" | "date" | "datetime" | "status" | "bool";
export interface ColumnDef { key: string; label: string; format?: ColumnFormat; hideOnMobile?: boolean }

export interface ActionDef {
  key: string;
  label: string;
  /** Row statuses for which the action is offered. */
  when?: (row: Row) => boolean;
  /** Mock: set this status. */
  to?: string;
  /** Collect extra input before running. */
  fields?: FieldDef[];
  confirm?: string;
  danger?: boolean;
  permission?: string | string[];
  /** Opens the detail view (e.g. receipt) instead of calling the service. */
  view?: boolean;
  /** Never sent to Laravel — the live endpoint is unsafe or missing. */
  mockOnly?: string;
  /** Mock implementation override. */
  mock?: (row: Row, payload: Record<string, unknown>) => Partial<Row>;
}

export interface PageActionDef { key: string; label: string; permission?: string | string[]; mockOnly?: string; mock: (rows: Row[]) => { rows: Row[]; message: string } }

export interface LaravelBinding {
  list: string;
  detail?: (id: number) => string;
  create?: boolean;
  update?: boolean;
  remove?: boolean;
  actions?: Record<string, (id: number) => string>;
  pageActions?: Record<string, string>;
}

export interface ModuleConfig {
  key: string;
  title: string;
  singular: string;
  section: string;
  icon: LucideIcon;
  description: string;
  permission?: string | string[];
  managePermission?: string | string[];
  superAdminOnly?: boolean;
  columns: ColumnDef[];
  fields: FieldDef[];
  filters?: { key: string; label: string; options: readonly string[] }[];
  actions?: ActionDef[];
  pageActions?: PageActionDef[];
  canCreate?: boolean;
  canEdit?: boolean | ((row: Row) => boolean);
  canDelete?: boolean;
  /** Payments: never editable/deletable. */
  appendOnly?: boolean;
  laravel?: LaravelBinding;
  /** Why this module runs on development data. */
  backendNote?: string;
  workflowNote?: string;
  seed: (i: number) => Omit<Row, "id">;
  seedCount: number;
}
