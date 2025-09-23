// src/routes/paths.ts
export const DASHBOARD_BASE = "/dashboard";

export type RoleKey = "admin" | "seller" | "manager" | "delivery";

// helper: tạo path tương đối trong dashboard
export const DP = (p = "") => `${DASHBOARD_BASE}${p ? `/${p.replace(/^\//, "")}` : ""}`;
