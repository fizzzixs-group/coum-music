/** Темы оформления: встроенные + свои, собранные из двух цветов. */

import { create } from "zustand";

export type BuiltinThemeId =
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

export type CustomThemeId = `custom:${string}`;

export type ThemeId = BuiltinThemeId | CustomThemeId;

export type Theme = {
  id: BuiltinThemeId;
  label: string;
  primary: string;
  base: string;
};

/** Своя тема: два цвета, из которых выводятся все оттенки. */
export type CustomTheme = {
  id: CustomThemeId;
  name: string;
  /** Основной цвет: кнопки, ползунки, спектр. */
  primary: string;
  /** Фон приложения. */
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
const CUSTOM_KEY = "coum.customThemes";
const DEFAULT: ThemeId = "dark";

// ── Цвет: разбор и подбор читаемого текста ────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Относительная яркость (WCAG). */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Текст поверх цвета: почти чёрный или белый. */
export function onColor(hex: string): string {
  return luminance(hex) > 0.45 ? "#101014" : "#ffffff";
}

/** Оттенок: сдвигаем яркость к свету (amount > 0) или к тени. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amount >= 0) {
    return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  }
  return rgbToHex(r * (1 + amount), g * (1 + amount), b * (1 + amount));
}

// ── Хранилище своих тем ───────────────────────────────────────────────

export function readCustom(): CustomTheme[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is CustomTheme =>
        !!t && typeof t.id === "string" && typeof t.primary === "string" && typeof t.base === "string",
    );
  } catch {
    return [];
  }
}

function saveCustom(list: CustomTheme[]): void {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
}

function findById(list: CustomTheme[], id: string): CustomTheme | undefined {
  return list.find((t) => t.id === id);
}

// ── Применение к документу ────────────────────────────────────────────

/** Ставит тему на <html>: встроенную — атрибутом, свою — переменными. */
export function applyThemeDom(id: ThemeId, custom: CustomTheme[] = readCustom()): void {
  const root = document.documentElement;

  if (id.startsWith("custom:")) {
    const theme = findById(custom, id);
    if (!theme) return;
    root.dataset.theme = "custom";
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--on-primary", onColor(theme.primary));
    root.style.setProperty("--base", theme.base);
    root.style.setProperty("--on-base", onColor(theme.base));
    return;
  }

  // Встроенная тема: убираем свои переменные, дальше решает CSS.
  root.style.removeProperty("--primary");
  root.style.removeProperty("--on-primary");
  root.style.removeProperty("--base");
  root.style.removeProperty("--on-base");
  root.dataset.theme = id;
}

export function readStoredTheme(custom: CustomTheme[] = readCustom()): ThemeId {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT;
  if (THEMES.some((t) => t.id === stored)) return stored as BuiltinThemeId;
  if (stored.startsWith("custom:") && findById(custom, stored)) return stored as CustomThemeId;
  return DEFAULT;
}

type ThemeState = {
  theme: ThemeId;
  custom: CustomTheme[];
  setTheme: (id: ThemeId) => void;
  saveCustomTheme: (theme: Omit<CustomTheme, "id"> & { id?: CustomThemeId }) => CustomThemeId;
  removeCustomTheme: (id: CustomThemeId) => void;
};

export const useTheme = create<ThemeState>()((set, get) => ({
  theme: readStoredTheme(),
  custom: readCustom(),

  setTheme: (id) => {
    localStorage.setItem(STORAGE_KEY, id);
    applyThemeDom(id, get().custom);
    set({ theme: id });
  },

  saveCustomTheme: (theme) => {
    const list = get().custom;
    const id = (theme.id ?? `custom:${Date.now().toString(36)}`) as CustomThemeId;
    const next: CustomTheme = {
      id,
      name: theme.name.trim() || "Своя тема",
      primary: theme.primary,
      base: theme.base,
    };
    const exists = list.some((t) => t.id === id);
    const merged = exists ? list.map((t) => (t.id === id ? next : t)) : [...list, next];
    saveCustom(merged);

    // Сразу применяем: человек должен увидеть результат.
    localStorage.setItem(STORAGE_KEY, id);
    applyThemeDom(id, merged);
    set({ custom: merged, theme: id });
    return id;
  },

  removeCustomTheme: (id) => {
    const list = get().custom.filter((t) => t.id !== id);
    saveCustom(list);
    // Если удалили активную тему — возвращаемся на тёмную.
    if (get().theme === id) {
      localStorage.setItem(STORAGE_KEY, DEFAULT);
      applyThemeDom(DEFAULT, list);
      set({ custom: list, theme: DEFAULT });
    } else {
      set({ custom: list });
    }
  },
}));
