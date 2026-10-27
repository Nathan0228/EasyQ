import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { isQuestion } from "@/lib/backup";
import { getStored, setStored, STORAGE_KEYS } from "@/lib/storage";
import type { Language } from "@/i18n/copy";
import type { Question, QuestionMode } from "@/types/question";

type Theme = "light" | "dark";

export const palette = {
  light: {
    background: "#F6F4EF",
    surface: "#FFFEFA",
    surfaceSoft: "#E8EEE8",
    text: "#243028",
    secondary: "#647168",
    border: "#DEE5DE",
    accent: "#315F4E",
    accentText: "#FFFFFF",
    warm: "#C3A17B",
    warmText: "#243028",
    danger: "#B64D46",
    dangerButton: "#A73E38",
    success: "#315F4E",
  },
  dark: {
    background: "#171D19",
    surface: "#222A24",
    surfaceSoft: "#303E34",
    text: "#F3F1E8",
    secondary: "#B1B9B0",
    border: "#425147",
    accent: "#A7C5B0",
    accentText: "#16201A",
    warm: "#C3A17B",
    warmText: "#243028",
    danger: "#F0A098",
    dangerButton: "#9E4039",
    success: "#A7C5B0",
  },
} as const;

type AppContextValue = {
  ready: boolean;
  questions: Question[];
  language: Language;
  theme: Theme;
  colors: (typeof palette)[Theme];
  passwordConfigured: boolean;
  setLanguage: (value: Language) => Promise<void>;
  setTheme: (value: Theme) => Promise<void>;
  setupPassword: (value: string) => Promise<void>;
  checkPassword: (value: string) => boolean;
  createQuestion: (question: string, mode: QuestionMode, note: string) => Promise<string>;
  answerQuestion: (id: string, value: string) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  mergeQuestions: (incoming: Question[]) => Promise<number>;
};

const AppContext = createContext<AppContextValue | null>(null);
const environmentPassword = process.env.EXPO_PUBLIC_HISTORY_PASSWORD?.trim() || null;

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [language, updateLanguage] = useState<Language>("zh");
  const [theme, updateTheme] = useState<Theme>(systemTheme === "dark" ? "dark" : "light");
  const [localPassword, setLocalPassword] = useState<string | null>(null);
  const questionsRef = useRef<Question[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getStored(STORAGE_KEYS.questions),
      getStored(STORAGE_KEYS.language),
      getStored(STORAGE_KEYS.theme),
      getStored(STORAGE_KEYS.passcode),
    ]).then(([storedQuestions, storedLanguage, storedTheme, storedPassword]) => {
      if (!active) return;
      try {
        const parsed: unknown = storedQuestions ? JSON.parse(storedQuestions) : [];
        const valid = Array.isArray(parsed) ? parsed.filter(isQuestion) : [];
        questionsRef.current = valid;
        setQuestions(valid);
      } catch {
        questionsRef.current = [];
      }
      if (storedLanguage === "zh" || storedLanguage === "en") updateLanguage(storedLanguage);
      if (storedTheme === "light" || storedTheme === "dark") updateTheme(storedTheme);
      setLocalPassword(storedPassword);
      setReady(true);
    }).catch(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, []);

  async function commit(next: Question[]) {
    await setStored(STORAGE_KEYS.questions, JSON.stringify(next));
    questionsRef.current = next;
    setQuestions(next);
  }

  const value: AppContextValue = {
    ready,
    questions,
    language,
    theme,
    colors: palette[theme],
    passwordConfigured: Boolean(environmentPassword || localPassword),
    async setLanguage(next) {
      await setStored(STORAGE_KEYS.language, next);
      updateLanguage(next);
    },
    async setTheme(next) {
      await setStored(STORAGE_KEYS.theme, next);
      updateTheme(next);
    },
    async setupPassword(next) {
      if (environmentPassword) return;
      await setStored(STORAGE_KEYS.passcode, next);
      setLocalPassword(next);
    },
    checkPassword(input) {
      return input === (environmentPassword || localPassword);
    },
    async createQuestion(question, mode, note) {
      const id = makeId();
      await commit([{
        id,
        question: question.trim(),
        mode,
        note: note.trim(),
        createdAt: new Date().toISOString(),
        answer: null,
      }, ...questionsRef.current]);
      return id;
    },
    async answerQuestion(id, answer) {
      await commit(questionsRef.current.map((item) => item.id === id
        ? { ...item, answer: { value: answer.trim(), answeredAt: new Date().toISOString() } }
        : item));
    },
    async deleteQuestion(id) {
      await commit(questionsRef.current.filter((item) => item.id !== id));
    },
    async mergeQuestions(incoming) {
      const known = new Set(questionsRef.current.map((item) => item.id));
      const additions = incoming.filter((item) => {
        if (known.has(item.id)) return false;
        known.add(item.id);
        return true;
      });
      if (additions.length) {
        await commit([...questionsRef.current, ...additions]
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
      }
      return additions.length;
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
