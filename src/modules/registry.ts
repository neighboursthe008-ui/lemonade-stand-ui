import type { ModuleConfig } from "./types";
import { clinicalModules } from "./configs/clinical";
import { financeModules } from "./configs/finance";
import { operationsModules } from "./configs/operations";
import { adminModules } from "./configs/admin";
import { hospitalModules } from "./configs/hospital";

export const modules: ModuleConfig[] = [...clinicalModules, ...financeModules, ...operationsModules, ...adminModules, ...hospitalModules];
export const moduleByKey = (key: string) => modules.find((m) => m.key === key);
