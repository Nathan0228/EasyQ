import { Modal, Pressable, View } from "react-native";

import { AppIcon } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { AppButton } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { copy } from "@/i18n/copy";

type Props = {
  question: string | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmModal({ question, busy, onCancel, onConfirm }: Props) {
  const { colors, language } = useApp();
  const t = copy[language];

  return (
    <Modal
      visible={question !== null}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center px-5 py-8" style={{ backgroundColor: "rgba(16, 24, 18, 0.58)" }}>
        <Pressable
          accessible={false}
          disabled={busy}
          onPress={onCancel}
          className="absolute inset-0"
        />
        <View
          className="w-full max-w-[430px] rounded-[28px] p-6"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="mb-5 h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surfaceSoft }}>
            <AppIcon name="trash" color={colors.danger} size={23} />
          </View>
          <AppText accessibilityRole="header" className="mb-2 text-[22px] font-bold">{t.deleteTitle}</AppText>
          <AppText className="text-[14px] leading-[22px]" style={{ color: colors.secondary }}>{t.deleteDescription}</AppText>
          {question !== null && (
            <View className="mt-5 rounded-2xl px-4 py-3.5" style={{ backgroundColor: colors.background }}>
              <AppText className="mb-1 text-[12px] font-semibold" style={{ color: colors.secondary }}>{t.resultQuestion}</AppText>
              <AppText className="text-[15px] font-semibold leading-[23px]" numberOfLines={3}>{question}</AppText>
            </View>
          )}
          <View className="mt-6 gap-3 sm:flex-row">
            <View className="sm:flex-1"><AppButton label={t.cancel} onPress={onCancel} disabled={busy} variant="secondary" /></View>
            <View className="sm:flex-1"><AppButton label={t.confirmDelete} onPress={onConfirm} disabled={busy} variant="danger" /></View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
