// src/router/paths.ts
export const DASHBOARD_BASE = "/dashboard";

export type RoleKey = "admin" | "seller" | "manager" | "delivery";

// helper: tạo path tương đối trong dashboard
export const DP = (p = "") => `${DASHBOARD_BASE}${p ? `/${p.replace(/^\//, "")}` : ""}`;

// mapping role từ backend → RoleKey
const ROLE_MAP: Record<string, RoleKey> = {
  ADMIN: "admin",
  SELLER: "seller",
  MANAGER: "manager",
  DELIVERY: "delivery",
};

export function mapBackendRoleToKey(raw?: string): RoleKey | null {
  if (!raw) return null;
  return ROLE_MAP[raw.toUpperCase()] ?? null;
}
