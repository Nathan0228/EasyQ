import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { readAdminSession, validAdminSession, writeAdminSession, type AdminSession } from "@/lib/admin-session";

type Session = { token: string | null; setToken: (...args: [token: null] | [token: string, expiresAt: string]) => void };
const BlogSession = createContext<Session | null>(null);
// Web sessions survive reloads within this tab; native sessions stay in memory.
export function BlogSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(readAdminSession);
  const setToken = useCallback((token: string | null, expiresAt?: string) => {
    const candidate = token ? { token, expiresAt } : null;
    const next = validAdminSession(candidate) ? candidate : null;
    writeAdminSession(next);
    setSession(next);
  }, []);

  useEffect(() => {
    if (!session) return;
    const checkExpiry = () => { if (!validAdminSession(session)) setToken(null); };
    const timer = setTimeout(checkExpiry, Math.min(Math.max(0, Date.parse(session.expiresAt) - Date.now()), 2147483647));
    if (typeof window !== "undefined") window.addEventListener("focus", checkExpiry);
    return () => {
      clearTimeout(timer);
      if (typeof window !== "undefined") window.removeEventListener("focus", checkExpiry);
    };
  }, [session, setToken]);

  return <BlogSession.Provider value={{ token: session?.token ?? null, setToken }}>{children}</BlogSession.Provider>;
}
export function useBlogSession() {
  const session = useContext(BlogSession);
  if (!session) throw new Error("BlogSessionProvider is missing");
  return session;
}
