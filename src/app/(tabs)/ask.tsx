import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, useWindowDimensions, View } from "react-native";

import { AppIcon } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { AppButton, AppInput, BrandHeader, Card, Screen, SectionLabel } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { copy } from "@/i18n/copy";
import { showMessage } from "@/lib/dialog";
import type { QuestionMode } from "@/types/question";

export default function Ask() {
  const { ready, language, colors, passwordConfigured, setupPassword, createQuestion } = useApp();
  const t = copy[language];
  const { width } = useWindowDimensions();
  const showInlineHistory = Platform.OS !== "ios" && (Platform.OS !== "web" || width >= 768);
  const [mode, setMode] = useState<QuestionMode>("binary");
  const [question, setQuestion] = useState("");
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSetup() {
    if (password.trim().length < 4) return setError(t.setupInvalid);
    if (password !== confirmation) return setError(t.setupMismatch);
    setBusy(true);
    try {
      await setupPassword(password);
      setPassword("");
      setConfirmation("");
      setError("");
    } catch {
      setError(t.storageError);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!question.trim()) return setError(t.questionRequired);
    setBusy(true);
    try {
      const id = await createQuestion(question, mode, note);
      setQuestion("");
      setNote("");
      setError("");
      router.push({ pathname: "/question/[id]", params: { id } });
    } catch {
      showMessage(t.storageError);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}><ActivityIndicator color={colors.accent} /></View>;
  }

  return (
    <Screen inNativeTab>
      <BrandHeader right={passwordConfigured && showInlineHistory ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.history}
          onPress={() => router.push("/history")}
          className="ui-pressable h-10 w-10 items-center justify-center rounded-full active:opacity-80"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
        >
          <AppIcon name="history" color={colors.text} size={19} />
        </Pressable>
      ) : undefined} />

      <View className="mb-6 overflow-hidden rounded-[32px] px-7 pb-7 pt-8" style={{ backgroundColor: colors.surfaceSoft }}>
        <View className="mb-5 self-start rounded-full px-3 py-1.5" style={{ backgroundColor: colors.surface }}>
          <AppText className="text-xs font-semibold" style={{ color: colors.accent }}>{t.tagline}</AppText>
        </View>
        <AppText className="mb-4 text-[36px] font-bold leading-[44px] tracking-tight">{t.homeTitle}</AppText>
        <AppText className="max-w-[390px] text-[14px] leading-[23px]" style={{ color: colors.secondary }}>{t.homeDescription}</AppText>
        <View className="mt-7 flex-row items-end justify-end">
          <View className="mr-[-18px] h-12 w-16 items-center justify-center rounded-[19px] rounded-bl-sm" style={{ backgroundColor: colors.accent }}>
            <AppText className="text-[22px] font-bold" style={{ color: colors.accentText }}>Q</AppText>
          </View>
          <View className="h-11 w-14 items-center justify-center rounded-[17px] rounded-br-sm" style={{ backgroundColor: colors.warm }}>
            <AppText className="text-[20px] font-bold" style={{ color: colors.warmText }}>A</AppText>
          </View>
        </View>
      </View>

      {!passwordConfigured ? (
        <Card>
          <View className="mb-4 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surfaceSoft }}>
            <AppIcon name="lock" color={colors.accent} size={21} />
          </View>
          <AppText className="mb-2 text-[22px] font-bold">{t.setupTitle}</AppText>
          <AppText className="mb-6 text-[14px] leading-[22px]" style={{ color: colors.secondary }}>{t.setupDescription}</AppText>
          <View className="gap-3">
            <AppInput value={password} onChangeText={(value) => { setPassword(value); setError(""); }} placeholder={t.setupPlaceholder} secureTextEntry autoCapitalize="none" maxLength={64} />
            <AppInput value={confirmation} onChangeText={(value) => { setConfirmation(value); setError(""); }} placeholder={t.setupConfirmPlaceholder} secureTextEntry autoCapitalize="none" maxLength={64} />
            {Boolean(error) && <AppText className="text-sm" style={{ color: colors.danger }}>{error}</AppText>}
            <AppButton label={t.setupAction} onPress={() => void handleSetup()} disabled={busy} />
          </View>
        </Card>
      ) : (
        <Card>
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <AppText className="text-[22px] font-bold">{t.newQuestion}</AppText>
              <AppText className="mt-1 text-[13px]" style={{ color: colors.secondary }}>{t.localOnly}</AppText>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surfaceSoft }}>
              <AppIcon name="message" color={colors.accent} size={23} />
            </View>
          </View>

          <SectionLabel>{t.modeLabel}</SectionLabel>
          <View className="mb-6 flex-row gap-2.5">
            {(["binary", "text"] as const).map((option) => {
              const selected = option === mode;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setMode(option)}
                  className="min-h-[92px] flex-1 justify-center rounded-2xl p-3.5"
                  style={{ backgroundColor: selected ? colors.surfaceSoft : colors.background, borderWidth: 1.5, borderColor: selected ? colors.accent : colors.border }}
                >
                  <AppText className="text-[15px] font-semibold" style={{ color: selected ? colors.accent : colors.text }}>
                    {option === "binary" ? t.binaryMode : t.textMode}
                  </AppText>
                  <AppText className="mt-1 text-[11px] leading-4" style={{ color: colors.secondary }}>
                    {option === "binary" ? t.modeBinaryDescription : t.modeTextDescription}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <SectionLabel>{t.questionLabel}</SectionLabel>
          <AppInput value={question} onChangeText={(value) => { setQuestion(value); setError(""); }} placeholder={t.questionPlaceholder} multiline maxLength={240} accessibilityLabel={t.questionLabel} />
          <View className="h-5" />
          <SectionLabel>{t.noteLabel}</SectionLabel>
          <AppInput value={note} onChangeText={setNote} placeholder={t.notePlaceholder} maxLength={300} accessibilityLabel={t.noteLabel} />
          {Boolean(error) && <AppText className="mt-3 text-sm" style={{ color: colors.danger }}>{error}</AppText>}
          <View className="mt-6"><AppButton label={t.create} onPress={() => void handleCreate()} disabled={busy} /></View>
        </Card>
      )}

      {passwordConfigured && showInlineHistory && (
        <Pressable accessibilityRole="button" onPress={() => router.push("/history")} className="mt-6 flex-row items-center justify-center gap-2 py-2">
          <AppIcon name="lock" color={colors.secondary} size={15} />
          <AppText className="text-[13px] font-medium" style={{ color: colors.secondary }}>{t.history}</AppText>
        </Pressable>
      )}
    </Screen>
  );
}
