import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { AppIcon } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { AppButton, AppInput, BrandHeader, Card, Screen, SectionLabel } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { copy } from "@/i18n/copy";
import { showMessage } from "@/lib/dialog";

export default function QuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready, questions, answerQuestion, language, colors } = useApp();
  const t = copy[language];
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const item = questions.find((candidate) => candidate.id === id);

  async function submit(value: string) {
    if (!item || busy) return;
    if (!value.trim()) return setError(t.answerRequired);
    setBusy(true);
    try {
      await answerQuestion(item.id, value);
      setError("");
    } catch {
      showMessage(t.storageError);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}><ActivityIndicator color={colors.accent} /></View>;
  }

  if (!item) {
    return (
      <Screen>
        <BrandHeader />
        <Card className="items-center py-12">
          <AppText className="mb-2 text-center text-[23px] font-bold">{t.notFound}</AppText>
          <AppText className="mb-7 text-center text-[14px] leading-[22px]" style={{ color: colors.secondary }}>{t.notFoundDescription}</AppText>
          <View className="w-full"><AppButton label={t.returnHome} onPress={() => router.replace("/")} /></View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <BrandHeader />
      {item.answer ? (
        <>
          <View className="mb-4 flex-row items-center gap-2 self-start rounded-full px-4 py-2" style={{ backgroundColor: colors.surfaceSoft }}>
            <AppIcon name="check" color={colors.accent} size={16} />
            <AppText className="text-xs font-semibold" style={{ color: colors.accent }}>{t.answeredTitle}</AppText>
          </View>
          <AppText className="mb-6 text-[14px] leading-[23px]" style={{ color: colors.secondary }}>{t.answeredDescription}</AppText>
          <Card className="mb-4 py-8">
            <SectionLabel>{t.resultQuestion}</SectionLabel>
            <AppText className="text-[26px] font-bold leading-[38px]" selectable>{item.question}</AppText>
          </Card>
          <Card className="mb-6 py-8">
            <SectionLabel>{t.answer}</SectionLabel>
            <AppText className={item.mode === "binary" ? "text-[32px] font-bold" : "text-[22px] font-semibold leading-[34px]"} selectable>
              {item.mode === "binary" ? (item.answer.value === "yes" ? t.yes : t.no) : item.answer.value}
            </AppText>
          </Card>
          <AppButton label={t.closeResult} onPress={() => router.replace("/")} />
        </>
      ) : (
        <>
          <View className="mb-4 flex-row items-center gap-2 rounded-full px-4 py-2 self-start" style={{ backgroundColor: colors.surfaceSoft }}>
            <AppIcon name="message" color={colors.accent} size={15} />
            <AppText className="text-xs font-semibold" style={{ color: colors.accent }}>{t.handoff}</AppText>
          </View>
          <Card className="mb-5 min-h-[220px] justify-center py-9">
            <AppText className="mb-5 text-[12px] font-semibold uppercase tracking-[2px]" style={{ color: colors.accent }}>EASYQ / QUESTION</AppText>
            <AppText className="text-[30px] font-bold leading-[43px]" selectable>{item.question}</AppText>
          </Card>
          <Card>
            <SectionLabel>{item.mode === "binary" ? t.chooseAnswer : t.writeAnswer}</SectionLabel>
            {item.mode === "binary" ? (
              <View className="mt-3 gap-3">
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => void submit("yes")}
                  className="min-h-[74px] flex-row items-center justify-between rounded-2xl px-6 active:opacity-80"
                  style={{ backgroundColor: colors.surfaceSoft, opacity: busy ? 0.55 : 1 }}
                >
                  <AppText className="text-[22px] font-bold" style={{ color: colors.accent }}>{t.yes}</AppText>
                  <AppIcon name="check" color={colors.accent} size={24} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => void submit("no")}
                  className="min-h-[74px] flex-row items-center justify-between rounded-2xl px-6 active:opacity-80"
                  style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, opacity: busy ? 0.55 : 1 }}
                >
                  <AppText className="text-[22px] font-bold">{t.no}</AppText>
                  <AppIcon name="close" color={colors.secondary} size={22} />
                </Pressable>
              </View>
            ) : (
              <View className="mt-3">
                <AppInput value={answer} onChangeText={(value) => { setAnswer(value); setError(""); }} placeholder={t.answerPlaceholder} accessibilityLabel={t.writeAnswer} multiline maxLength={2000} />
                {Boolean(error) && <AppText className="mt-3 text-sm" style={{ color: colors.danger }}>{error}</AppText>}
                <View className="mt-5"><AppButton label={t.submit} onPress={() => void submit(answer)} disabled={busy} /></View>
              </View>
            )}
          </Card>
          <AppText className="mt-6 text-center text-xs" style={{ color: colors.secondary }}>{t.handoffHint}</AppText>
        </>
      )}
    </Screen>
  );
}
