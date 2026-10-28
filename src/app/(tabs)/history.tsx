import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, AppState, FlatList, Platform, Pressable, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { DeleteConfirmModal } from "@/components/delete-confirm-modal";
import { AppButton, AppInput, BrandHeader, Card, Screen } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { copy } from "@/i18n/copy";
import { exportBackup, importBackup } from "@/lib/backup";
import { showMessage } from "@/lib/dialog";
import type { Question } from "@/types/question";

function formatDate(value: string, language: "zh" | "en") {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function HistoryTop({ onLock }: { onLock?: () => void }) {
  const { colors, language } = useApp();
  const t = copy[language];
  const { width } = useWindowDimensions();
  const showBack = Platform.OS !== "ios" && (Platform.OS !== "web" || width >= 768);

  return (
    <>
      <BrandHeader right={onLock ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.lock}
          onPress={onLock}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
        >
          <AppIcon name="lock" color={colors.text} size={18} />
        </Pressable>
      ) : undefined} />
      {showBack && (
        <Pressable accessibilityRole="button" onPress={() => router.replace("/")} className="mb-6 min-h-10 flex-row items-center gap-2 self-start">
          <AppIcon name="arrow" color={colors.secondary} size={17} />
          <AppText className="text-sm" style={{ color: colors.secondary }}>{t.back}</AppText>
        </Pressable>
      )}
      <View className="mb-6 overflow-hidden rounded-[32px] px-7 pb-7 pt-8" style={{ backgroundColor: colors.surfaceSoft }}>
        <View className="mb-5 self-start flex-row items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: colors.surface }}>
          <AppIcon name="lock" color={colors.accent} size={13} />
          <AppText className="text-xs font-semibold" style={{ color: colors.accent }}>{t.historyTagline}</AppText>
        </View>
        <AppText className="mb-4 text-[36px] font-bold leading-[44px] tracking-tight">{t.history}</AppText>
        <AppText className="max-w-[390px] text-[14px] leading-[23px]" style={{ color: colors.secondary }}>{t.historyHint}</AppText>
        <View className="mt-7 flex-row items-end justify-end">
          <View className="mr-[-18px] h-12 w-16 items-center justify-center rounded-[19px] rounded-bl-sm" style={{ backgroundColor: colors.accent }}>
            <AppText className="text-[22px] font-bold" style={{ color: colors.accentText }}>Q</AppText>
          </View>
          <View className="h-11 w-14 items-center justify-center rounded-[17px] rounded-br-sm" style={{ backgroundColor: colors.warm }}>
            <AppText className="text-[20px] font-bold" style={{ color: colors.warmText }}>A</AppText>
          </View>
        </View>
      </View>
    </>
  );
}

export default function History() {
  const { ready, questions, language, colors, passwordConfigured, checkPassword, deleteQuestion, mergeQuestions } = useApp();
  const t = copy[language];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useFocusEffect(useCallback(() => () => {
    setUnlocked(false);
    setQuestionToDelete(null);
  }, []));
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        setUnlocked(false);
        setQuestionToDelete(null);
      }
    });
    return () => subscription.remove();
  }, []);

  function unlock() {
    if (checkPassword(password)) {
      setUnlocked(true);
      setPassword("");
      setError("");
    } else {
      setError(t.wrongPassword);
    }
  }

  async function handleExport() {
    if (!questions.length) return showMessage(t.exportEmpty);
    setBusy(true);
    try {
      await exportBackup(questions);
    } catch {
      showMessage(t.exportError);
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    setBusy(true);
    try {
      const imported = await importBackup();
      if (!imported) return;
      const count = await mergeQuestions(imported);
      showMessage(count ? t.importSuccess.replace("{count}", String(count)) : t.importNoNew);
    } catch {
      showMessage(t.importError);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!questionToDelete || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await deleteQuestion(questionToDelete.id);
      setQuestionToDelete(null);
    } catch {
      showMessage(t.storageError);
    } finally {
      setDeleteBusy(false);
    }
  }

  function cancelDelete() {
    if (!deleteBusy) setQuestionToDelete(null);
  }

  if (!ready) {
    return <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}><ActivityIndicator color={colors.accent} /></View>;
  }

  if (!passwordConfigured || !unlocked) {
    return (
      <Screen inNativeTab>
        <HistoryTop />
        <Card>
          <View className="mb-4 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surfaceSoft }}>
            <AppIcon name="lock" color={colors.accent} size={21} />
          </View>
          <AppText className="mb-2 text-[22px] font-bold">{t.lockTitle}</AppText>
          <AppText className="mb-6 text-[14px] leading-[22px]" style={{ color: colors.secondary }}>{t.lockDescription}</AppText>
          {passwordConfigured ? (
            <View className="w-full gap-3">
              <AppInput value={password} onChangeText={(value) => { setPassword(value); setError(""); }} placeholder={t.passwordPlaceholder} secureTextEntry autoCapitalize="none" onSubmitEditing={unlock} />
              {Boolean(error) && <AppText className="text-sm" style={{ color: colors.danger }}>{error}</AppText>}
              <AppButton label={t.unlock} onPress={unlock} />
            </View>
          ) : (
            <View className="w-full"><AppButton label={t.returnHome} onPress={() => router.replace("/")} /></View>
          )}
        </Card>
      </Screen>
    );
  }

  return (
    <>
    <FlatList
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      data={questions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        alignItems: "stretch",
        flexGrow: 1,
        paddingTop: Platform.OS === "ios" ? 14 : Platform.OS === "web" ? 26 : insets.top + 14,
        paddingBottom: Platform.OS === "ios" ? 36 : Platform.OS === "web" && width < 768 ? insets.bottom + 128 : insets.bottom + 36,
      }}
      ListHeaderComponent={
        <View className="w-full px-5 sm:px-7" style={{ width: "100%", maxWidth: 650, alignSelf: "center" }}>
          <HistoryTop onLock={() => setUnlocked(false)} />
          <Card className="mb-7">
            <View className="mb-5 flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surfaceSoft }}>
                <AppIcon name="download" color={colors.accent} size={21} />
              </View>
              <View className="flex-1">
                <AppText className="text-[19px] font-bold">{t.backupTitle}</AppText>
                <AppText className="mt-1 text-[12px] leading-[18px]" style={{ color: colors.secondary }}>{t.backupDescription}</AppText>
              </View>
            </View>
            <View className="gap-3 sm:flex-row">
              <View className="sm:flex-1"><AppButton label={t.export} onPress={() => void handleExport()} disabled={busy} variant="secondary" icon={<AppIcon name="download" color={colors.text} size={17} />} /></View>
              <View className="sm:flex-1"><AppButton label={t.import} onPress={() => void handleImport()} disabled={busy} variant="secondary" icon={<AppIcon name="upload" color={colors.text} size={17} />} /></View>
            </View>
          </Card>
          <View className="mb-4 flex-row items-center justify-between px-1">
            <AppText className="text-[18px] font-bold">{t.allQuestions}</AppText>
            <View className="min-w-8 items-center rounded-full px-2.5 py-1" style={{ backgroundColor: colors.surfaceSoft }}>
              <AppText className="text-xs font-semibold" style={{ color: colors.accent }}>{questions.length}</AppText>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View className="w-full px-5 sm:px-7" style={{ width: "100%", maxWidth: 650, alignSelf: "center" }}>
          <Card className="items-center py-11">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surfaceSoft }}><AppIcon name="message" color={colors.accent} size={27} /></View>
            <AppText className="mb-2 text-lg font-bold">{t.emptyHistory}</AppText>
            <AppText className="text-center text-sm" style={{ color: colors.secondary }}>{t.emptyHistoryDescription}</AppText>
          </Card>
        </View>
      }
      renderItem={({ item }) => (
        <View className="mb-3 w-full px-5 sm:px-7" style={{ width: "100%", maxWidth: 650, alignSelf: "center" }}>
          <Card>
            <View className="mb-4 flex-row items-center justify-between gap-2">
              <AppText className="text-[12px] font-semibold" style={{ color: colors.accent }}>{t.resultQuestion}</AppText>
              <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5" style={{ backgroundColor: item.answer ? colors.surfaceSoft : colors.background }}>
                <AppIcon name={item.answer ? "check" : "message"} color={item.answer ? colors.accent : colors.secondary} size={12} />
                <AppText className="text-[11px] font-semibold" style={{ color: item.answer ? colors.accent : colors.secondary }}>
                  {item.answer ? t.answered : t.waiting}
                </AppText>
              </View>
            </View>
            <AppText className="text-[20px] font-bold leading-[30px]" selectable>{item.question}</AppText>
            <AppText className="mt-3 text-[12px]" style={{ color: colors.secondary }}>{t.createdAt} · {formatDate(item.createdAt, language)}</AppText>
            {Boolean(item.note) && (
              <View className="mt-5 rounded-2xl px-4 py-3.5" style={{ backgroundColor: colors.background }}>
                <AppText className="mb-1 text-[12px] font-semibold" style={{ color: colors.secondary }}>{t.note}</AppText>
                <AppText className="text-[14px] leading-[22px]">{item.note}</AppText>
              </View>
            )}
            {item.answer && (
              <View className="mt-5 rounded-2xl px-4 py-4" style={{ backgroundColor: colors.surfaceSoft }}>
                <AppText className="mb-2 text-[12px] font-semibold" style={{ color: colors.accent }}>{t.answer}</AppText>
                <AppText className="text-[20px] font-semibold leading-[30px]" selectable>{item.mode === "binary" ? (item.answer.value === "yes" ? t.yes : t.no) : item.answer.value}</AppText>
                <AppText className="mt-3 text-[12px]" style={{ color: colors.secondary }}>{t.answeredAt} · {formatDate(item.answer.answeredAt, language)}</AppText>
              </View>
            )}
            <View className="mt-5 flex-row items-center justify-end gap-3 border-t pt-3" style={{ borderColor: colors.border }}>
              {!item.answer && (
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/question/[id]", params: { id: item.id } })} className="min-h-10 flex-row items-center gap-1.5 px-2">
                  <AppIcon name="message" color={colors.accent} size={15} />
                  <AppText className="text-[13px] font-semibold" style={{ color: colors.accent }}>{t.showQuestion}</AppText>
                </Pressable>
              )}
              <Pressable accessibilityRole="button" onPress={() => setQuestionToDelete(item)} className="min-h-10 flex-row items-center gap-1.5 px-2">
                <AppIcon name="trash" color={colors.secondary} size={15} />
                <AppText className="text-[13px]" style={{ color: colors.secondary }}>{t.delete}</AppText>
              </Pressable>
            </View>
          </Card>
        </View>
      )}
      ListFooterComponent={<View className="w-full px-5 pt-4 sm:px-7" style={{ width: "100%", maxWidth: 650, alignSelf: "center" }}><AppText className="text-center text-[12px] leading-[19px]" style={{ color: colors.secondary }}>{t.privacyNote}</AppText></View>}
    />
    <DeleteConfirmModal
      question={questionToDelete?.question ?? null}
      busy={deleteBusy}
      onCancel={cancelDelete}
      onConfirm={() => void handleDelete()}
    />
    </>
  );
}
