import type { ReactNode } from "react";

// Native screens keep their own headers and safe-area layout.
export function SiteFrame({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
