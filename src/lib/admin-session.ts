export type AdminSession = { token: string; expiresAt: string };

// Separate sessions when switching between API deployments.
const key = `easyq.admin-session.v1:${process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""}`;

export function validAdminSession(value: unknown, now = Date.now()): value is AdminSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AdminSession>;
  return typeof session.token === "string" && /^[a-f0-9]{64}$/.test(session.token)
    && typeof session.expiresAt === "string" && Date.parse(session.expiresAt) > now;
}

export function readAdminSession(): AdminSession | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const session: unknown = JSON.parse(raw);
    if (validAdminSession(session)) return session;
    window.sessionStorage.removeItem(key);
  } catch {
    // Browsers may disable storage; login still works in memory.
    writeAdminSession(null);
  }
  return null;
}

export function writeAdminSession(session: AdminSession | null): void {
  try {
    if (typeof window === "undefined") return;
    if (session) window.sessionStorage.setItem(key, JSON.stringify(session));
    else window.sessionStorage.removeItem(key);
  } catch {
    // Keep the current in-memory session usable if storage is unavailable.
  }
}
