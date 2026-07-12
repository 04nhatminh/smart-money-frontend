// dataRefreshEmitter.ts
// Fired after the AI chat confirms/executes a real budget or project mutation
// (create/update/delete), so other screens holding their own local copies of
// that data (budgets.tsx, project.tsx, home.tsx — there is no shared
// context/query cache for this data) know to re-fetch instead of showing
// stale values.
import { EventEmitter } from "eventemitter3";
export const dataRefreshEmitter = new EventEmitter();
export const FINANCIAL_DATA_UPDATED = "FINANCIAL_DATA_UPDATED";
