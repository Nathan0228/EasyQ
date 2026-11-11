import { useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { AppText } from "@/components/app-text";
import { useApp } from "@/context/app-context";
import { imageLoadRatio } from "@/lib/image-load-ratio";

export type PreviewImage = { url: string; description: string };

// Mounted only while open: each image starts with fresh loading/error state.
export function ImagePreview({ image, onClose }: { image: PreviewImage; onClose: () => void }) {
  const { language } = useApp();
  const zh = language === "zh";
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [ratio, setRatio] = useState(1.6);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const maxWidth = Math.max(1, Math.min(1440, width - insets.left - insets.right - 32));
  const maxHeight = Math.max(1, height - insets.top - insets.bottom - 156);
  const imageWidth = Math.min(maxWidth, maxHeight * ratio);

  return <Modal transparent visible animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
    <View
      accessibilityViewIsModal
      style={{ flex: 1, backgroundColor: "rgba(14, 18, 15, 0.94)", paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12, paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }}
    >
      <Pressable accessible={false} onPress={onClose} className="absolute inset-0" />
      <View pointerEvents="box-none" className="mb-3 flex-row items-center justify-between gap-4">
        <AppText pointerEvents="none" className="text-sm" style={{ color: "#DBE2DC" }}>{zh ? "图片预览" : "Image preview"}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={zh ? "关闭图片预览" : "Close image preview"}
          onPress={onClose}
          className="image-preview-close ui-pressable h-11 w-11 items-center justify-center rounded-full border"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)" }}
        >
          <AppIcon name="close" size={21} color="#F3F5F1" />
        </Pressable>
      </View>
      <View pointerEvents="box-none" className="min-h-0 flex-1 items-center justify-center">
        {status !== "error" && <View style={{ width: imageWidth, height: imageWidth / ratio }}>
          <Image
            accessible
            accessibilityLabel={image.description || (zh ? "文章图片" : "Article image")}
            source={{ uri: image.url }}
            resizeMode="contain"
            style={{ width: "100%", height: "100%", opacity: status === "loaded" ? 1 : 0 }}
            onLoad={event => {
              const loadedRatio = imageLoadRatio(event);
              if (loadedRatio !== undefined) setRatio(loadedRatio);
              setStatus("loaded");
            }}
            onError={() => setStatus("error")}
          />
          {status === "loading" && <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <ActivityIndicator color="#DBE2DC" accessibilityLabel={zh ? "正在加载图片" : "Loading image"} />
          </View>}
        </View>}
        {status === "error" && <AppText accessibilityLiveRegion="polite" className="px-5 text-center text-sm leading-6" style={{ color: "#DBE2DC" }}>{zh ? "图片加载失败，请关闭后重试。" : "The image could not be loaded. Close and try again."}</AppText>}
      </View>
      <View pointerEvents="none" className="mt-3 h-12 justify-center">
        {Boolean(image.description) && <AppText numberOfLines={2} className="text-center text-sm leading-6" style={{ color: "#DBE2DC" }}>{image.description}</AppText>}
      </View>
    </View>
  </Modal>;
}
