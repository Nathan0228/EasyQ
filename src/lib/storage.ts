import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const STORAGE_KEYS = {
  questions: "easyq.questions.v1",
  language: "easyq.language.v1",
  theme: "easyq.theme.v1",
  passcode: "easyq.passcode.v1",
} as const;

export async function getStored(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  }
  return AsyncStorage.getItem(key);
}

export async function setStored(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}
