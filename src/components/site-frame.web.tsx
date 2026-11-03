import { usePathname } from "expo-router";
import type { ReactNode } from "react";
import { BrandHeaderContent } from "@/components/ui";
import { useApp } from "@/context/app-context";

export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { colors, language, questions, ready } = useApp();
  const isQuestion = pathname.startsWith("/question/");
  const question = questions.find(item => pathname === `/question/${item.id}`);
  // Preserve the distraction-free handoff screen while an answer is pending.
  const handoff = isQuestion && (!ready || Boolean(question && !question.answer));

  return <div className="site-frame" style={{ backgroundColor: colors.background }}>
    <header className="site-header" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
      <div className="site-header-inner">
        <BrandHeaderContent compact showPreferences={!handoff} subtitle={language === "zh" ? "一个人的数字花园" : "A personal digital garden"} />
      </div>
    </header>
    <div className="site-page">{children}</div>
  </div>;
}
