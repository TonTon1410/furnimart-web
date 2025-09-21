// src/config/nav/index.ts
import type { GetNav } from "./types";
import type { RoleKey } from "../../router/paths";
import { adminNav } from "./admin";
import { sellerNav } from "./seller";
import { managerNav } from "./manager";
import { deliveryNav } from "./delivery";

export const getNavForRole: GetNav = (role: RoleKey) => {
  switch (role) {
    case "admin":    return adminNav();
    case "seller":   return sellerNav();
    case "manager":  return managerNav();
    case "delivery": return deliveryNav();
    default:         return adminNav();
  }
};
