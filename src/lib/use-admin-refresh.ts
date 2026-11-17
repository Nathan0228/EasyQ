import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { AppState, Platform } from "react-native";

export function useAdminRefresh(enabled: boolean, refresh: () => void) {
  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    const web = Platform.OS === "web" && typeof window !== "undefined";
    const check = () => {
      if (web ? document.visibilityState !== "hidden" : AppState.currentState !== "background" && AppState.currentState !== "inactive") {
        refresh();
      }
    };
    check();
    const timer = setInterval(check, 5_000);
    const appState = web ? undefined : AppState.addEventListener("change", state => {
      if (state === "active") check();
    });
    if (web) {
      document.addEventListener("visibilitychange", check);
      window.addEventListener("focus", check);
      window.addEventListener("online", check);
    }
    return () => {
      clearInterval(timer);
      appState?.remove();
      if (web) {
        document.removeEventListener("visibilitychange", check);
        window.removeEventListener("focus", check);
        window.removeEventListener("online", check);
      }
    };
  }, [enabled, refresh]));
}
