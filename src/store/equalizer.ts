/** Эквалайзер: настройки хранятся локально и применяются к аудио-движку. */

import { create } from "zustand";

import { engine, EQ_FREQS, EQ_RANGE } from "@/audio/engine";

export { EQ_FREQS, EQ_RANGE };

export type EqPreset = {
  id: string;
  label: string;
  /** Усиление по полосам, дБ. */
  gains: number[];
};

export const EQ_PRESETS: EqPreset[] = [
  { id: "flat", label: "Плоский", gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "bass", label: "Бас", gains: [9, 8, 6, 3, 1, 0, -1, -1, 0, 0] },
  { id: "deep", label: "Сабвуфер", gains: [11, 9, 5, 1, -1, -2, -1, 0, 0, 0] },
  { id: "vocal", label: "Вокал", gains: [-3, -2, 0, 2, 4, 5, 4, 2, 0, -1] },
  { id: "treble", label: "Верх", gains: [0, 0, 0, 0, 0, 1, 3, 5, 7, 8] },
  { id: "electronic", label: "Электроника", gains: [6, 5, 2, 0, -1, 1, 2, 4, 6, 6] },
  { id: "rock", label: "Рок", gains: [5, 4, 1, -1, -2, 0, 2, 4, 6, 6] },
  { id: "loud", label: "Громкость", gains: [-5, -3, 0, 3, 6, 6, 4, 1, -1, -3] },
];

const STORAGE_KEY = "coum.eq.v1";

type Stored = { enabled: boolean; gains: number[]; preset: string };

function readStored(): Stored {
  const fallback: Stored = { enabled: false, gains: EQ_FREQS.map(() => 0), preset: "flat" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    const gains = Array.isArray(parsed.gains) && parsed.gains.length === EQ_FREQS.length
      ? parsed.gains.map((g) => clampGain(Number(g) || 0))
      : fallback.gains;
    return {
      enabled: Boolean(parsed.enabled),
      gains,
      preset: typeof parsed.preset === "string" ? parsed.preset : "flat",
    };
  } catch {
    return fallback;
  }
}

function clampGain(value: number): number {
  return Math.min(Math.max(value, -EQ_RANGE), EQ_RANGE);
}

type EqState = {
  enabled: boolean;
  gains: number[];
  preset: string;
  setEnabled: (enabled: boolean) => void;
  setBand: (index: number, gain: number) => void;
  applyPreset: (id: string) => void;
  reset: () => void;
};

function persist(state: Pick<EqState, "enabled" | "gains" | "preset">): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function push(state: Pick<EqState, "enabled" | "gains">): void {
  engine.setEqGains(state.gains);
  engine.setEqEnabled(state.enabled);
}

const initial = readStored();

export const useEqualizer = create<EqState>()((set, get) => ({
  ...initial,

  setEnabled: (enabled) => {
    const next = { ...get(), enabled };
    persist(next);
    push(next);
    set({ enabled });
  },

  setBand: (index, gain) => {
    const gains = get().gains.slice();
    gains[index] = clampGain(gain);
    // Ручная правка включает эквалайзер и сбрасывает пресет:
    // кривая больше не совпадает с ним.
    const next = { enabled: true, gains, preset: "custom" };
    persist(next);
    push(next);
    set(next);
  },

  applyPreset: (id) => {
    const preset = EQ_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const next = { enabled: true, gains: preset.gains.slice(), preset: id };
    persist(next);
    push(next);
    set(next);
  },

  reset: () => {
    const next = { enabled: false, gains: EQ_FREQS.map(() => 0), preset: "flat" };
    persist(next);
    push(next);
    set(next);
  },
}));

// Применяем сохранённые настройки сразу при загрузке модуля.
push(initial);
