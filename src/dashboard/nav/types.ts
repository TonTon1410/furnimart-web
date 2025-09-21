// src/config/nav/types.ts
import type { ReactNode } from "react";
import type { RoleKey } from "../../router/paths";

export type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

export type RoleNav = {
  main: NavItem[];
  others?: NavItem[];
};

export type GetNav = (role: RoleKey) => RoleNav;
