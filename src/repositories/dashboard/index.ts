import { dataSourceFor } from "@/config/env";
import { MockDashboardRepository } from "@/mocks/dashboard/MockDashboardRepository";

export interface Kpi { key: string; label: string; value: string; hint: string }
export interface Activity { id: string; at: string; text: string; kind: "clinical" | "billing" | "admin" | "inventory" }
export interface DashboardData { kpis: Kpi[]; activity: Activity[]; appointmentsByDay: { day: string; count: number }[] }

export interface DashboardRepository {
  readonly source: "api" | "mock";
  forRole(role: string): Promise<DashboardData>;
}

/** LaravelDashboardRepository will be added once a KPI endpoint exists. No endpoint is invented here. */
export function getDashboardRepository(): DashboardRepository {
  dataSourceFor("dashboard", "mock");
  return MockDashboardRepository;
}
