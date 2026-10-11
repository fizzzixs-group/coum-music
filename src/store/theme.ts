/** Темы оформления: каждая — четыре цвета, остальное выводит CSS. */

import { create } from "zustand";

export type ThemeId =
  | "mint"
  | "green"
  | "salad"
  | "blue"
  | "cyan"
  | "violet"
  | "pink"
  | "dark"
  | "darkgray"
  | "gray"
  | "black"
  | "light";

export type Theme = {
  id: ThemeId;
  label: string;
  /** Акцент темы — из него CSS строит все роли Material 3. */
  primary: string;
  /** Фон плитки в списке тем (для превью). */
  base: string;
};

export const THEMES: Theme[] = [
  { id: "mint", label: "Мягко-зелёная", primary: "#5cd6b0", base: "#0c1211" },
  { id: "green", label: "Зелёная", primary: "#3ddc84", base: "#0c120e" },
  { id: "salad", label: "Салатовая", primary: "#c3e84a", base: "#11130c" },
  { id: "blue", label: "Синяя", primary: "#5b8dff", base: "#0e1116" },
  { id: "cyan", label: "Голубая", primary: "#4dd0e1", base: "#0b1214" },
  { id: "violet", label: "Фиолетовая", primary: "#b79cff", base: "#121016" },
  { id: "pink", label: "Розовая", primary: "#ff8fc0", base: "#150f12" },
  { id: "dark", label: "Тёмная", primary: "#a8c7fa", base: "#101014" },
  { id: "darkgray", label: "Тёмно-серая", primary: "#a9c7ff", base: "#1c1c20" },
  { id: "gray", label: "Серая", primary: "#cfd8ff", base: "#2b2b31" },
  { id: "black", label: "Чёрная", primary: "#e6e6e9", base: "#000000" },
  { id: "light", label: "Светлая", primary: "#415f91", base: "#f8f8fc" },
];

const STORAGE_KEY = "coum.theme";
const DEFAULT: ThemeId = "dark";

function isThemeId(value: string | null): value is ThemeId {
  return !!value && THEMES.some((t) => t.id === value);
}

/** Ставит тему на <html> — CSS сам пересчитает все роли. */
export function applyThemeDom(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
}

export function readStoredTheme(): ThemeId {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isThemeId(stored) ? stored : DEFAULT;
}

type ThemeState = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
};

export const useTheme = create<ThemeState>()((set) => ({
  theme: readStoredTheme(),
  setTheme: (id) => {
    localStorage.setItem(STORAGE_KEY, id);
    applyThemeDom(id);
    set({ theme: id });
  },
}));
