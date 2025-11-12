// src/router/paths.ts
export const DASHBOARD_BASE = "/dashboard";

export type RoleKey = "admin" | "seller" | "manager" | "delivery" | "customer";

// helper: tạo path tương đối trong dashboard
export const DP = (p = "") =>
  `${DASHBOARD_BASE}${p ? `/${p.replace(/^\//, "")}` : ""}`;

// mapping role từ backend → RoleKey
const ROLE_MAP: Record<string, RoleKey> = {
  ADMIN: "admin",
  SELLER: "seller",
  MANAGER: "manager",
  DELIVERY: "delivery",
  BRANCH_MANAGER: "manager",
  STAFF: "seller",
  CUSTOMER: "customer",
};

export function mapBackendRoleToKey(raw?: string): RoleKey | null {
  if (!raw) return null;
  // Normalize common patterns: strip leading ROLE_ if present, then uppercase
  const normalized = raw
    .toString()
    .replace(/^ROLE_/i, "")
    .toUpperCase();
  return ROLE_MAP[normalized] ?? null;
}
