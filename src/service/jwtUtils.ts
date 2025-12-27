/* eslint-disable @typescript-eslint/no-explicit-any */
import { mapBackendRoleToKey, type RoleKey } from "@/router/paths";

export function safeBase64UrlDecode(b64url: string): string | null {
    try {
        const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
        const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
        return atob(b64 + pad);
    } catch {
        return null;
    }
}

export function safeDecodeJwt(token: string): any {
    try {
        const payload = token.split(".")[1];
        const json = safeBase64UrlDecode(payload);
        return json ? JSON.parse(json) : null;
    } catch {
        return null;
    }
}

export function inferRoleFromToken(token: string): RoleKey | null {
    const p = safeDecodeJwt(token);
    const rawRole =
        p?.role ??
        (Array.isArray(p?.roles) ? p.roles[0] : undefined) ??
        (Array.isArray(p?.authorities)
            ? typeof p.authorities[0] === "string"
                ? p.authorities[0]
                : p.authorities[0]?.authority
            : undefined) ??
        (Array.isArray(p?.realm_access?.roles)
            ? p.realm_access.roles[0]
            : undefined);

    return mapBackendRoleToKey(rawRole);
}

export function getStoreIdFromToken(token: string): string | null {
    const p = safeDecodeJwt(token);
    if (p?.storeId) return p.storeId;
    if (Array.isArray(p?.storeId) && p.storeId.length > 0) return p.storeId[0];
    return null;
}

export function getUserIdFromToken(token: string): string | null {
    const payload = safeDecodeJwt(token);
    return payload?.accountId || payload?.id || payload?.userId || payload?.sub || null;
}
