import { createContext, useContext, useState, type ReactNode } from "react";

type Session = { token: string | null; setToken: (token: string | null) => void };
const BlogSession = createContext<Session | null>(null);
// Keep the bearer token out of localStorage and exported client configuration.
export function BlogSessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  return <BlogSession.Provider value={{ token, setToken }}>{children}</BlogSession.Provider>;
}
export function useBlogSession() {
  const session = useContext(BlogSession);
  if (!session) throw new Error("BlogSessionProvider is missing");
  return session;
}
